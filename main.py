from fastapi import FastAPI
from pydantic import BaseModel
from dotenv import load_dotenv
import os, requests, json, re, random, time
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional

# ------------------ CONFIG ------------------
USE_AI = True
DEBUG  = True

# ------------------ LOAD ENV ------------------
load_dotenv()

app = FastAPI()

api_key = os.getenv("OPENROUTER_API_KEY")
print("API KEY:", api_key)

# ------------------ IN-MEMORY STORES ------------------
# Demo users — in production these come from a real DB
DEMO_USERS = {
    1: {"userId": 1, "name": "Arjun Mehta",  "password": "demo123", "phone": "+91 98765 43210"},
    2: {"userId": 2, "name": "Priya Sharma", "password": "demo123", "phone": "+91 98765 43211"},
    3: {"userId": 3, "name": "Ramesh Gupta", "password": "demo123", "phone": "+91 98765 43212"},
}
# username aliases
USERNAME_MAP = {"priya": 2, "arjun": 1, "ramesh": 3}

# OTP store: {userId: {"code": "123456", "expires": timestamp}}
OTP_STORE = {}

# ------------------ MODELS ------------------
class UserProfile(BaseModel):
    income: int
    savings: int
    expenses: dict
    goals: list

class ChatRequest(BaseModel):
    message: str
    user_profile: UserProfile

class ExplainRequest(BaseModel):
    recommendation: str

class LoginRequest(BaseModel):
    userId: Optional[int] = None
    username: Optional[str] = None
    password: str
    deviceId: Optional[str] = "web"

class OTPRequest(BaseModel):
    userId: int
    code: str

# ------------------ CORS ------------------
_CORS_ORIGINS = [o.strip() for o in os.getenv(
    "CORS_ORIGINS", "http://localhost:3000,http://localhost:8100"
).split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------ AUTH ROUTES ------------------
@app.post("/api/auth/login")
def login(req: LoginRequest):
    # Resolve userId from username string or numeric id
    uid = req.userId
    if not uid and req.username:
        uid = USERNAME_MAP.get(req.username.lower())
    if not uid:
        # try parsing username as number
        try:
            uid = int(req.username)
        except Exception:
            pass

    user = DEMO_USERS.get(uid)
    if not user:
        return {"error": "User not found"}, 404

    if req.password != user["password"]:
        from fastapi import HTTPException
        raise HTTPException(status_code=401, detail="Invalid password")

    # Generate OTP
    otp_code = str(random.randint(100000, 999999))
    OTP_STORE[uid] = {"code": otp_code, "expires": time.time() + 300}
    print(f"[OTP] User {uid} ({user['name']}): {otp_code}")  # shown in terminal

    return {
        "token": f"demo-token-{uid}",
        "user": {"userId": uid, "name": user["name"]},
        "otp_sent": True,
        "otp_hint": otp_code,   # shown in response for demo purposes
        "message": f"OTP sent to {user['phone']}"
    }

@app.post("/api/auth/verify-otp")
def verify_otp(req: OTPRequest):
    stored = OTP_STORE.get(req.userId)
    if not stored:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="No OTP found. Please login again.")

    if time.time() > stored["expires"]:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="OTP expired. Please login again.")

    if req.code != stored["code"]:
        from fastapi import HTTPException
        raise HTTPException(status_code=401, detail="Invalid OTP")

    del OTP_STORE[req.userId]  # one-time use
    return {"success": True, "message": "OTP verified"}

@app.get("/health")
def health():
    return {"status": "ok", "service": "wealth-engine"}

# ------------------ ROUTES ------------------
@app.get("/")
def home():
    return {"message": "AI Coach Running"}

@app.get("/compliance")
def compliance_info():
    return {
        "disclaimer": "For simulation purposes only. This is not financial advice.",
        "data_privacy": "User data is processed securely and not shared with third parties.",
        "kyc_status": "Verified"
    }

@app.post("/chat")
def chat(request: ChatRequest):
    profile = request.user_profile

    if USE_AI:
        print("Calling Llama...")
        ai_recs = generate_ai_recommendations(profile)
    else:
        print("⚠️ AI disabled, using fallback")
        ai_recs = None
    if ai_recs:
        print("✅ Llama response used")
        recommendations = [
            {
                "type": rec.get("type", "general"),
                "advice": rec.get("advice", ""),
                "explanation": generate_explanation(rec.get("advice", ""))
            }
            for rec in ai_recs
        ]
    else:
        print("⚠️ Fallback logic used")
        recommendations = generate_recommendations(profile)

    return {
        "health_score": calculate_health_score(profile),
        "top_recommendations": recommendations[:3],
        "all_recommendations": recommendations,
        "insights": generate_insights(profile),

        "starter_prompts": generate_starter_prompts(profile),
        "compliance": {
            "disclaimer": "For simulation purposes only. This is not financial advice.",
            "kyc_status": "Verified",
            "consent_required": True,
            "data_usage": "Your financial data is used only to generate personalized insights and is not stored permanently."
        }
    }

@app.post("/explain")
def explain(request: ExplainRequest):
    return {"explanation": generate_explanation(request.recommendation)}

# ------------------ CORE LOGIC ------------------
def generate_explanation(recommendation: str):
    rec = recommendation.lower()

    if "food" in rec or "dining" in rec:
        return "You are spending a large portion of your income on food. Reducing this improves savings significantly."

    elif "sip" in rec:
        return "SIPs help you invest consistently and reduce risk from market fluctuations."

    elif "goal" in rec:
        return "This advice helps you reach your financial goal faster by improving your savings or investment plan."

    elif "tax" in rec:
        return "Tax-saving investments can reduce your taxable income while growing wealth."

    else:
        return f"This recommendation is based on your current financial pattern. {recommendation}"

