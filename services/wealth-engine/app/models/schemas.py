from pydantic import BaseModel
from typing import Optional

class UserProfile(BaseModel):
    user_id: Optional[str] = None
    income: float
    savings_rate: float
    expenses_pattern: str
    tax_usage: float


class SimulationInput(BaseModel):
    current_savings: float
    monthly_contribution: float
    goal_amount: float
    annual_return: float


class GoalProjectionInput(BaseModel):
    current_savings: float
    monthly_contribution: float
    goal_amount: float
    expected_return_pct: float
    months_remaining: int