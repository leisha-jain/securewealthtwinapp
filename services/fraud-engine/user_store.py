"""
user_store.py
-------------
Simulates a database of user behavioural baselines.
In a real bank this would be a proper database.
For the hackathon this is an in-memory dict that also
updates in real-time as actions are performed.

YOU own this file.
The 5 personas here match Member 5's JSON files exactly.
"""

from typing import Optional
from copy import deepcopy
from collections import deque
from datetime import datetime, timezone

# ─────────────────────────────────────────────────────────────────
# Default user history profiles
# These mirror the personas in data/personas/
# ─────────────────────────────────────────────────────────────────
_DEFAULT_USERS: dict = {

    "priya_27": {
        "user_id":                "priya_27",
        "name":                   "Priya Sharma",
        "trusted_devices":        ["device_priya_phone", "device_priya_laptop"],
        "avg_transaction_amount": 12_000,
        "past_action_types":      ["view_portfolio", "view_goals"],
        # starts with no SIPs — so first_investment will fire
    },

    "ramesh_45": {
        "user_id":                "ramesh_45",
        "name":                   "Ramesh Iyer",
        "trusted_devices":        ["device_ramesh_desktop"],
        "avg_transaction_amount": 35_000,
        "past_action_types":      ["start_sip", "renew_fd", "view_portfolio"],
    },

    "neha_33": {
        "user_id":                "neha_33",
        "name":                   "Neha Kapoor",
        "trusted_devices":        ["device_neha_phone"],
        "avg_transaction_amount": 18_000,
        "past_action_types":      ["view_portfolio", "buy_gold"],
    },

    "arjun_38": {
        "user_id":                "arjun_38",
        "name":                   "Arjun Mehta",
        "trusted_devices":        ["device_arjun_phone", "device_arjun_tablet"],
        "avg_transaction_amount": 50_000,
        "past_action_types":      ["start_sip", "rebalance_portfolio",
                                   "buy_equity", "book_gold_profits"],
    },

    "kiran_sme": {
        "user_id":                "kiran_sme",
        "name":                   "Kiran Enterprises",
        "trusted_devices":        ["device_kiran_office"],
        "avg_transaction_amount": 80_000,
        "past_action_types":      ["surplus_fd", "view_cashflow"],
    },

    # ── Special demo persona: designed to BLOCK ───────────────────
    # Use this for the fraud demo during the presentation.
    # New device + huge amount + first investment type.
    "suspicious_actor": {
        "user_id":                "suspicious_actor",
        "name":                   "Demo Fraud Scenario",
        "trusted_devices":        ["device_known"],   # new_device will NOT be known
        "avg_transaction_amount": 5_000,              # amount_anomaly fires hard
        "past_action_types":      [],                  # first_investment fires
    },
}

import json
from pathlib import Path

# Live in-memory store linked to persistent file
_DB_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "fraud_db.json"

def _load_store() -> dict:
    if not _DB_PATH.exists():
        _DB_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(_DB_PATH, "w", encoding="utf-8") as f:
            json.dump(_DEFAULT_USERS, f, indent=4)
        return deepcopy(_DEFAULT_USERS)
    try:
        with open(_DB_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"[Fraud DB] Failed to read store, falling back to defaults: {e}")
        return deepcopy(_DEFAULT_USERS)

def _save_store(store_data: dict) -> None:
    try:
        with open(_DB_PATH, "w", encoding="utf-8") as f:
            json.dump(store_data, f, indent=4)
    except Exception as e:
        print(f"[Fraud DB] Failed to write store: {e}")

_STORE: dict = _load_store()


def get_user_history(user_id: str) -> Optional[dict]:
    """Return the behavioural baseline for a user, or None if not found."""
    return _STORE.get(user_id)


def update_trusted_device(user_id: str, device_id: str) -> None:
    """
    Add a device to a user's trusted list after a successful,
    manually verified action. Call this after a WARN action is
    confirmed by the user (post cooling-off).
    """
    user = _STORE.get(user_id)
    if user and device_id not in user["trusted_devices"]:
        user["trusted_devices"].append(device_id)
        _save_store(_STORE)


def record_action_type(user_id: str, action_type: str) -> None:
    """
    Record that a user has performed a given action type.
    This prevents first_investment from firing again for the same type.
    """
    user = _STORE.get(user_id)
    if user and action_type not in user["past_action_types"]:
        user["past_action_types"].append(action_type)
        _save_store(_STORE)


