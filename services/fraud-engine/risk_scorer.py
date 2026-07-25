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
    # ── Honeypot early check ──────────────────────────────────────────
    honeypot_hit = False
    from signals import signal_honeypot
    hp_res = signal_honeypot(payload, history)
    if hp_res["triggered"]:
        honeypot_hit = True

    if honeypot_hit:
        return {
            "risk_score":        100,
            "risk_level":        "HIGH",
            "decision":          "BLOCK",
            "triggered_signals": [hp_res],
            "all_signals":       [hp_res],
            "message":           HONEYPOT_MESSAGE,
            "honeypot":          True,
        }

    # Auto-approve non-financial or low-amount actions
    action_type = payload.get("actionType", payload.get("action_type", ""))
    amount = float(payload.get("amount", 0))
    high_risk_actions = {"TRANSFER", "LIQUIDATE", "REBALANCE", "START_SIP", "WITHDRAW"}

    # Normalize action type to uppercase and match common formats (e.g. start_sip -> START_SIP, large_transfer -> TRANSFER)
    action_type_upper = action_type.upper()
    normalized_action = ""
    if "SIP" in action_type_upper:
        normalized_action = "START_SIP"
    elif "TRANSFER" in action_type_upper:
        normalized_action = "TRANSFER"
    elif "REBALANCE" in action_type_upper:
        normalized_action = "REBALANCE"
    elif "LIQUIDATE" in action_type_upper:
        normalized_action = "LIQUIDATE"
    elif "WITHDRAW" in action_type_upper:
        normalized_action = "WITHDRAW"
    else:
        normalized_action = action_type_upper

    if normalized_action not in high_risk_actions or (amount > 0 and amount < 5000):
        return {
            "risk_score":        0,
            "risk_level":        "LOW",
            "decision":          "ALLOW",
            "triggered_signals": [],
            "all_signals":       [],
            "message":           "Approved automatically: low risk action.",
            "honeypot":          False,
        }

    all_results      = []
    triggered        = []
    total_score      = 0

    for signal_fn in ALL_SIGNALS:
        result = signal_fn(payload, history)
        all_results.append(result)
        if result["triggered"]:
            triggered.append(result)
            total_score += result["score"]

    # ── Feature 1: Salary Day Dynamic Weight Escalation ───────────────
    payday_triggered = False
    for res in all_results:
        if res["signal"] == "payday_window" and res["triggered"]:
            payday_triggered = True

    if payday_triggered:
        # Increase amount_anomaly score from +25 to +35 if it fired
        for res in triggered:
            if res["signal"] == "amount_anomaly":
                res["score"] = 35
                res["reason"] += " (Payday window escalation: +10 risk weight)"
        # Recalculate base total_score
        total_score = sum(r["score"] for r in triggered)

    # ── Feature 8: Seasonal Fraud Calendar Multiplier ─────────────────
    seasonal_modifier = 1.0
    for res in all_results:
        if res["signal"] == "seasonal_calendar" and res["triggered"]:
            seasonal_modifier = res.get("modifier", 1.0)

    if seasonal_modifier > 1.0:
        total_score = int(round(total_score * seasonal_modifier))

    # ── Feature 5: Emotion-Aware Transaction Delay ──────────────────
    if payload.get("emotional_context") == "post_loss_view":
        total_score += 8

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

    # ── Feature 1: Salary Day Threshold Shift ───────────────────────
    # Drop the WARN threshold from 31 to 25 during payday window
    warn_min = 25 if payday_triggered else THRESHOLDS["MEDIUM"][0]

    # Determine risk level
    if total_score < warn_min:
        risk_level = "LOW"
    elif total_score <= THRESHOLDS["MEDIUM"][1]:
        risk_level = "MEDIUM"
    else:
        risk_level = "HIGH"

    decision = DECISION_MAP[risk_level]
    message  = USER_MESSAGES[decision]

    # ── Feature 10: Night Lock (Transaction Lullaby) ────────────────
    if payload.get("night_lock_active", False) and decision == "ALLOW":
        decision = "WARN"
        total_score = max(total_score, 35)
        risk_level = "MEDIUM"
        message = "This action is flagged because your Night Lock (Silent Hours Protection) is currently enabled."

    # Append seasonal warning message if seasonal is triggered
    if seasonal_modifier > 1.0 and decision == "WARN":
        message += " Flagged due to elevated seasonal fraud calendar activity in India."

    return {
        "risk_score":        total_score,
        "risk_level":        risk_level,
        "decision":          decision,
        "triggered_signals": triggered,
        "all_signals":       all_results,
        "message":           message,
        "honeypot":          False,
    }
