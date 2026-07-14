"""
SecureWealth Twin — Transaction History Generator
Author: Sarthak Pandit (Data Engineer, Team 51)

Generates 12 months × ~25 transactions per month = ~300 transactions per persona.
Each persona has realistic spending patterns with built-in anomalies:
  - priya_27:       shopping spikes in months 3, 7, 11 (+40%)
  - suspicious_actor: October (month 10) transactions jump 5× — fraud signal
  - raj_45:         stable high-income pattern with occasional dining spikes
  - amit_60:        low velocity, health-heavy, mostly FD-interest credits
  - neha_32:        frugal, savings-oriented, minimal discretionary
  - vikram_38:      high volatility, large transfers, startup-related expenses

Run: python generate_transactions.py
Outputs: updates each persona JSON file's "transactions" array in-place.
"""

import json
import random
import os
from datetime import date, timedelta
from pathlib import Path

random.seed(42)  # deterministic output for reproducibility

PERSONAS_DIR = Path(__file__).parent / "personas"

# ──────────────────────────────────────────────────────────
# Base monthly spending profiles per persona
# ──────────────────────────────────────────────────────────
PERSONA_PROFILES = {
    "priya_27": {
        "base_amounts": {
            "groceries":      6500,
            "dining":         4200,
            "shopping":       7500,
            "transport":      3800,
            "entertainment":  2500,
            "utilities":      2800,
            "health":         1200,
            "subscriptions":  1500,
            "rent":          22000,
        },
        "income_credit": 95000,
        "sip_debit": 15000,
        "anomaly_months": {3: ("shopping", 1.40), 7: ("shopping", 1.40), 11: ("shopping", 1.40)},
        "description": "Young software engineer, regular spender, shopping anomaly in months 3/7/11"
    },
    "raj_45": {
        "base_amounts": {
            "groceries":     15000,
            "dining":         8000,
            "shopping":      18000,
            "transport":     12000,
            "entertainment":  6000,
            "utilities":      5500,
            "health":         4500,
            "education":     10000,
            "emi":           45000,
        },
        "income_credit": 185000,
        "sip_debit": 25000,
        "anomaly_months": {5: ("dining", 1.60), 9: ("dining", 1.55)},
        "description": "Senior manager, stable high-income, occasional dining spikes during bonus months"
    },
    "amit_60": {
        "base_amounts": {
            "groceries":     12000,
            "utilities":      8000,
            "health":        15000,
            "dining":         5000,
            "transport":      6000,
            "domestic_help":  8000,
            "subscriptions":  2000,
            "religious":      5000,
            "travel":         4000,
        },
        "income_credit": 95000,
        "sip_debit": 10000,
        "anomaly_months": {6: ("health", 1.80), 12: ("health", 1.60)},
        "description": "Retired officer, low velocity, health spikes in mid-year and year-end"
    },
    "neha_32": {
        "base_amounts": {
            "rent":          25000,
            "groceries":      8000,
            "dining":         5500,
            "transport":      4500,
            "shopping":       9000,
            "entertainment":  3000,
            "utilities":      3500,
            "health":         2500,
            "professional":   7000,
        },
        "income_credit": 120000,
        "sip_debit": 20000,
        "anomaly_months": {},
        "description": "CA, very disciplined spender — no anomaly months, steady savings"
    },
    "vikram_38": {
        "base_amounts": {
            "rent_office":   45000,
            "groceries":     18000,
            "dining":        22000,
            "shopping":      35000,
            "entertainment": 18000,
            "transport":     25000,
            "utilities":      8000,
            "health":         5000,
            "travel":        19000,
        },
        "income_credit": 280000,
        "sip_debit": 50000,
        "anomaly_months": {4: ("travel", 2.20), 10: ("travel", 2.50)},
        "description": "Entrepreneur, high variance spender, large travel spikes Q2 and Q4"
    },
    "suspicious_actor": {
        "base_amounts": {
            "rent":          18000,
            "groceries":      5000,
            "dining":         3000,
            "transport":      5000,
            "shopping":       8000,
            "entertainment":  4000,
            "utilities":      2000,
            "unknown_transfers": 16000,
        },
        "income_credit": 55000,
        "sip_debit": 0,
        "anomaly_months": {
            10: ("unknown_transfers", 5.0),  # October fraud spike 5×
        },
        "description": "FRAUD PERSONA — October jump 5× — triggers spending anomaly and fraud signals"
    },
}

