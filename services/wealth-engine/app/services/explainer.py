def generate_explanation(profile, reasons):
    drivers = []

    if profile.savings_rate < 0.2:
        drivers.append("Low savings rate")
    if profile.tax_usage < 0.5:
        drivers.append("Low tax utilization")
    if profile.expenses_pattern == "unstable":
        drivers.append("Unstable spending pattern")

    explanation = "This recommendation is based on key financial indicators: "
    explanation += ", ".join(drivers) if drivers else "your financial profile is stable"
    explanation += "."

    return {
        "explanation_text": explanation,
        "top_drivers": drivers
    }


def analyze_spending_anomaly(user_transactions: list) -> dict:
    if not user_transactions:
        return {"anomaly": False, "excess_amount": 0.0, "top_category": "", "message": ""}

    # 1. Find all months and latest month
    months = sorted(list(set(t["date"][:7] for t in user_transactions)))
    if len(months) < 2:
        return {"anomaly": False, "excess_amount": 0.0, "top_category": "", "message": ""}

    latest_month = months[-1]
    prev_months = months[:-1]

    # 2. Total spends per month
    latest_total = sum(t["amount"] for t in user_transactions if t["date"].startswith(latest_month))
    prev_totals = [sum(t["amount"] for t in user_transactions if t["date"].startswith(m)) for m in prev_months]
    avg_prev_total = sum(prev_totals) / len(prev_totals) if prev_totals else 0.0

    # 3. Check if latest month total > 1.4 * average
    if latest_total > 1.4 * avg_prev_total:
        # Group latest month spend by category
        latest_cat_spend = {}
        for t in user_transactions:
            if t["date"].startswith(latest_month):
                cat = t["category"]
                latest_cat_spend[cat] = latest_cat_spend.get(cat, 0.0) + t["amount"]

        # Find the top spending category in the latest month
        if latest_cat_spend:
            top_cat = max(latest_cat_spend, key=latest_cat_spend.get)

            # Calculate historical average for this top category
            cat_prev_spends = []
            for m in prev_months:
                cat_prev_spends.append(sum(t["amount"] for t in user_transactions if t["date"].startswith(m) and t["category"] == top_cat))
            avg_cat_prev = sum(cat_prev_spends) / len(cat_prev_spends) if cat_prev_spends else 0.0

            excess = round(latest_cat_spend[top_cat] - avg_cat_prev, 2)
            if excess > 0:
                return {
                    "anomaly": True,
                    "excess_amount": excess,
                    "top_category": top_cat,
                    "message": f"You spent Rs.{excess:,.0f} more than usual on {top_cat} this month."
                }

    return {"anomaly": False, "excess_amount": 0.0, "top_category": "", "message": ""}