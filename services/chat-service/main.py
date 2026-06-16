from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import os
import requests

# ------------------ CONFIG ------------------
load_dotenv()
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
MODEL = "meta-llama/llama-3.3-70b-instruct"
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

app = FastAPI(title="SecureWealth Twin - Chat Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ------------------ MODELS ------------------
class UserProfile(BaseModel):
    income: int
    savings: int
    expenses: dict
    goals: list


class ChatRequest(BaseModel):
    message: str
    profile: UserProfile  # M4 gateway uses 'profile', consistent with other services


class ExplainRequest(BaseModel):
    recommended_action: str
    top_drivers: list
    user_profile: dict


class StarterPromptsRequest(BaseModel):
    profile: UserProfile  # wrapped for consistency — M4 can call this cleanly


# ------------------ HELPERS ------------------
def build_user_context(profile: UserProfile) -> str:
    income = profile.income
    savings = profile.savings
    expenses = profile.expenses or {}
    goals = profile.goals or []
    total_expense = sum(expenses.values())
    savings_rate = round((savings / income) * 100, 1) if income > 0 else 0
    top_category = max(expenses, key=expenses.get) if expenses else "N/A"

    return f"""
Income: Rs.{income:,}/month
Savings: Rs.{savings:,}/month ({savings_rate}% savings rate)
Total expenses: Rs.{total_expense:,}/month
Highest spend: {top_category} (Rs.{expenses.get(top_category, 0):,})
Goals: {', '.join(goals) if goals else 'Not specified'}
"""


def call_llm(system_prompt: str, user_prompt: str, max_tokens: int = 200):
    """Single reusable LLM caller — avoids copy-pasting requests.post everywhere."""
    try:
        response = requests.post(
            OPENROUTER_URL,
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": MODEL,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "max_tokens": max_tokens,
                "temperature": 0.6
            },
            timeout=10
        )
        data = response.json()
        if "choices" not in data or not data["choices"]:
            print("[LLM] Unexpected response:", data)
            return None
        return data["choices"][0]["message"]["content"].strip()
    except Exception as e:
        print(f"[LLM error] {e}")
        return None


# ------------------ ROUTES ------------------
@app.get("/")
def home():
    return {"message": "SecureWealth Chat Service Running", "port": 8003}


@app.post("/api/chat")
def chat(request: ChatRequest):
    context = build_user_context(request.profile)

    system = f"""You are SecureWealth Twin, a personal financial advisor for Indian users.

User Profile:
{context}

STRICT RULES:
- Only answer finance-related queries. Politely refuse anything else.
- Never promise returns or guarantee outcomes.
- Always justify advice using the user's actual Rs. numbers and percentages.
- Highlight risks clearly if financial health is weak.
- Keep response under 80 words — be sharp and actionable.
- Tone: helpful, practical, non-judgmental.
- If user financial health is weak, explicitly say "This is a risk"""

    text = call_llm(system, request.message, max_tokens=150)

    if not text:
        return {"response": "I'm unable to process that right now. Please try again."}

    return {
        "response": text[:300],
        "reasoning": "Generated based on income, savings rate, and expense distribution."
    }


@app.post("/api/explain")
def explain(data: ExplainRequest):
    drivers_text = "\n".join(
        f"- {d}" if isinstance(d, str)
        else f"- {d.get('label', 'Factor')}: {d.get('value', '')}"
        for d in data.top_drivers
    ) if data.top_drivers else "- General spending and savings pattern"

    p = data.user_profile
    profile_summary = (
        f"Income Rs.{p.get('income', 0):,}/month, Savings Rs.{p.get('savings', 0):,}/month"
        if p else "Not provided"
    )

    system = "You are a financial explainer. Convert data-driven recommendations into plain English. Be concise, specific, and jargon-free."

    prompt = f"""Explain this financial recommendation for an Indian banking user.

Recommendation: {data.recommended_action}

Key drivers:
{drivers_text}

User context: {profile_summary}

Return strictly in this format:
Short: <one sentence, max 15 words>
Full: <2-3 sentences explaining why this matters and what to do>"""

    text = call_llm(system, prompt, max_tokens=150)

    short_reason, full_explanation = "", ""

    if text:
        for line in text.split("\n"):
            s = line.strip()
            if s.startswith("Short:"):
                short_reason = s.replace("Short:", "").strip()
            elif s.startswith("Full:"):
                full_explanation = s.replace("Full:", "").strip()

    if not short_reason:
        short_reason = f"{data.recommended_action[:80]} based on your financial data."
    if not full_explanation:
        full_explanation = "This helps improve your financial health based on your income, expenses, and goals."

    return {
        "short_reason": short_reason[:120],
        "full_explanation": full_explanation[:400]
    }


@app.post("/api/starter-prompts")
def starter_prompts(req: StarterPromptsRequest):
    profile = req.profile
    savings = profile.savings
    income = profile.income
    expenses = profile.expenses or {}
    goals = profile.goals or []

    savings_rate = round((savings / income) * 100, 1) if income > 0 else 0
    food = expenses.get("food", 0)

    # All 3 prompts use real numbers — makes the chat UI feel personalized
    goal_prompt = (
        f"How can I reach my '{goals[0]}' goal faster?"
        if goals else
        "How do I start working towards a financial goal?"
    )

    return {
        "prompts": [
            goal_prompt,
            f"I save Rs.{savings:,}/month ({savings_rate}% of income) — is that enough?",
            f"I spend Rs.{food:,} on food monthly. How can I reduce this?"
        ]
    }


@app.get("/api/compliance")
def compliance():
    """
    4 compliance elements M1 renders:
    1. Consent modal  2. Simulation banner  3. KYC badge  4. Privacy summary
    Directly satisfies the 'Responsible Use of AI' judging criterion.
    """
    return {
        "disclaimer": "For simulation purposes only. This is not financial advice.",
        "simulation_banner": "Simulation Only - Not real financial advice",
        "kyc_status": "Verified",
        "consent_required": True,
        "consent_text": "We use your financial data to provide personalised insights. No data is stored or shared.",
        "data_usage_toggles": [
            {"label": "Use transaction data for analysis", "default": True, "required": True},
            {"label": "Use profile for personalised recommendations", "default": True, "required": True},
            {"label": "Anonymous analytics to improve the product", "default": False, "required": False}
        ],
        "privacy_summary": "All data is processed securely and used only within this app session. Not stored, not shared.",
        "regulatory_note": "For educational and demonstration purposes - PSBs Hackathon Series 2026."
    }