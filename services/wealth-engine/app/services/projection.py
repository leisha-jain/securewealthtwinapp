import math

def run_simulation(start_amount: float, monthly_deposit: float, annual_rate: float, num_months: int) -> list:
    balances = []
    current = start_amount
    monthly_rate = (annual_rate / 100) / 12
    for _ in range(num_months):
        if monthly_rate > 0:
            current = current * (1 + monthly_rate) + monthly_deposit
        else:
            current = current + monthly_deposit
        balances.append(round(current, 2))
    return balances

def find_months_to_goal(start_amount: float, monthly_deposit: float, annual_rate: float, goal_amount: float) -> int:
    if start_amount >= goal_amount:
        return 0
    if monthly_deposit <= 0 and annual_rate <= 0:
        return -1
    
    current = start_amount
    monthly_rate = (annual_rate / 100) / 12
    months = 0
    while current < goal_amount and months < 600:  # Cap at 50 years
        if monthly_rate > 0:
            current = current * (1 + monthly_rate) + monthly_deposit
        else:
            current = current + monthly_deposit
        months += 1
    return months if current >= goal_amount else -1

def get_required_monthly(start_amount: float, goal_amount: float, annual_rate: float, months: int) -> float:
    if months <= 0:
        return 0.0
    monthly_rate = (annual_rate / 100) / 12
    if monthly_rate == 0:
        return max(0.0, round((goal_amount - start_amount) / months, 2))
    
    factor = (1 + monthly_rate) ** months
    numerator = goal_amount - start_amount * factor
    denominator = (factor - 1) / monthly_rate
    required = numerator / denominator
    return max(0.0, round(required, 2))

def project_goal(current_savings: float, monthly_contribution: float, goal_amount: float, expected_return_pct: float, months_remaining: int) -> dict:
    total_months = max(60, months_remaining)
    
    # 1. Main Simulation
    projected_values = run_simulation(current_savings, monthly_contribution, expected_return_pct, total_months)
    months_labels = [f"Month {i+1}" for i in range(total_months)]
    
    # Determine if on track
    final_balance = projected_values[months_remaining - 1] if months_remaining > 0 else current_savings
    on_track = final_balance >= goal_amount
    
    # Calculate months to goal
    projected_months = find_months_to_goal(current_savings, monthly_contribution, expected_return_pct, goal_amount)
    
    # Gap amount
    gap_amount = max(0.0, round(goal_amount - final_balance, 2))
    
    # Required monthly contribution
    required_monthly = get_required_monthly(current_savings, goal_amount, expected_return_pct, months_remaining)
    
    # 2. What-if Scenario 1: Invest Rs. 500 more per month
    scenario_1_contrib = monthly_contribution + 500
    s1_vals = run_simulation(current_savings, scenario_1_contrib, expected_return_pct, total_months)
    s1_months = find_months_to_goal(current_savings, scenario_1_contrib, expected_return_pct, goal_amount)
    
    # 3. What-if Scenario 2: 2% better annual returns
    scenario_2_rate = expected_return_pct + 2
    s2_vals = run_simulation(current_savings, monthly_contribution, scenario_2_rate, total_months)
    s2_months = find_months_to_goal(current_savings, monthly_contribution, scenario_2_rate, goal_amount)
    
    # 4. What-if Scenario 3: Extend deadline by 6 months
    scenario_3_months = months_remaining + 6
    s3_total_months = max(60, scenario_3_months)
    s3_vals = run_simulation(current_savings, monthly_contribution, expected_return_pct, s3_total_months)
    
    return {
        "on_track": on_track,
        "projected_months": projected_months,
        "gap_amount": gap_amount,
        "required_monthly_to_hit_deadline": required_monthly,
        "months": months_labels,
        "projected_values": projected_values,
        "scenarios": {
            "invest_more": {
                "label": "Invest ₹500 more per month",
                "monthly_contribution": scenario_1_contrib,
                "projected_months": s1_months,
                "projected_values": s1_vals[:months_remaining] if months_remaining > 0 else []
            },
            "better_returns": {
                "label": "Get 2% higher annual return",
                "expected_return_pct": scenario_2_rate,
                "projected_months": s2_months,
                "projected_values": s2_vals[:months_remaining] if months_remaining > 0 else []
            },
            "extend_deadline": {
                "label": "Extend deadline by 6 months",
                "months_remaining": scenario_3_months,
                "projected_months": projected_months,
                "projected_values": s3_vals[:scenario_3_months]
            }
        }
    }
