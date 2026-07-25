from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
import os
import json
from groq import Groq
from dotenv import load_dotenv

# Load root .env file relative to this file
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")
load_dotenv(dotenv_path)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

LANGUAGE_PREFIXES = {
    "hi": "हिंदी में जवाब दें। संक्षिप्त और स्पष्ट रहें।\n\n",
    "ta": "தமிழில் பதிலளிக்கவும். தெளிவாகவும் சுருக்கமாகவும் இருங்கள்.\n\n",
    "te": "తెలుగులో సమాధానం ఇవ్వండి.\n\n",
    "bn": "বাংলায় উত্তর দিন।\n\n",
    "mr": "मराठीत उत्तर द्या।\n\n",
    "kn": "ಕನ್ನಡದಲ್ಲಿ ಉತ್ತರಿಸಿ.\n\n",
    "gu": "ગુજરાतीમાં જવાબ આપો.\n\n",
    "en": "",
}

BASE_SYSTEM_PROMPT = """You are SecureWealth Twin, a warm and knowledgeable personal financial advisor for Indian banking customers.

You have access to this customer's live financial profile:
{profile_details}

STRICT DIRECTIVES:
1. You must answer questions using the customer's actual numbers provided above. Never give generic financial advice that ignores their specific data.
2. If they ask about their net worth, portfolio value, allocations, or goals, answer with the exact numbers from their profile.
3. Proactively mention actionable recommendations (nudges) based on their profile in your response where relevant, e.g.:
   - Unused Section 80C tax-saving space (gap up to ₹1,50,000).
   - Overweight asset allocations (e.g. equity vs debt target alignment).
   - Off-track goals.
4. Respond in the requested language (simple plain English or the translated equivalent requested).
5. Always explain your reasoning in 2-3 sentences.
6. End every response with: 'This is for educational purposes only.'
7. Flag any risky actions by starting with '[RISK ALERT]'."""

class ChatRequest(BaseModel):
    user_id: Optional[str] = "unknown"
    message: str
    user_profile: Optional[dict] = Field(default={}, alias="profile")
    language: Optional[str] = "en"
    history: Optional[List[dict]] = []

    class Config:
        allow_population_by_field_name = True

class NudgeRequest(BaseModel):
    user_profile: Optional[dict] = Field(default={}, alias="user_profile")

    class Config:
        allow_population_by_field_name = True

@app.get("/health")
def health():
    return {"status": "ok", "service": "chat-service"}

@app.post("/api/chat")
async def chat(req: ChatRequest):
    if not GROQ_API_KEY:
        return {"reply": "AI coach is not configured. Please set GROQ_API_KEY in your .env file."}

    try:
        client = Groq(api_key=GROQ_API_KEY)

        # Parse profile details dynamically
        profile = req.user_profile or {}
        
        name = profile.get("name", "Priya Sharma")
        age = profile.get("age", 27)
        income = profile.get("income", profile.get("monthly_income", 95000))
        savings = profile.get("savings", 240000)
        
        # Calculate savings rate
        try:
            savings_rate = float(profile.get("savings_rate", 0.35))
        except:
            savings_rate = 0.35

        assets = profile.get("assets", [])
        liabilities = profile.get("liabilities", [])
        goals = profile.get("goals", [])
        expenses = profile.get("expenses", {})
        
        # Calculate net worth and allocations
        total_assets_val = 0
        equity_val = 0
        fd_val = 0
        gold_val = 0
        
        if isinstance(assets, list):
            for a in assets:
                val = a.get("value", a.get("amount", 0))
                try:
                    val = float(val)
                except:
                    val = 0
                total_assets_val += val
                
                cat = str(a.get("category", a.get("type", ""))).lower()
                if "equity" in cat or "mutual fund" in cat or "stock" in cat:
                    equity_val += val
                elif "fd" in cat or "fixed deposit" in cat or "savings" in cat or "cash" in cat:
                    fd_val += val
                elif "gold" in cat:
                    gold_val += val
                    
        total_liab_val = 0
        if isinstance(liabilities, list):
            for l in liabilities:
                val = l.get("value", l.get("amount", 0))
                try:
                    val = float(val)
                except:
                    val = 0
                total_liab_val += val
                
        net_worth = total_assets_val - total_liab_val
        
        total_investment = equity_val + fd_val + gold_val
        equity_pct = round((equity_val / total_investment * 100)) if total_investment > 0 else 0
        fd_pct = round((fd_val / total_investment * 100)) if total_investment > 0 else 0
        gold_pct = round((gold_val / total_investment * 100)) if total_investment > 0 else 0

        # Build the dynamic details block
        profile_details = f"""- Name: {name}
- Age: {age}
- Monthly Income: ₹{income:,.2f}
- Monthly Savings: ₹{savings:,.2f}
- Savings Rate: {savings_rate * 100:.1f}%
- Net Worth: ₹{net_worth:,.2f} (Total Assets: ₹{total_assets_val:,.2f}, Total Liabilities: ₹{total_liab_val:,.2f})
- Portfolio Allocations: Equity: {equity_pct}% (₹{equity_val:,.2f}), Fixed Deposits/Savings: {fd_pct}% (₹{fd_val:,.2f}), Gold: {gold_pct}% (₹{gold_val:,.2f})
- Spending breakdown by category: {json.dumps(expenses)}
- Current Goals and Progress: {json.dumps(goals)}
- Assets details: {json.dumps(assets)}
- Liabilities details: {json.dumps(liabilities)}
- Tax saving used percentage: {profile.get("tax_saving_used_percentage", 68.8)}%
- Health score: {profile.get("health_score", 84)}/100
"""

        lang_prefix = LANGUAGE_PREFIXES.get(req.language, "")
        system_prompt = lang_prefix + BASE_SYSTEM_PROMPT.format(profile_details=profile_details)

        # Build message history list
        messages = [{"role": "system", "content": system_prompt}]
        
        if req.history:
            for h in req.history:
                role = h.get("role", "user")
                if role == "assistant" or role == "ai":
                    role = "assistant"
                else:
                    role = "user"
                content = h.get("content", h.get("text", ""))
                if content:
                    messages.append({"role": role, "content": content})
                    
        # Append the new user message
        messages.append({"role": "user", "content": req.message})

        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=messages,
            max_tokens=400,
            temperature=0.7,
        )

        return {"reply": response.choices[0].message.content}

    except Exception as e:
        return {"reply": f"AI coach encountered an error: {str(e)}"}

@app.post("/api/chat/nudges")
async def nudges(req: NudgeRequest):
    if not GROQ_API_KEY:
        return {"nudges": [
            "Set up an SIP to start investing regularly.",
            "Review your 80C tax-saving options before March 31.",
            "Check if your emergency fund covers 6 months of expenses."
        ]}

    try:
        client = Groq(api_key=GROQ_API_KEY)
        profile_str = str(req.user_profile)[:600] if req.user_profile else ""

        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "You are a financial advisor. Generate exactly 3 short actionable financial nudges for this user. Each nudge must be under 15 words. Return only a JSON array of 3 strings. No other text. No markdown. Example: [\"Nudge one here.\", \"Nudge two here.\", \"Nudge three here.\"]"},
                {"role": "user", "content": f"User profile: {profile_str}"}
            ],
            max_tokens=150,
            temperature=0.7,
        )

        text = response.choices[0].message.content.strip()
        nudge_list = json.loads(text)
        return {"nudges": nudge_list}

    except Exception as e:
        return {"nudges": [
            "Review your spending patterns this month.",
            "Consider increasing your SIP by Rs.500.",
            "Check your 80C tax-saving limit before March 31."
        ]}
