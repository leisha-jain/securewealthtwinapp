"""
SecureWealth Twin — Mock Account Aggregator Service
Author: Sarthak Pandit (Data Engineer, Team 51)

Simulates an RBI Account Aggregator (AA) framework response.
Real AA framework: NBFC-AA licensed entities (Finvu, OneMoney, CAMS) pull
financial data from FIPs (banks, MFs, insurers) and serve it to FIUs (apps).

This mock returns:
  - Consolidated user financial data from local persona JSON files
  - Honeypot account XXXX9999 injected in every response (for fraud engine)
  - Market snapshot from market_snapshot.json
  - Per-user transaction history
  - Per-user portfolio summary

Endpoints (when run as FastAPI service on port 8004):
  GET  /health                               — service health check
  GET  /api/aggregator/profile/{user_id}     — full user profile
  GET  /api/aggregator/transactions/{user_id}— transaction history
  GET  /api/aggregator/portfolio/{user_id}   — portfolio summary
  GET  /api/aggregator/market                — market snapshot
  GET  /api/aggregator/market/trending       — trending stocks only
  POST /api/aggregator/consent               — log consent grant

Run: uvicorn mock_aggregator:app --port 8004 --reload
"""

import json
import os
from pathlib import Path
from datetime import datetime
from typing import Optional

try:
    from fastapi import FastAPI, HTTPException
    from fastapi.responses import JSONResponse
    import uvicorn
    FASTAPI_AVAILABLE = True
except ImportError:
    FASTAPI_AVAILABLE = False

DATA_DIR = Path(__file__).parent
PERSONAS_DIR = DATA_DIR / "personas"
MARKET_SNAPSHOT_PATH = DATA_DIR / "market_snapshot.json"

# ──────────────────────────────────────────────────────────
# Data loading utilities
# ──────────────────────────────────────────────────────────