TRANSACTION_DESCRIPTIONS = {
    "groceries":        ["BigBasket Order", "Zepto Delivery", "D-Mart Purchase", "Reliance Fresh", "Swiggy Instamart", "Local Kirana", "Nature's Basket"],
    "dining":           ["Swiggy Order", "Zomato Delivery", "Cafe Coffee Day", "McDonald's", "Domino's Pizza", "Restaurant - Dine In", "Barbeque Nation"],
    "shopping":         ["Amazon Purchase", "Flipkart Order", "Myntra Order", "Nykaa Purchase", "Meesho Order", "H&M Store", "Lifestyle Store"],
    "transport":        ["Ola Ride", "Uber Ride", "Metro Card Recharge", "Petrol Pump", "FastTag Recharge", "Rapido Bike", "BMTC Pass Renewal"],
    "entertainment":    ["Netflix Subscription", "BookMyShow Tickets", "PVR Cinemas", "Hotstar Premium", "Spotify Premium", "Amazon Prime", "Gaming Credits"],
    "utilities":        ["Electricity Bill", "Water Bill", "Gas Cylinder", "Internet Bill - Jio", "Internet Bill - Airtel", "Mobile Recharge", "Piped Gas"],
    "health":           ["Apollo Pharmacy", "Medplus Order", "Doctor Consultation - Practo", "Lab Test - Thyrocare", "Yoga Class Fees", "Gym Membership", "Eyecare - Lenskart"],
    "subscriptions":    ["LinkedIn Premium", "iCloud Storage", "Google One", "Adobe Creative Cloud", "Canva Pro", "Notion Pro"],
    "rent":             ["Monthly Rent Transfer", "Rent Payment - NEFT"],
    "emi":              ["Home Loan EMI - HDFC", "Car Loan EMI - ICICI"],
    "education":        ["School Fees Transfer", "Tuition Fees", "EdTech Course - Udemy", "Coaching Classes"],
    "domestic_help":    ["Maid Salary Transfer", "Cook Salary Transfer"],
    "religious":        ["Temple Donation", "Puja Samagri - Amazon", "Mandir Trust Donation"],
    "travel":           ["MakeMyTrip Flight", "IRCTC Booking", "Hotel Booking - OYO", "Airbnb Stay", "Car Rental - Zoomcar"],
    "rent_office":      ["Office Rent Transfer", "Co-working Space - WeWork"],
    "professional":     ["Bar Council Fees", "Professional Certification", "CA Institute Subscription"],
    "unknown_transfers":["Transfer to XXXX7700", "UPI Transfer - Unknown", "Wire Transfer - International", "P2P Transfer"],
}


def random_day_in_month(year: int, month: int) -> date:
    """Return a random date within the given year-month."""
    if month == 12:
        next_month = date(year + 1, 1, 1)
    else:
        next_month = date(year, month + 1, 1)
    first = date(year, month, 1)
    delta = (next_month - first).days
    return first + timedelta(days=random.randint(0, delta - 1))


def generate_month_transactions(
    persona_id: str,
    year: int,
    month: int,
    base_amounts: dict,
    anomaly_category: str = None,
    anomaly_factor: float = 1.0,
) -> list:
    """
    Generate ~20-28 transactions for a single month.
    Returns list of transaction dicts.
    """
    txns = []

    for category, base in base_amounts.items():
        # Decide how many transactions for this category this month
        if category in ("rent", "emi", "rent_office"):
            n_txns = 1  # one fixed monthly payment
        elif category in ("utilities", "subscriptions", "domestic_help"):
            n_txns = random.randint(1, 3)
        else:
            n_txns = random.randint(3, 7)

        # Apply anomaly multiplier if applicable
        effective_factor = anomaly_factor if category == anomaly_category else 1.0

        for i in range(n_txns):
            amount = (base / n_txns) * random.uniform(0.80, 1.20) * effective_factor
            amount = round(amount, 2)
            if amount <= 0:
                continue

            tx_date = random_day_in_month(year, month)
            descriptions = TRANSACTION_DESCRIPTIONS.get(category, [f"{category.replace('_', ' ').title()} payment"])
            description = random.choice(descriptions)

            txns.append({
                "txn_id": f"TXN-{persona_id.upper()[:3]}-{year}{month:02d}-{len(txns)+1:04d}",
                "date": tx_date.isoformat(),
                "category": category,
                "amount": amount,
                "type": "debit",
                "description": description,
                "month": month,
                "year": year,
            })

    # Sort by date within the month
    txns.sort(key=lambda x: x["date"])
    return txns


