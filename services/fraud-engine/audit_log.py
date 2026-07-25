"""
audit_log.py
------------
Records every risk evaluation in chronological order.
Member 1's UI fetches this to show the audit trail panel.
Member 4's gateway calls GET /api/risk/history/:user_id to read it.

In a real bank this would be written to an immutable database.
For the hackathon, this is an in-memory list per user.
"""

from datetime import datetime, timezone
from typing import Optional

# user_id → list of log entries (newest first)
_LOG: dict[str, list] = {
    "probe@127.0.0.1": [
        {
            "timestamp": "2026-07-14T10:42:31.000Z",
            "user_id": "probe@127.0.0.1",
            "action_type": "/api/admin/users",
            "amount": 0,
            "risk_score": 100,
            "risk_level": "HIGH",
            "decision": "HONEYPOT_TRIGGERED",
            "severity": "CRITICAL",
            "triggered_signals": ["honeypot"],
            "signal_reasons": ["An automated attack probe accessed a decoy asset. Session terminated."],
        }
    ],
    "suspicious_actor": [
        {
            "timestamp": "2026-07-14T10:38:12.000Z",
            "user_id": "suspicious_actor",
            "action_type": "transfer",
            "amount": 120000,
            "risk_score": 90,
            "risk_level": "HIGH",
            "decision": "BLOCK",
            "severity": "CRITICAL",
            "triggered_signals": ["new_device", "night_transfer", "amount_anomaly"],
            "signal_reasons": ["Multiple fraud signals: new device, night transfer, amount 3x avg."],
        }
    ],
    "3": [
        {
            "timestamp": "2026-07-14T10:30:05.000Z",
            "user_id": "3",
            "action_type": "investment",
            "amount": 25000,
            "risk_score": 40,
            "risk_level": "MEDIUM",
            "decision": "WARN",
            "severity": "WARNING",
            "triggered_signals": ["first_investment"],
            "signal_reasons": ["First-time fund type detected."],
        }
    ],
    "2": [
        {
            "timestamp": "2026-07-14T10:22:18.000Z",
            "user_id": "2",
            "action_type": "sip",
            "amount": 3000,
            "risk_score": 12,
            "risk_level": "LOW",
            "decision": "ALLOW",
            "severity": "INFO",
            "triggered_signals": [],
            "signal_reasons": ["No risk signals detected."],
        }
    ]
}

MAX_ENTRIES_PER_USER = 50  # keep last 50 entries per user

# Map a decision to an audit severity. HONEYPOT_TRIGGERED is its own
# special event type and always CRITICAL — it means an active attack
# probe touched one of our decoy assets.
_SEVERITY = {
    "ALLOW":              "INFO",
    "WARN":               "WARNING",
    "BLOCK":              "CRITICAL",
    "HONEYPOT_TRIGGERED": "CRITICAL",
}


def _severity_for(decision: str) -> str:
    return _SEVERITY.get(decision, "INFO")


def record(
    user_id:          str,
    action_type:      str,
    amount:           float,
    risk_score:       int,
    risk_level:       str,
    decision:         str,
    triggered_signals: list,
) -> dict:
    """
    Write one audit entry.
    Returns the entry so the API can include it in the response.
    """
    entry = {
        "timestamp":         datetime.now(timezone.utc).isoformat(),
        "user_id":           user_id,
        "action_type":       action_type,
        "amount":            amount,
        "risk_score":        risk_score,
        "risk_level":        risk_level,
        "decision":          decision,
        "severity":          _severity_for(decision),
        "triggered_signals": [s["signal"] for s in triggered_signals],
        "signal_reasons":    [s["reason"]  for s in triggered_signals],
    }

    if user_id not in _LOG:
        _LOG[user_id] = []

    _LOG[user_id].insert(0, entry)          # newest first

    # Trim to max
    if len(_LOG[user_id]) > MAX_ENTRIES_PER_USER:
        _LOG[user_id] = _LOG[user_id][:MAX_ENTRIES_PER_USER]

    return entry


def record_honeypot(user_id: str, source: str, detail: str) -> dict:
    """
    Write a special HONEYPOT_TRIGGERED audit entry (severity CRITICAL).

    Used when an attacker probe hits a decoy endpoint or a decoy asset.
    `source` is where the probe landed (e.g. the endpoint path);
    `detail` is a human-readable description for the audit UI.
    """
    entry = {
        "timestamp":         datetime.now(timezone.utc).isoformat(),
        "user_id":           user_id or "unknown_attacker",
        "action_type":       source,
        "amount":            0,
        "risk_score":        100,
        "risk_level":        "HIGH",
        "decision":          "HONEYPOT_TRIGGERED",
        "severity":          "CRITICAL",
        "triggered_signals": ["honeypot"],
        "signal_reasons":    [detail],
    }

    key = user_id or "unknown_attacker"
    _LOG.setdefault(key, []).insert(0, entry)
    if len(_LOG[key]) > MAX_ENTRIES_PER_USER:
        _LOG[key] = _LOG[key][:MAX_ENTRIES_PER_USER]

    return entry


def get_history(user_id: str, limit: int = 10) -> list:
    """Return the last `limit` audit entries for a user."""
    return _LOG.get(user_id, [])[:limit]


def get_all_history(limit: int = 50) -> list:
    """Return audit entries across all users (for admin/demo view)."""
    all_entries = []
    for entries in _LOG.values():
        all_entries.extend(entries)
    all_entries.sort(key=lambda e: e["timestamp"], reverse=True)
    return all_entries[:limit]
