import numpy as np
from sklearn.cluster import KMeans
import json
import os

ARCHETYPES = {
    0: {
        "name": "Cautious Saver",
        "desc": "Low risk, FD-heavy, needs inflation-proofing",
        "pattern": "Fixed Deposits (FDs) and Debt Funds",
        "insight": "You prioritize saving and safety. Consider locking in high FD rates to counter inflation."
    },
    1: {
        "name": "Growth Seeker",
        "desc": "Young, high savings rate, SIP-ready",
        "pattern": "Equity Mutual Funds (SIPs)",
        "insight": "You have a strong savings rate and long horizon. Compounding through SIPs will build significant wealth."
    },
    2: {
        "name": "Balanced Builder",
        "desc": "Mix of equity and debt, goal-oriented",
        "pattern": "Hybrid and Balanced Funds",
        "insight": "You maintain a balanced asset allocation. Continue aligning your investments with goal deadlines."
    },
    3: {
        "name": "Risk Taker",
        "desc": "Heavy equity, needs rebalancing guardrails",
        "pattern": "Direct Stocks and Aggressive ETFs",
        "insight": "You pursue high growth but may be over-exposed to equity. Implement stop-losses and debt rebalancing."
    },
    4: {
        "name": "Wealth Consolidator",
        "desc": "High net worth, tax optimization focus",
        "pattern": "ELSS, Tax-free Bonds, and Gold",
        "insight": "You have significant accumulated assets. Focus on maximizing Section 80C and tax-efficient structures."
    }
}

# 15 Features list:
# 1. age, 2. monthly_income, 3. savings_rate, 4. tax_usage, 5. num_goals,
# 6. goal_target, 7. goal_progress, 8. total_invested, 9. total_current_value,
# 10. bank_balances, 11. wallet_balances, 12. gold_assets, 13. liabilities,
# 14. expenses_pattern (1=unstable, 0=stable), 15. typical_avg_transaction

# Centroids for mapping (k=5)
CENTROIDS = np.array([
    # 0: Cautious Saver
    [45.0, 35000.0, 0.15, 0.8, 1.0, 100000.0, 80000.0, 50000.0, 50000.0, 200000.0, 5000.0, 10000.0, 0.0, 1.0, 10000.0],
    # 1: Growth Seeker
    [27.0, 85000.0, 0.30, 0.2, 2.0, 400000.0, 42000.0, 10000.0, 10000.0, 50000.0, 10000.0, 0.0, 0.0, 3.0, 6000.0],
    # 2: Balanced Builder
    [38.0, 120000.0, 0.22, 0.6, 3.0, 800000.0, 300000.0, 300000.0, 350000.0, 100000.0, 150000.0, 50000.0, 50000.0, 2.0, 12000.0],
    # 3: Risk Taker
    [33.0, 50000.0, 0.18, 0.4, 1.0, 200000.0, 50000.0, 150000.0, 170000.0, 30000.0, 5000.0, 20000.0, 10000.0, 3.0, 8000.0],
    # 4: Wealth Consolidator
    [50.0, 150000.0, 0.40, 0.9, 1.0, 1500000.0, 1000000.0, 1000000.0, 1200000.0, 500000.0, 50000.0, 200000.0, 0.0, 1.5, 25000.0]
])

# Initialize and fit KMeans deterministically
kmeans = KMeans(n_clusters=5, init=CENTROIDS, n_init=1, random_state=42)
kmeans.fit(CENTROIDS)

def extract_features(data: dict) -> list:
    age = float(data.get("age", 30))
    income = float(data.get("monthly_income", 50000))
    avg_txn = float(data.get("typical_avg_transaction", 5000))
    liabilities = float(data.get("liabilities", 0))
    
    portfolio = data.get("portfolio", {})
    invested = float(portfolio.get("total_invested", 0))
    current_val = float(portfolio.get("total_current_value", 0))
    
    gold = 0.0
    for asset in data.get("assets", []):
        if asset.get("type") == "gold":
            gold += float(asset.get("value", 0))
            
    bank = 0.0
    for acc in data.get("accounts", []):
        if acc.get("bank") and acc.get("type") != "honeypot_account":
            bank += float(acc.get("balance", 0))
            
    wallet = 0.0
    for acc in data.get("accounts", []):
        if acc.get("account_type") == "Wallet" or acc.get("bank") == "Paytm":
            wallet += float(acc.get("balance", 0))
            
    goals = data.get("goals", [])
    num_goals = float(len(goals))
    goal_target = float(sum(g.get("target_amount", 0) for g in goals))
    goal_progress = float(sum(g.get("saved_so_far", 0) for g in goals))
    
    risk = data.get("risk_profile", "moderate")
    risk_score = 2.0
    if risk == "aggressive": risk_score = 3.0
    elif risk == "balanced" or risk == "moderate": risk_score = 2.0
    elif risk == "cautious": risk_score = 1.0
    elif risk == "conservative": risk_score = 1.5
    
    savings_rate = float(data.get("savings_rate", 0.2))
    tax_usage = float(data.get("tax_usage", 0.5))
    
    return [
        age, income, savings_rate, tax_usage, num_goals, goal_target, goal_progress,
        invested, current_val, bank, wallet, gold, liabilities, risk_score, avg_txn
    ]

def get_user_archetype(profile_dict: dict) -> dict:
    user_id = profile_dict.get("user_id")
    
    # 1. Try to load the persona file if user_id is provided
    persona_data = {}
    if user_id:
        paths = [
            f"data/personas/{user_id}.json",
            f"../../data/personas/{user_id}.json"
        ]
        for path in paths:
            if os.path.exists(path):
                try:
                    with open(path) as f:
                        persona_data = json.load(f)
                    break
                except Exception:
                    pass
                    
    # 2. If persona data is empty, find the closest matching persona from data/personas/ by income and savings_rate
    if not persona_data:
        income = profile_dict.get("income", 50000)
        savings_rate = profile_dict.get("savings_rate", 0.2)
        closest_persona = "priya_27"
        min_diff = float("inf")
        
        personas_dir = "data/personas"
        if not os.path.exists(personas_dir):
            personas_dir = "../../data/personas"
            
        if os.path.exists(personas_dir):
            for file in os.listdir(personas_dir):
                if file.endswith(".json") and file != "fraud_demo.json":
                    try:
                        with open(os.path.join(personas_dir, file)) as f:
                            p = json.load(f)
                        diff = abs(p.get("monthly_income", 0) - income) / 100000 + abs(p.get("savings_rate", 0) - savings_rate)
                        if diff < min_diff:
                            min_diff = diff
                            persona_data = p
                    except Exception:
                        pass

    # 3. Extract 15 features and run predict
    features = extract_features(persona_data)
    features_arr = np.array([features])
    
    cluster_idx = int(kmeans.predict(features_arr)[0])
    archetype = ARCHETYPES.get(cluster_idx, ARCHETYPES[2])
    
    return {
        "user_id": user_id or persona_data.get("user_id", "unknown"),
        "archetype": archetype["name"],
        "description": archetype["desc"],
        "recommended_pattern": archetype["pattern"],
        "behavioral_insight": archetype["insight"]
    }
