from fastapi import FastAPI
import json
import os

app = FastAPI()

LINKED_ACCOUNTS = {
    "priya_27": [
        {"bank": "HDFC", "account_type": "Savings", "balance": 142000},
        {"bank": "Paytm Payments Bank", "account_type": "Wallet", "balance": 8500}
    ],
    "ramesh_45": [
        {"bank": "SBI", "account_type": "Savings", "balance": 380000},
        {"bank": "Post Office", "account_type": "RD", "balance": 120000}
    ],
    "neha_33": [
        {"bank": "Kotak", "account_type": "Savings", "balance": 67000},
        {"bank": "ICICI", "account_type": "OD Account", "balance": -85000}
    ],
    "arjun_38": [
        {"bank": "Zerodha", "account_type": "Trading", "balance": 245000},
        {"bank": "Axis", "account_type": "Savings", "balance": 98000}
    ],
    "kiran_sme": [
        {"bank": "SBI", "account_type": "Current", "balance": 820000},
        {"bank": "HDFC", "account_type": "OD", "balance": -200000}
    ]
}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/aggregator/{user_id}")
def get_linked_accounts(user_id: str):
    accounts = LINKED_ACCOUNTS.get(user_id, [])
    return {
        "user_id": user_id,
        "linked_accounts": accounts,
        "total_linked": len(accounts)
    }

@app.get("/market/snapshot")
def get_market_snapshot(scenario: str = "high_inflation"):
    
    scenario_map = {
        "high_inflation": "inflation",
        "bull_market": "bull",
        "market_correction": "correction",
        "inflation": "inflation",
        "bull": "bull",
        "correction": "correction"
    }
    
    filename = scenario_map.get(scenario, "inflation")
    path = f"data/market/{filename}.json"
    
    if not os.path.exists(path):
        return {"error": f"Scenario '{scenario}' not found"}
    
    with open(path) as f:
        return json.load(f)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8004)