def generate_persona_transactions(persona_id: str) -> list:
    """
    Generate 12 months of transactions for a persona.
    Includes salary credits and SIP debits.
    Returns flat list of all transactions (oldest first).
    """
    profile = PERSONA_PROFILES[persona_id]
    base_amounts = profile["base_amounts"]
    anomaly_months = profile["anomaly_months"]
    income = profile["income_credit"]
    sip = profile["sip_debit"]

    all_txns = []
    # Generate for April 2025 → March 2026 (fiscal year)
    start_year = 2025
    start_month = 4
    year = start_year

    for m in range(12):
        month = (start_month + m - 1) % 12 + 1
        if month == 1 and m > 0:
            year = 2026

        # Check for anomaly
        anomaly_category = None
        anomaly_factor = 1.0
        if (m + 1) in anomaly_months:
            anomaly_category, anomaly_factor = anomaly_months[m + 1]

        # Generate expense transactions
        month_txns = generate_month_transactions(
            persona_id, year, month, base_amounts, anomaly_category, anomaly_factor
        )
        all_txns.extend(month_txns)

        # Add salary credit on 1st of each month
        salary_date = date(year, month, 1).isoformat()
        salary_variance = random.uniform(0.97, 1.03)
        all_txns.append({
            "txn_id": f"TXN-{persona_id.upper()[:3]}-{year}{month:02d}-SAL",
            "date": salary_date,
            "category": "income",
            "amount": round(income * salary_variance, 2),
            "type": "credit",
            "description": f"Salary Credit - {profile.get('description', persona_id)[:30]}",
            "month": month,
            "year": year,
        })

        # Add SIP debit on 5th of each month (if applicable)
        if sip > 0:
            sip_date = date(year, month, 5).isoformat()
            all_txns.append({
                "txn_id": f"TXN-{persona_id.upper()[:3]}-{year}{month:02d}-SIP",
                "date": sip_date,
                "category": "sip_investment",
                "amount": round(sip, 2),
                "type": "debit",
                "description": "SIP Auto-Debit",
                "month": month,
                "year": year,
            })

    # Final sort by date
    all_txns.sort(key=lambda x: x["date"])
    return all_txns


def compute_monthly_summary(transactions: list) -> dict:
    """
    Compute per-month totals by category for anomaly detection.
    Returns dict: { 'YYYY-MM': { category: total, ... }, ... }
    """
    summary = {}
    for txn in transactions:
        if txn["type"] != "debit":
            continue
        key = f"{txn['year']}-{txn['month']:02d}"
        if key not in summary:
            summary[key] = {}
        cat = txn["category"]
        summary[key][cat] = summary[key].get(cat, 0) + txn["amount"]
    return summary


def main():
    """Run generator for all personas and update their JSON files."""
    print("SecureWealth Twin — Transaction Generator")
    print("=" * 50)

    if not PERSONAS_DIR.exists():
        print(f"ERROR: Personas directory not found at {PERSONAS_DIR}")
        return

    persona_files = list(PERSONAS_DIR.glob("*.json"))
    if not persona_files:
        print(f"ERROR: No persona JSON files found in {PERSONAS_DIR}")
        return

    total_txns = 0
    for persona_path in sorted(persona_files):
        persona_id = persona_path.stem
        if persona_id not in PERSONA_PROFILES:
            print(f"  SKIP: {persona_id} — no profile defined, skipping.")
            continue

        print(f"\nGenerating transactions for: {persona_id}")
        print(f"  Profile: {PERSONA_PROFILES[persona_id]['description']}")

        # Load existing persona JSON
        with open(persona_path, "r", encoding="utf-8") as f:
            persona_data = json.load(f)

        # Generate transactions
        transactions = generate_persona_transactions(persona_id)
        total_txns += len(transactions)

        # Compute summary for verification
        monthly_summary = compute_monthly_summary(transactions)

        print(f"  Generated {len(transactions)} transactions across 12 months")

        # Show anomaly months
        anomaly_months = PERSONA_PROFILES[persona_id]["anomaly_months"]
        if anomaly_months:
            for m_idx, (cat, factor) in anomaly_months.items():
                print(f"  ★ Anomaly Month {m_idx}: {cat} × {factor:.1f}")

        # Inject into persona data
        persona_data["transactions"] = transactions
        persona_data["transaction_metadata"] = {
            "total_count": len(transactions),
            "period": "Apr 2025 – Mar 2026",
            "anomaly_months": {str(k): v for k, v in anomaly_months.items()},
            "generated_by": "generate_transactions.py",
        }

        # Write back
        with open(persona_path, "w", encoding="utf-8") as f:
            json.dump(persona_data, f, indent=2, ensure_ascii=False)

        print(f"  ✓ Saved to {persona_path.name}")

    print(f"\n{'=' * 50}")
    print(f"Done! Generated {total_txns} total transactions across {len(persona_files)} personas.")
    print("All persona JSON files updated.")


if __name__ == "__main__":
    main()
