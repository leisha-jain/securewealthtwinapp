"""
api.py
------
FastAPI application for the Fraud & Cyber-Security Engine.
Runs on port 8002.

Endpoints:
  POST /api/risk/evaluate        ← main endpoint, called by Member 4's gateway
  GET  /api/risk/history/:uid    ← audit trail, called by Member 1's UI via gateway
  GET  /api/risk/history/all     ← all users (for demo admin view)
  POST /api/risk/trust-device    ← called after a user confirms a WARN action
  GET  /health                   ← Member 4 polls this on startup

Run locally:
  uvicorn api:app --reload --port 8002
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timezone
import os
import time

from risk_scorer import compute_risk_score
from user_store  import (get_user_history, update_trusted_device,
                          record_action_type, update_avg_amount, list_users,
                          update_velocity, check_velocity,
                          register_session_device, session_prepenalty,
                          accumulate_session_risk, reset_session)
from audit_log   import (record as audit_record, record_honeypot,
                          get_history, get_all_history)
from honeypot    import HONEYPOT_PATHS, detect_fake_endpoint

# ─────────────────────────────────────────────────────────────────
app = FastAPI(
    title        = "SecureWealth Twin — Fraud & Cyber-Security Engine",
    description  = "Evaluates every wealth action for fraud risk before execution.",
    version      = "1.0.0",
)

_CORS_ORIGINS = [o.strip() for o in os.getenv(
    "CORS_ORIGINS", "http://localhost:3000,http://localhost:8100"
).split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins  = _CORS_ORIGINS,
    allow_methods  = ["*"],
    allow_headers  = ["*"],
)


# ─────────────────────────────────────────────────────────────────
# ZERO-TRUST INTER-SERVICE AUTHENTICATION
# -----------------------------------------------------------------
# "Never trust, always verify" — even for calls that originate inside
# our own network. Every request must carry the shared X-Internal-Token
# header (injected by Member 4's gateway). Without it → 401.
#
# Exemptions:
#   * /health and /            — liveness probes must stay open
#   * CORS pre-flight OPTIONS   — carries no custom headers by design
#   * the honeypot decoy paths  — those are MEANT to be reachable by an
#     attacker so we can trap and log them (they return 403 themselves)
# ─────────────────────────────────────────────────────────────────
INTERNAL_SECRET = os.getenv("INTERNAL_SECRET", "swt-2026")

_ZERO_TRUST_EXEMPT = {"/health", "/"} | HONEYPOT_PATHS


@app.middleware("http")
async def zero_trust(request: Request, call_next):
    path = request.url.path
    if request.method != "OPTIONS" and path not in _ZERO_TRUST_EXEMPT:
        if request.headers.get("X-Internal-Token") != INTERNAL_SECRET:
            return JSONResponse(
                {"error": "Unauthorized — missing or invalid internal token"},
                status_code=401,
            )
    return await call_next(request)


# ─────────────────────────────────────────────────────────────────
# REQUEST MODELS
# ─────────────────────────────────────────────────────────────────

class EvaluateRequest(BaseModel):
    """
    Payload Member 4 sends when a user attempts a wealth action.
    All fields except user_id and amount are optional —
    missing fields are treated as the safest possible value.
    """
    user_id:           str   = Field(...,   example="priya_27")
    action_type:       str   = Field(...,   example="start_sip",
                                     description="e.g. start_sip, renew_fd, rebalance, book_gold")
    amount:            float = Field(...,   example=50000,
                                     description="Transaction amount in INR")

    # Device & session
    device_id:         str   = Field("",    example="device_priya_phone")
    login_timestamp:   Optional[str] = Field(None, example="2026-04-20T22:55:00")
    action_timestamp:  Optional[str] = Field(None, example="2026-04-20T22:55:07")

    # OTP
    otp_attempts:      int   = Field(1,     example=1)

    # Retry
    retry_count:       int   = Field(0,     example=0)

    # ── Honeypot deception fields (Signal 8) ──────────────────────
    # These are traps. Legitimate UIs never populate them; only an
    # attacker probing the API will. Any value here = instant BLOCK.
    trap_field:        str   = Field("",    example="",
                                     description="Hidden trap field — bots fill this in")
    target_account:    str   = Field("",    example="",
                                     description="Destination account — XXXX9999 is a shadow decoy")
    target_fund:       str   = Field("",    example="",
                                     description="Target fund — DECOY_MIDCAP_FUND_001 is a decoy")


class TrustDeviceRequest(BaseModel):
    user_id:   str = Field(..., example="priya_27")
    device_id: str = Field(..., example="device_priya_new_phone")


# ─────────────────────────────────────────────────────────────────
# RESPONSE MODELS
# ─────────────────────────────────────────────────────────────────

class SignalResult(BaseModel):
    signal:    str
    triggered: bool
    score:     int
    reason:    str


class EvaluateResponse(BaseModel):
    user_id:           str
    action_type:       str
    amount:            float
    risk_score:        int
    risk_level:        str          # LOW / MEDIUM / HIGH
    decision:          str          # ALLOW / WARN / BLOCK
    honeypot:          bool          # True → cyber-deception layer fired
    triggered_signals: list[SignalResult]
    all_signals:       list[SignalResult]
    message:           str
    processing_ms:     float
    audit_entry:       dict


# ─────────────────────────────────────────────────────────────────
# ENDPOINTS
# ─────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    """Quick health check — Member 4 polls this on startup."""
    return {"status": "ok", "service": "fraud-engine", "port": 8002}


@app.get("/api/risk/users")
def get_users():
    """List all known user IDs — useful during demo setup."""
    return {"users": list_users()}


@app.post("/api/risk/evaluate", response_model=EvaluateResponse)
def evaluate(req: EvaluateRequest):
    """
    MAIN ENDPOINT.
    Member 4 (API Gateway) calls this before executing any wealth action.

    Flow:
    1. Fetch the user's behavioural baseline from user_store
    2. Run all 7 fraud signals against the payload
    3. Aggregate into a risk score and decision
    4. Write to audit log
    5. Return full result to Member 4

    Member 4 then:
    - Returns BLOCK immediately — action does not execute
    - Returns WARN to Member 1 — UI shows 30s cooling-off modal
    - Returns ALLOW — action proceeds
    """
    t_start = time.perf_counter()

    # 1. Get user history
    stored = get_user_history(req.user_id)
    if stored is None:
        # Unknown user — treat as high risk
        stored = {
            "trusted_devices":        [],
            "avg_transaction_amount": 0,
            "past_action_types":      [],
        }

    # Work on a shallow copy so the transient per-request flags we inject
    # below (velocity, device change, session pre-penalty) never leak into
    # the persistent behavioural baseline.
    history = dict(stored)

    # 2. Velocity + session state (Signals 9 & 10 + continuous auth)
    now = datetime.now(timezone.utc)
    update_velocity(req.user_id, now)
    history["velocity_abuse"]     = check_velocity(req.user_id)
    history["device_changed"]     = register_session_device(req.user_id, req.device_id)
    history["session_prepenalty"] = session_prepenalty(req.user_id)

    # 3. Build payload dict for signal functions
    payload = req.model_dump()

    # 4. Score
    result = compute_risk_score(payload, history)

    # Feed this decision back into the session risk accumulator so the
    # NEXT action in the session is judged in light of this one.
    accumulate_session_risk(req.user_id, result["decision"])

    # 4b. Audit
    audit_entry = audit_record(
        user_id           = req.user_id,
        action_type       = req.action_type,
        amount            = req.amount,
        risk_score        = result["risk_score"],
        risk_level        = result["risk_level"],
        decision          = result["decision"],
        triggered_signals = result["triggered_signals"],
    )

    elapsed_ms = round((time.perf_counter() - t_start) * 1000, 2)

    return EvaluateResponse(
        user_id           = req.user_id,
        action_type       = req.action_type,
        amount            = req.amount,
        risk_score        = result["risk_score"],
        risk_level        = result["risk_level"],
        decision          = result["decision"],
        honeypot          = result.get("honeypot", False),
        triggered_signals = result["triggered_signals"],
        all_signals       = result["all_signals"],
        message           = result["message"],
        processing_ms     = elapsed_ms,
        audit_entry       = audit_entry,
    )


@app.get("/api/risk/history/all")
def all_history(limit: int = 20):
    """
    Return audit log across all users.
    Used in the demo admin / audit dashboard view.
    """
    return {"entries": get_all_history(limit=limit)}


@app.get("/api/risk/history/{user_id}")
def user_history(user_id: str, limit: int = 10):
    """
    Return the last N audit entries for a specific user.
    Member 1's UI calls this (via Member 4's gateway) to show
    the audit trail panel on the dashboard.
    """
    entries = get_history(user_id, limit=limit)
    return {
        "user_id": user_id,
        "count":   len(entries),
        "entries": entries,
    }


@app.post("/api/risk/trust-device")
def trust_device(req: TrustDeviceRequest):
    """
    Called after a user successfully completes a WARN action
    (i.e., they waited through the cooling-off period and confirmed).
    Adds the device to the user's trusted list so it won't fire again.
    """
    history = get_user_history(req.user_id)
    if history is None:
        raise HTTPException(status_code=404, detail="User not found")

    update_trusted_device(req.user_id, req.device_id)
    return {
        "message":        f"Device {req.device_id} is now trusted for {req.user_id}",
        "trusted_devices": get_user_history(req.user_id)["trusted_devices"],
    }


@app.get("/api/risk/velocity/{user_id}")
def velocity(user_id: str):
    """
    Report whether a user is currently exceeding the velocity threshold
    (5+ actions in 10 minutes). Member 4's gateway proxies this.
    """
    return {"user_id": user_id, "velocity_abuse": check_velocity(user_id)}


@app.post("/api/risk/logout")
def logout(req: TrustDeviceRequest):
    """
    Clear session state (device pin, risk accumulator, velocity window).
    Called when a user logs out so the next login starts a clean session.
    """
    reset_session(req.user_id)
    return {"message": f"Session reset for {req.user_id}"}


# ─────────────────────────────────────────────────────────────────
# HONEYPOT DECOY ENDPOINTS (Honeypot 3 — Fake API Endpoints)
# -----------------------------------------------------------------
# These routes look like juicy targets — admin user dumps, debug data,
# internal transfers — but no legitimate client ever calls them. Any
# request that reaches one is, by definition, an attacker probing the
# API. We log a CRITICAL HONEYPOT_TRIGGERED audit event and return 403.
#
# They are exempt from the zero-trust middleware on purpose: we WANT an
# attacker (who has no internal token) to be able to reach and trip them.
# ─────────────────────────────────────────────────────────────────

def _trip_honeypot(request: Request):
    path = request.url.path
    _, detail = detect_fake_endpoint(path)
    attacker = request.client.host if request.client else "unknown"
    record_honeypot(
        user_id = f"probe@{attacker}",
        source  = path,
        detail  = detail or f"Probe of decoy endpoint {path}",
    )
    return JSONResponse(
        {"error": "Forbidden", "detail": "This access has been logged."},
        status_code=403,
    )


@app.api_route("/api/admin/users", methods=["GET", "POST"])
def honeypot_admin_users(request: Request):
    return _trip_honeypot(request)


@app.api_route("/api/debug/dump", methods=["GET", "POST"])
def honeypot_debug_dump(request: Request):
    return _trip_honeypot(request)


@app.api_route("/api/internal/transfer", methods=["GET", "POST"])
def honeypot_internal_transfer(request: Request):
    return _trip_honeypot(request)