def update_avg_amount(user_id: str, new_amount: float) -> None:
    """
    Recalculate the user's rolling average after a successful transaction.
    Simple exponential moving average with alpha=0.2.
    """
    user = _STORE.get(user_id)
    if user:
        old_avg = user["avg_transaction_amount"]
        user["avg_transaction_amount"] = round(0.8 * old_avg + 0.2 * new_amount)
        _save_store(_STORE)


def list_users() -> list:
    """Return a list of all known user IDs."""
    return list(_STORE.keys())


# ═════════════════════════════════════════════════════════════════
# VELOCITY TRACKING  (Signal 9 — velocity_abuse)
# -----------------------------------------------------------------
# Single-transaction signals cannot see patterns across time. Here we
# keep a rolling window of the last 10 action timestamps per user and
# flag anyone who fires 5+ actions inside a 10-minute window — the
# fingerprint of an automated bot spraying transactions.
# ═════════════════════════════════════════════════════════════════

_VELOCITY: dict[str, deque] = {}
_VELOCITY_MAXLEN = 10


def update_velocity(user_id: str, timestamp: Optional[datetime] = None) -> None:
    """Record the timestamp of an action. Call after every evaluate request."""
    if timestamp is None:
        timestamp = datetime.now(timezone.utc)
    if user_id not in _VELOCITY:
        _VELOCITY[user_id] = deque(maxlen=_VELOCITY_MAXLEN)
    _VELOCITY[user_id].append(timestamp)


def check_velocity(user_id: str, window_minutes: int = 10, threshold: int = 5) -> bool:
    """True if the user made `threshold`+ actions within the last window."""
    history = _VELOCITY.get(user_id, deque())
    if not history:
        return False
    now = datetime.now(timezone.utc)
    recent = [t for t in history if (now - t).total_seconds() < window_minutes * 60]
    return len(recent) >= threshold


# ═════════════════════════════════════════════════════════════════
# SESSION STATE  (Signal 10 — geographic_anomaly + continuous auth)
# -----------------------------------------------------------------
# Per-user, per-session state that powers two features:
#
#   * device_change detection — the device a session STARTS on is
#     pinned; any later action from a different device is anomalous.
#
#   * session risk accumulator (continuous authentication) — banks are
#     moving from point-in-time auth (log in once, do anything) to
#     re-scoring every action. We accumulate risk seen this session:
#       WARN  → +10   BLOCK → +25
#     Once the accumulator passes 50, every subsequent action in the
#     session is pre-penalised by +15 — a 3rd suspicious action is
#     judged more harshly automatically. Resets on logout or after
#     30 minutes of inactivity.
# ═════════════════════════════════════════════════════════════════

_SESSION: dict[str, dict] = {}

SESSION_TIMEOUT_MINUTES = 30
PREPENALTY_THRESHOLD = 50
PREPENALTY_POINTS = 15
WARN_PENALTY = 10
BLOCK_PENALTY = 25


def _fresh_session(device_id: str, now: datetime) -> dict:
    return {"device_id": device_id, "risk_accumulator": 0, "last_activity": now}


def _get_session(user_id: str, device_id: str) -> dict:
    """Fetch (or start / expire-and-restart) the user's session record."""
    now = datetime.now(timezone.utc)
    sess = _SESSION.get(user_id)

    # Start a new session, or restart one that has been idle too long.
    if sess is None or (now - sess["last_activity"]).total_seconds() > SESSION_TIMEOUT_MINUTES * 60:
        sess = _fresh_session(device_id, now)
        _SESSION[user_id] = sess

    sess["last_activity"] = now
    return sess


def register_session_device(user_id: str, device_id: str) -> bool:
    """
    Pin the session's device on first sight; return True if the current
    device differs from the one this session started on (Signal 10).
    """
    sess = _get_session(user_id, device_id)
    if not sess["device_id"]:
        sess["device_id"] = device_id
        return False
    return device_id != sess["device_id"]


def session_prepenalty(user_id: str) -> bool:
    """True if this session has crossed the risk threshold and new actions
    should start pre-penalised (continuous-auth tightening)."""
    sess = _SESSION.get(user_id)
    return bool(sess and sess["risk_accumulator"] > PREPENALTY_THRESHOLD)


def accumulate_session_risk(user_id: str, decision: str) -> int:
    """After a decision, add its weight to the session accumulator."""
    sess = _SESSION.get(user_id)
    if sess is None:
        return 0
    if decision == "WARN":
        sess["risk_accumulator"] += WARN_PENALTY
    elif decision == "BLOCK":
        sess["risk_accumulator"] += BLOCK_PENALTY
    return sess["risk_accumulator"]


def reset_session(user_id: str) -> None:
    """Clear session state on logout."""
    _SESSION.pop(user_id, None)
    _VELOCITY.pop(user_id, None)
