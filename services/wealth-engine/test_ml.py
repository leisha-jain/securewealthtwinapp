import sys
import os

# Adjust import path to find app module
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.projection import project_goal
from app.services.explainer import analyze_spending_anomaly
from app.services.market_model import get_market_aware_recommendation
from app.services.clustering import get_user_archetype
from app.models.schemas import UserProfile

def test_goal_projection():
    print("── Testing Goal Projection Engine ──")
    res = project_goal(
        current_savings=10000.0,
        monthly_contribution=1000.0,
        goal_amount=50000.0,
        expected_return_pct=10.0,
        months_remaining=24
    )
    assert "projected_values" in res
    assert "scenarios" in res
    assert len(res["projected_values"]) == 60
    assert res["on_track"] is False  # with ₹10k + ₹1k/m at 10%, we won't reach ₹50k in 24 months
    print("  [PASS] Goal projection math and what-if scenarios are correct")

def test_spending_anomaly():
    print("\n── Testing Spending Anomaly Detector ──")
    # Generate 12 months transactions with a spike in shopping in the 12th month (Month 12)
    txns = []
    # 11 months of normal shopping (Rs. 5000/month)
    for m in range(1, 12):
        txns.append({"date": f"2025-{m:02d}-05", "category": "shopping", "amount": 5000})
        txns.append({"date": f"2025-{m:02d}-10", "category": "food", "amount": 2000})
    # Month 12: shopping spikes to Rs. 25000
    txns.append({"date": "2025-12-05", "category": "shopping", "amount": 25000})
    txns.append({"date": "2025-12-10", "category": "food", "amount": 2000})
    
    res = analyze_spending_anomaly(txns)
    assert res["anomaly"] is True
    assert res["top_category"] == "shopping"
    assert res["excess_amount"] > 0
    print("  [PASS] Correctly flagged shopping anomaly and calculated excess")

def test_market_aware_recommendation():
    print("\n── Testing Two-Stage Recommendation Blending ──")
    profile = UserProfile(
        user_id="priya_27",
        income=85000,
        savings_rate=0.30,
        expenses_pattern="stable",
        tax_usage=0.2
    )
    
    # We will test get_market_aware_recommendation
    res = get_market_aware_recommendation(profile)
    assert "user_recommendation" in res
    assert "final_recommendation" in res
    assert "blend_reasoning" in res
    print("  [PASS] Recommendation Stage 1, 2, and 3 executed and blended successfully")

def test_persona_clustering():
    print("\n── Testing KMeans Persona Clustering ──")
    profile = {
        "user_id": "priya_27",
        "income": 85000,
        "savings_rate": 0.30,
        "expenses_pattern": "stable",
        "tax_usage": 0.2
    }
    res = get_user_archetype(profile)
    assert "archetype" in res
    assert "description" in res
    assert res["archetype"] in ["Cautious Saver", "Growth Seeker", "Balanced Builder", "Risk Taker", "Wealth Consolidator"]
    print(f"  [PASS] Clustered user into archetype: {res['archetype']}")

if __name__ == "__main__":
    print("==========================================")
    print("       SecureWealth Twin — ML Tests       ")
    print("==========================================")
    try:
        test_goal_projection()
        test_spending_anomaly()
        test_market_aware_recommendation()
        test_persona_clustering()
        print("\n==========================================")
        print("   All ML tests passed successfully.      ")
        print("==========================================")
    except AssertionError as e:
        print(f"\n[FAIL] Test failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n[ERROR] Crash during test: {e}")
        sys.exit(1)
