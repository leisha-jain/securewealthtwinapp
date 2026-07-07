import json
import os
from app.services.recommendation import generate_recommendation

ACTION_TO_TEXT = {
    "book_gold_profits": "Gold has delivered high returns. Consider booking partial profits.",
    "shift_to_fd": "FD rates are attractive. Consider shifting surplus funds to fixed deposits.",
    "increase_sip": "Market is in a correction. Reinforce your SIPs to average your purchase cost.",
    "partial_rebalance": "Nifty is at a high. Consider partial rebalancing to lock in equity gains.",
    "none": "Based on your personal financial profile, no immediate market adjustments are needed."
}

def map_rec_to_action(rec_text: str) -> str:
    t = rec_text.lower()
    if "sip" in t:
        return "increase_sip"
    if "fd" in t or "fixed deposit" in t:
        return "shift_to_fd"
    if "gold" in t:
        return "book_gold_profits"
    return "none"

def _analyze_market(market_snapshot: dict) -> list:
    signals = []
    gold_ytd = market_snapshot.get("gold_ytd", 0.0)
    fd_rate = market_snapshot.get("fd_rate", 0.0)
    inflation_rate = market_snapshot.get("inflation_rate", 0.0)
    nifty_ytd = market_snapshot.get("nifty_ytd", 0.0)

    if gold_ytd > 0.10:
        signals.append({
            "action": "book_gold_profits",
            "strength": 0.8,
            "reason": f"Gold up over 10% YTD ({gold_ytd*100:.1f}%) — book gold profits"
        })
    if fd_rate > 0.075 and inflation_rate > 0.065:
        signals.append({
            "action": "shift_to_fd",
            "strength": 0.85,
            "reason": f"FD rate ({fd_rate*100:.1f}%) and inflation ({inflation_rate*100:.1f}%) are high — shift to FD"
        })
    if nifty_ytd < -0.05:
        signals.append({
            "action": "increase_sip",
            "strength": 0.9,
            "reason": f"Nifty corrected over 5% YTD ({nifty_ytd*100:.1f}%) — reinforce SIP"
        })
    elif nifty_ytd > 0.15:
        signals.append({
            "action": "partial_rebalance",
            "strength": 0.75,
            "reason": f"Nifty up over 15% YTD ({nifty_ytd*100:.1f}%) — partial rebalance"
        })
    return signals

def blend(user_rec: str, market_signals: list, user_conf: float):
    user_action = map_rec_to_action(user_rec)
    
    # If personal and market agree
    for signal in market_signals:
        if signal["action"] == user_action:
            # High confidence alignment
            return user_rec, min(user_conf + 0.15, 0.99), "Both personal profile and market agree"
            
    # If they disagree, market wins with 60/40 weight (returns market recommendation)
    if market_signals:
        top = max(market_signals, key=lambda x: x["strength"])
        final_text = ACTION_TO_TEXT.get(top["action"], top["reason"])
        return final_text, 0.72, f"Market overrides: {top['reason']}"
        
    # Default to user recommendation
    return user_rec, user_conf, "Based on your personal financial profile"

def get_market_aware_recommendation(profile) -> dict:
    # 1. Stage 1: Get personal recommendation
    personal = generate_recommendation(profile)
    user_rec = personal["recommendation"]
    user_conf = personal["confidence"]

    # 2. Stage 2: Read market snapshot from scenario or snapshot file
    # We first check market_snapshot.json, then fall back to inflation.json
    snapshot = {}
    paths = [
        "data/market_snapshot.json",
        "data/market/inflation.json",
        "../../data/market_snapshot.json",
        "../../data/market/inflation.json"
    ]
    for path in paths:
        if os.path.exists(path):
            try:
                with open(path) as f:
                    snapshot = json.load(f)
                break
            except Exception:
                pass

    market_signals = _analyze_market(snapshot)
    market_rec_action = market_signals[0]["action"] if market_signals else "none"

    # 3. Stage 3: Blend
    final_rec, final_conf, reasoning = blend(user_rec, market_signals, user_conf)

    return {
        "user_recommendation": user_rec,
        "market_recommendation": market_rec_action,
        "final_recommendation": final_rec,
        "blend_reasoning": reasoning,
        "confidence": final_conf
    }
