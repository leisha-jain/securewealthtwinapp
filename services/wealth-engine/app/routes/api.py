import os
import json
from fastapi import APIRouter
from app.models.schemas import UserProfile, SimulationInput, GoalProjectionInput
from app.services.recommendation import generate_recommendation
from app.services.explainer import generate_explanation, analyze_spending_anomaly
from app.services.simulator import simulate_growth
from app.services.market import get_market_context
from app.services.market_model import get_market_aware_recommendation
from app.services.clustering import get_user_archetype
from app.services.projection import project_goal

router = APIRouter()


@router.get("/")
def root():
    return {"message": "Wealth Engine Running"}


@router.post("/recommend")
def recommend(profile: UserProfile):
    return generate_recommendation(profile)


@router.post("/recommend/explain")
def explain(profile: UserProfile):
    result = generate_recommendation(profile)
    explanation = generate_explanation(profile, result["reasons"])
    
    # Spending Anomaly Detector
    spending_anomalies = []
    if profile.user_id:
        persona_path = f"data/personas/{profile.user_id}.json"
        if os.path.exists(persona_path):
            try:
                with open(persona_path) as f:
                    p_data = json.load(f)
                transactions = p_data.get("transactions", [])
                anomaly_res = analyze_spending_anomaly(transactions)
                if anomaly_res.get("anomaly"):
                    spending_anomalies.append(anomaly_res)
            except Exception:
                pass
                
    explanation["spending_anomalies"] = spending_anomalies
    return explanation


@router.post("/recommend/market-aware")
def market_aware_recommend(profile: UserProfile):
    return get_market_aware_recommendation(profile)


@router.post("/recommend/archetype")
def archetype(profile: UserProfile):
    # Pass model_dump() directly to clustering service
    return get_user_archetype(profile.dict())


@router.post("/recommend/goal-projection")
def goal_projection(data: GoalProjectionInput):
    return project_goal(
        current_savings=data.current_savings,
        monthly_contribution=data.monthly_contribution,
        goal_amount=data.goal_amount,
        expected_return_pct=data.expected_return_pct,
        months_remaining=data.months_remaining
    )


@router.post("/simulate")
def simulate(data: SimulationInput):
    return simulate_growth(data)


@router.get("/market-context")
def market():
    return get_market_context()