def generate_recommendations(profile):
    income = profile.income
    savings = profile.savings
    expenses = profile.expenses or {}

    recs = []
    food_spend = expenses.get("food", 0)

    # Savings
    if income > 0 and food_spend > 0.3 * income:
        advice = f"Reduce food spending by ₹2000/month from current ₹{food_spend}."
        recs.append({
            "type": "savings",
            "advice": advice,
            "explanation": generate_explanation(advice)
        })

    # Investment
    if savings > 0:
        advice = f"Start SIP of ₹{int(savings * 0.5)} per month to grow wealth."
        recs.append({
            "type": "investment",
            "advice": advice,
            "explanation": generate_explanation(advice)
        })

    # Risk
    if income > 0 and savings < 0.1 * income:
        advice = "Your savings rate is low. Build an emergency fund covering 3–6 months of expenses."
        recs.append({
            "type": "risk",
            "advice": advice,
            "explanation": generate_explanation(advice)
        })

    # Tax
    advice = "Consider investing in ELSS or PPF to save taxes under Section 80C."
    recs.append({
        "type": "tax",
        "advice": advice,
        "explanation": generate_explanation(advice)
    })

    return recs

def calculate_health_score(profile):
    income = profile.income
    savings = profile.savings

    if income == 0:
        return 0

    savings_rate = savings / income

    if savings_rate > 0.3:
        return 85
    elif savings_rate > 0.2:
        return 70
    elif savings_rate > 0.1:
        return 55
    else:
        return 40

def generate_insights(profile):
    income = profile.income
    expenses = profile.expenses or {}

    total_expense = sum(expenses.values()) if expenses else 0
    savings_rate = ((income - total_expense) / income) if income > 0 else 0

    top_category = max(expenses, key=expenses.get) if expenses else "N/A"

    return {
        "total_expense": total_expense,
        "savings_rate": round(savings_rate * 100, 2),
        "top_expense_category": top_category
    }

# ------------------ LLAMA ------------------
def generate_ai_recommendations(profile):
    try:
        context = build_user_context(profile)

        prompt = f"""
You are SecureWealth Twin, a personal financial advisor for Indian users.

STRICT RULES:
- Always base advice on user's actual numbers
- Mention ₹ values or %
- Do NOT give generic advice
- Do NOT promise returns
- If data is insufficient, make a reasonable assumption and state it
- If the user asks anything unrelated to personal finance, politely refuse and guide them back to financial topics.
- Every recommendation must include a clear action (what exactly to do next)
- Avoid vague words like "more", "less", "better" — always quantify advice
- Prioritize the most impactful issue in the user's finances first
- Highlight potential risks clearly if the user's financial situation is weak
- Do NOT assume investments, assets, or data not present in the user profile
- Output must be valid JSON only. Do not include any explanation, markdown, or extra text outside JSON
- Ensure recommendations do not contradict each other
- Keep tone supportive and non-judgmental, even if user behavior is poor

User Context:
{context}

Give exactly 3 recommendations in JSON:
[
  {{"type": "savings", "advice": "..."}},
  {{"type": "investment", "advice": "..."}},
  {{"type": "risk", "advice": "..."}}
]

Return ONLY JSON.
"""

        print(" Calling Llama (OpenRouter)...")

        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {os.getenv('OPENROUTER_API_KEY')}",
                "Content-Type": "application/json"
            },
            json={
                "model": "meta-llama/llama-3.3-70b-instruct",
                "messages": [
                    {"role": "system", "content": "You are a financial advisor."},
                    {"role": "user", "content": prompt}
                ],
                "max_tokens": 300,
                "temperature": 0.7
            },
        timeout = 10
        )

        data = response.json()

        if "choices" not in data or not data["choices"]:
            print("Invalid response from Llama:", data)
            return None

        text = data["choices"][0]["message"].get("content", "")

        if not text:
            print("Empty response from Llama")
            return None

        print("=== Llama TEXT ===")
        print(text)

        # Extract JSON safely
        match = re.search(r'\[.*\]', text, re.DOTALL)

        if not match:
            print("⚠️ JSON parsing failed")
            return None

        return json.loads(match.group())

    except Exception as e:
        print("❌ Llama failed:", e)
        return None

def build_user_context(profile):
    income = profile.income
    savings = profile.savings
    expenses = profile.expenses or {}

    total_expense = sum(expenses.values()) if expenses else 0
    savings_rate = (savings / income) * 100 if income > 0 else 0

    food_spend = expenses.get("food", 0)
    food_ratio = (food_spend / income) * 100 if income > 0 else 0

    return f"""
    User earns ₹{income} per month.
    Current savings: ₹{savings} ({round(savings_rate, 1)}% savings rate).
    Total expenses: ₹{total_expense}.
    Food spending: ₹{food_spend} ({round(food_ratio, 1)}% of income).
    Goals: {profile.goals}.
    """
def generate_starter_prompts(profile):
    income = profile.income
    savings = profile.savings
    expenses = profile.expenses or {}

    food = expenses.get("food", 0)

    prompts = [
        f"How can I reach my goal {profile.goals[0]} faster?" if profile.goals else "How can I improve my financial goals?",
        f"Am I saving enough with ₹{savings} monthly savings?",
        f"I spend ₹{food} on food. How can I optimize this?"
    ]

    return prompts