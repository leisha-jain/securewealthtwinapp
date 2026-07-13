"""
risk_scorer.py
--------------
Runs every signal against the incoming request and produces:
  - A numeric risk score  (0 – 100)
  - A risk level          (LOW / MEDIUM / HIGH)
  - A decision            (ALLOW / WARN / BLOCK)
  - The list of triggered signals with reasons

YOU own this file.
Tune THRESHOLDS here if the judges think the engine is too strict
or too lenient during the demo.
"""

from signals import ALL_SIGNALS


# ─────────────────────────────────────────────────────────────────
# Decision thresholds  ← tune these before the demo
# ─────────────────────────────────────────────────────────────────
THRESHOLDS = {
    "LOW":    (0,  30),   # score 0–30   → ALLOW
    "MEDIUM": (31, 55),   # score 31–55  → WARN  (30-second cooling-off)
    "HIGH":   (56, 100),  # score 56–100 → BLOCK
}

DECISION_MAP = {
    "LOW":    "ALLOW",
    "MEDIUM": "WARN",
    "HIGH":   "BLOCK",
}

USER_MESSAGES = {
    "ALLOW":  "Your action has been approved. Proceeding safely.",
    "WARN":   "We noticed some unusual patterns with this action. "
              "Please review the details below and confirm after the "
              "30-second security pause.",
    "BLOCK":  "This action has been blocked for your protection. "
              "If this was you, please call our helpline: 1800-XXX-XXXX "
              "or visit your nearest branch with a valid ID.",
}

# Shown when the cyber-deception layer fires — this is an attack, not a
# confused customer, so the message is blunt and there is no cooling-off.
HONEYPOT_MESSAGE = (
    "This session has been terminated. An automated attack probe accessed "
    "a decoy asset. This event has been logged and flagged to security."
)


def compute_risk_score(payload: dict, history: dict) -> dict:
    """
    Run every signal function and aggregate the results.

    Parameters
    ----------
    payload : dict
        The incoming action request from the API.
        Contains fields like amount, device_id, timestamps, etc.

    history : dict
        The user's stored behavioural baseline.
        Contains fields like avg_transaction_amount, trusted_devices, etc.

    Returns
    -------
    dict with keys:
        risk_score        : int  (0-100, capped)
        risk_level        : str  (LOW / MEDIUM / HIGH)
        decision          : str  (ALLOW / WARN / BLOCK)
        triggered_signals : list of dicts (only the signals that fired)
        all_signals       : list of dicts (all signals evaluated)
        message           : str  (user-facing explanation)
    """
    all_results      = []
    triggered        = []
    total_score      = 0
    honeypot_hit     = False

    for signal_fn in ALL_SIGNALS:
        result = signal_fn(payload, history)
        all_results.append(result)
        if result["triggered"]:
            triggered.append(result)
            total_score += result["score"]
            if result["signal"] == "honeypot":
                honeypot_hit = True

    # Continuous-auth tightening: if this session has already crossed the
    # risk threshold, every new action starts pre-penalised (see user_store).
    if history.get("session_prepenalty"):
        total_score += 15

    # Cap at 100
    total_score = min(total_score, 100)

    # ── Honeypot override ──────────────────────────────────────────
    # A decoy asset was touched. This is an attacker, full stop. Force
    # an immediate BLOCK regardless of the numeric score — no cooling-off,
    # no override, no WARN.
    if honeypot_hit:
        return {
            "risk_score":        max(total_score, 100),
            "risk_level":        "HIGH",
            "decision":          "BLOCK",
            "triggered_signals": triggered,
            "all_signals":       all_results,
            "message":           HONEYPOT_MESSAGE,
            "honeypot":          True,
        }

    # Determine risk level
    if total_score <= THRESHOLDS["LOW"][1]:
        risk_level = "LOW"
    elif total_score <= THRESHOLDS["MEDIUM"][1]:
        risk_level = "MEDIUM"
    else:
        risk_level = "HIGH"

    decision = DECISION_MAP[risk_level]
    message  = USER_MESSAGES[decision]

    return {
        "risk_score":        total_score,
        "risk_level":        risk_level,
        "decision":          decision,
        "triggered_signals": triggered,
        "all_signals":       all_results,
        "message":           message,
        "honeypot":          False,
    }
