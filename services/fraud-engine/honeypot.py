"""
honeypot.py
-----------
Active cyber-deception layer for the Fraud & Cyber-Security Engine.

The idea: plant decoy assets, shadow accounts, fake admin endpoints and
trap form fields that a legitimate user or UI will NEVER touch. Only an
attacker probing the system — a bot scraping the API, a script trying
transfers, a tool fuzzing endpoints — will ever hit one of these.

Any hit is, by definition, malicious. There is no false positive: real
traffic has no reason to reference a decoy. So a honeypot trigger is an
instant, non-negotiable BLOCK with no cooling-off and no override.

YOU (Kailash) own this file.

Four deception surfaces:
  1. Decoy investments  — fake SIP entries (DECOY_MIDCAP_FUND_001)
  2. Shadow accounts     — fake linked account XXXX9999
  3. Fake API endpoints  — /api/admin/users, /api/debug/dump, /api/internal/transfer
  4. Trap form fields    — a hidden `trap_field` no real form submits
"""

# ─────────────────────────────────────────────────────────────────
# Deception assets — these are planted in persona data by Member 5
# and mirrored here so the engine knows what counts as a trap hit.
# ─────────────────────────────────────────────────────────────────

# Honeypot 1 — Decoy Investments
DECOY_INVESTMENTS = {"DECOY_MIDCAP_FUND_001"}

# Honeypot 2 — Shadow Accounts
SHADOW_ACCOUNTS = {"XXXX9999"}

# Honeypot 3 — Fake API Endpoints (never hit by legitimate traffic)
HONEYPOT_PATHS = {
    "/api/admin/users",
    "/api/debug/dump",
    "/api/internal/transfer",
}

HONEYPOT_SCORE = 40  # informational; the decision is forced to BLOCK regardless


# ─────────────────────────────────────────────────────────────────
# Detector functions — one per deception surface
# Each returns (triggered: bool, reason: str)
# ─────────────────────────────────────────────────────────────────

def detect_decoy_investment(payload: dict) -> tuple[bool, str]:
    """Honeypot 1 — any action targeting a decoy fund is an attack probe."""
    action = payload.get("action_type", "")
    target = payload.get("target_fund", "")
    if action in DECOY_INVESTMENTS or target in DECOY_INVESTMENTS:
        return True, "Access to decoy investment DECOY_MIDCAP_FUND_001"
    return False, ""


def detect_shadow_account(payload: dict) -> tuple[bool, str]:
    """Honeypot 2 — any transfer to the shadow account is an attack probe."""
    if payload.get("target_account", "") in SHADOW_ACCOUNTS:
        return True, "Transfer attempted to shadow account XXXX9999"
    return False, ""


def detect_trap_field(payload: dict) -> tuple[bool, str]:
    """Honeypot 4 — a hidden form field only a bot would fill in."""
    if payload.get("trap_field", ""):
        return True, "Hidden trap form field was populated (bot behaviour)"
    return False, ""


def detect_fake_endpoint(path: str) -> tuple[bool, str]:
    """Honeypot 3 — any request to a decoy endpoint is an attack probe."""
    if path in HONEYPOT_PATHS:
        return True, f"Probe of decoy endpoint {path}"
    return False, ""


# ─────────────────────────────────────────────────────────────────
# SIGNAL 8 — Honeypot (runs FIRST, before every other signal)
# Score: +40, but a trigger forces an immediate BLOCK regardless of
# the total score. No cooling-off. No override.
# ─────────────────────────────────────────────────────────────────
def signal_honeypot(payload: dict, history: dict) -> dict:
    """
    Aggregate the payload-based deception detectors into a single signal.

    Note: fake-endpoint hits (Honeypot 3) are caught at the routing layer
    in api.py, not here, because they never carry an evaluate payload.
    """
    for detector in (detect_decoy_investment,
                     detect_shadow_account,
                     detect_trap_field):
        triggered, reason = detector(payload)
        if triggered:
            return {
                "signal":    "honeypot",
                "triggered": True,
                "score":     HONEYPOT_SCORE,
                "reason":    f"CYBER DECEPTION TRIGGERED — {reason}",
            }

    return {
        "signal":    "honeypot",
        "triggered": False,
        "score":     0,
        "reason":    "No honeypot interaction",
    }