def load_persona(user_id: str) -> dict:
    path = PERSONAS_DIR / f"{user_id}.json"
    if not path.exists():
        raise FileNotFoundError(f"Persona '{user_id}' not found.")
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def load_market_snapshot() -> dict:
    if not MARKET_SNAPSHOT_PATH.exists():
        return {"error": "market_snapshot.json not found"}
    with open(MARKET_SNAPSHOT_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def list_personas() -> list:
    return [p.stem for p in PERSONAS_DIR.glob("*.json")]


def build_aa_profile_response(persona: dict) -> dict:
    """
    Build an Account Aggregator-style profile response.
    Injects honeypot account XXXX9999 in linked_accounts.
    """
    return {
        "consent_id": f"CONSENT-{persona['user_id'].upper()}-{datetime.now().strftime('%Y%m%d')}",
        "consent_status": "ACTIVE",
        "fip_id": "SECUREWEALTH-MOCK-FIP",
        "timestamp": datetime.now().isoformat(),
        "profile": {
            "user_id": persona["user_id"],
            "name": persona.get("name"),
            "age": persona.get("age"),
            "city": persona.get("city"),
            "occupation": persona.get("occupation"),
            "kyc_status": persona.get("session_metadata", {}).get("kyc_status", "pending"),
        },
        "financial_profile": persona.get("financial_profile", {}),
        "linked_accounts": _build_linked_accounts(persona),
        "portfolio_summary": _build_portfolio_summary(persona),
        "goals": persona.get("goals", []),
        "insurance": persona.get("insurance", []),
        "tax_profile": {k: v for k, v in persona.get("tax_profile", {}).items() if k != "pan"},
        "spending_categories": persona.get("spending_categories", {}),
        "honeypot_assets": persona.get("honeypot_assets", []),
        "trap_field_label": persona.get("trap_field_label", "_csrf_token_backup"),
        "transaction_count": len(persona.get("transactions", [])),
        "transaction_metadata": persona.get("transaction_metadata", {}),
    }


def _build_linked_accounts(persona: dict) -> list:
    """Always injects honeypot account XXXX9999 at the end."""
    accounts = [
        {"account": a.get("account"), "bank": a.get("bank"), "type": a.get("type"), "balance": a.get("balance")}
        for a in persona.get("bank_accounts", [])
    ]
    accounts.append({"account": "XXXX9999", "bank": "SHADOW_BANK", "type": "honeypot_account", "balance": 0, "_honeypot": True})
    return accounts


def _build_portfolio_summary(persona: dict) -> dict:
    portfolio = persona.get("portfolio", {})
    fp = persona.get("financial_profile", {})
    equity_value = sum(s.get("value", 0) for s in portfolio.get("equity", []))
    mf_value = sum(m.get("current_value", 0) for m in portfolio.get("mutual_funds", []))
    gold_value = sum(g.get("value", g.get("current_value", 0)) for g in portfolio.get("gold", []))
    fd_value = sum(f.get("principal", 0) for f in portfolio.get("fd", []))
    cash = portfolio.get("cash_savings", 0)
    re_value = sum(r.get("current_value", 0) for r in portfolio.get("real_estate", []))
    ppf_balance = portfolio.get("ppf", {}).get("balance", 0)
    total = equity_value + mf_value + gold_value + fd_value + cash + re_value + ppf_balance
    return {
        "total_portfolio_value": total,
        "breakdown": {
            "equity": round(equity_value, 2), "mutual_funds": round(mf_value, 2),
            "gold": round(gold_value, 2), "fixed_deposits": round(fd_value, 2),
            "real_estate": round(re_value, 2), "ppf": round(ppf_balance, 2), "cash": round(cash, 2),
        },
        "allocation_pct": {
            "equity": fp.get("equity_allocation", 0), "debt": fp.get("debt_allocation", 0),
            "gold": fp.get("gold_allocation", 0), "fd": fp.get("fd_allocation", 0),
        },
        "net_worth": fp.get("net_worth", 0),
        "monthly_sip": fp.get("monthly_sip_amount", 0),
    }


# ──────────────────────────────────────────────────────────
# FastAPI App
# ──────────────────────────────────────────────────────────

if FASTAPI_AVAILABLE:
    app = FastAPI(
        title="SecureWealth Twin — Mock Account Aggregator",
        description="Mock RBI Account Aggregator for hackathon demo. Team 51.",
        version="1.0.0",
    )

    INTERNAL_SECRET = os.getenv("INTERNAL_SECRET", "swt-2026")

    from fastapi import Request

    @app.middleware("http")
    async def zero_trust(request: Request, call_next):
        if request.url.path != "/health":
            if request.headers.get("X-Internal-Token") != INTERNAL_SECRET:
                return JSONResponse({"error": "Unauthorized"}, status_code=401)
        return await call_next(request)

    @app.get("/health")
    def health():
        return {"status": "ok", "service": "mock_aggregator", "port": 8004}

    @app.get("/api/aggregator/personas")
    def get_personas():
        return {"personas": list_personas()}

    @app.get("/api/aggregator/profile/{user_id}")
    def get_profile(user_id: str):
        try:
            persona = load_persona(user_id)
        except FileNotFoundError:
            raise HTTPException(status_code=404, detail=f"User '{user_id}' not found.")
        return build_aa_profile_response(persona)

    @app.get("/api/aggregator/transactions/{user_id}")
    def get_transactions(user_id: str, limit: int = 100, offset: int = 0,
                         category: Optional[str] = None, year: Optional[int] = None,
                         month: Optional[int] = None):
        try:
            persona = load_persona(user_id)
        except FileNotFoundError:
            raise HTTPException(status_code=404, detail=f"User '{user_id}' not found.")
        txns = persona.get("transactions", [])
        if category:
            txns = [t for t in txns if t.get("category") == category]
        if year:
            txns = [t for t in txns if t.get("year") == year]
        if month:
            txns = [t for t in txns if t.get("month") == month]
        total = len(txns)
        return {"user_id": user_id, "total": total, "offset": offset, "limit": limit,
                "transactions": txns[offset: offset + limit]}

    @app.get("/api/aggregator/portfolio/{user_id}")
    def get_portfolio(user_id: str):
        try:
            persona = load_persona(user_id)
        except FileNotFoundError:
            raise HTTPException(status_code=404, detail=f"User '{user_id}' not found.")
        return _build_portfolio_summary(persona)

    @app.get("/api/aggregator/market")
    def get_market():
        return load_market_snapshot()

    @app.get("/api/aggregator/market/trending")
    def get_trending():
        snapshot = load_market_snapshot()
        return {"trending_stocks": snapshot.get("trending_stocks", []),
                "market_alerts": snapshot.get("market_alerts", []),
                "snapshot_date": snapshot.get("snapshot_date")}

    @app.post("/api/aggregator/consent")
    async def log_consent(request: Request):
        body = await request.json()
        return {
            "consent_id": f"CONSENT-{body.get('user_id','ANON').upper()}-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "status": "ACTIVE",
            "granted_at": datetime.now().isoformat(),
            "expires_at": "2026-12-31T23:59:59",
            "fip": "SECUREWEALTH-MOCK-FIP",
            "message": "Consent recorded. Data sharing active.",
        }

    if __name__ == "__main__":
        uvicorn.run("mock_aggregator:app", host="0.0.0.0", port=8004, reload=True)

else:
    if __name__ == "__main__":
        print("FastAPI not installed. Running in standalone test mode.\n")
        print("Available personas:", list_personas())
        print("\nSample profile for priya_27:")
        try:
            p = load_persona("priya_27")
            resp = build_aa_profile_response(p)
            print(json.dumps({k: v for k, v in resp.items() if k != "transactions"}, indent=2, ensure_ascii=False))
        except Exception as e:
            print(f"Error: {e}")
        print("\nMarket Snapshot (macro indicators):")
        snap = load_market_snapshot()
        print(json.dumps(snap.get("macro_indicators", {}), indent=2))
