from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv
import os, json, requests
from typing import Optional

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

# ── Zero-Trust inter-service authentication ────────────────────────────────────
# Every request must carry the shared X-Internal-Token header injected by the
# API gateway. "Never trust, always verify" — even inside our own network.
# /health and / stay open for liveness probes; OPTIONS pre-flights are exempt.
INTERNAL_SECRET = os.getenv("INTERNAL_SECRET", "swt-2026")
_ZERO_TRUST_EXEMPT = {"/health", "/"}


@app.middleware("http")
async def zero_trust(request: Request, call_next):
    if request.method != "OPTIONS" and request.url.path not in _ZERO_TRUST_EXEMPT:
        if request.headers.get("X-Internal-Token") != INTERNAL_SECRET:
            return JSONResponse({"error": "Unauthorized"}, status_code=401)
    return await call_next(request)

# ── 8-Language system prompt prefixes ──────────────────────────────────────────
LANG_PREFIXES = {
    "en": "",
    "hi": "कृपया अपना उत्तर हिंदी में दें। आप एक वित्तीय सलाहकार हैं।",
    "ta": "தயவுசெய்து தமிழில் பதில் அளிக்கவும். நீங்கள் ஒரு நிதி ஆலோசகர்.",
    "te": "దయచేసి తెలుగులో సమాధానం ఇవ్వండి. మీరు ఒక ఆర్థిక సలహాదారు.",
    "bn": "অনুগ্রহ করে বাংলায় উত্তর দিন। আপনি একজন আর্থিক পরামর্শদাতা।",
    "mr": "कृपया मराठीत उत्तर द्या. तुम्ही एक आर्थिक सल्लागार आहात.",
    "kn": "ದಯವಿಟ್ಟು ಕನ್ನಡದಲ್ಲಿ ಉತ್ತರ ನೀಡಿ. ನೀವು ಒಬ್ಬ ಹಣಕಾಸು ಸಲಹೆಗಾರ.",
    "gu": "કૃપા કરીને ગુજરાતીમાં જવાબ આપો. તમે એક નાણાકીય સલાહકાર છો.",
}

# Starter prompts per language (3 per language)
STARTER_PROMPTS = {
    "en": [
        "What is my biggest financial risk?",
        "How can I reach my goal faster?",
        "Should I continue SIPs in this market?",
    ],
    "hi": [
        "मेरा सबसे बड़ा वित्तीय जोखिम क्या है?",
        "मैं अपना लक्ष्य जल्दी कैसे पा सकता हूँ?",
        "क्या मुझे इस बाजार में SIP जारी रखना चाहिए?",
    ],
    "ta": [
        "என் மிகப்பெரிய நிதி ஆபத்து என்ன?",
        "என் இலக்கை எப்படி விரைவாக அடைவது?",
        "இந்த சந்தையில் SIP தொடர வேண்டுமா?",
    ],
    "te": [
        "నా అతిపెద్ద ఆర్థిక ప్రమాదం ఏమిటి?",
        "నా లక్ష్యాన్ని వేగంగా ఎలా చేరుకోవాలి?",
        "ఈ మార్కెట్‌లో SIP కొనసాగించాలా?",
    ],
    "bn": [
        "আমার সবচেয়ে বড় আর্থিক ঝুঁকি কী?",
        "আমি কীভাবে দ্রুত আমার লক্ষ্য অর্জন করতে পারি?",
        "এই বাজারে কি SIP চালিয়ে যাওয়া উচিত?",
    ],
    "mr": [
        "माझा सर्वात मोठा आर्थिक धोका कोणता?",
        "मी माझे ध्येय लवकर कसे साध्य करू?",
        "या बाजारात SIP सुरू ठेवावे का?",
    ],
    "kn": [
        "ನನ್ನ ದೊಡ್ಡ ಆರ್ಥಿಕ ಅಪಾಯ ಯಾವುದು?",
        "ನನ್ನ ಗುರಿಯನ್ನು ವೇಗವಾಗಿ ತಲುಪುವುದು ಹೇಗೆ?",
        "ಈ ಮಾರುಕಟ್ಟೆಯಲ್ಲಿ SIP ಮುಂದುವರಿಸಬೇಕೇ?",
    ],
    "gu": [
        "મારો સૌથી મોટો આર્થિક જોખમ શું છે?",
        "હું મારો ધ્યેય ઝડપથી કેવી રીતે મેળવી શકું?",
        "શું આ બજારમાં SIP ચાલુ રાખવું જોઈએ?",
    ],
}

# ── Models ─────────────────────────────────────────────────────────────────────
class UserProfile(BaseModel):
    income: Optional[int] = 80000
    savings: Optional[int] = 20000
    expenses: Optional[dict] = {}
    goals: Optional[list] = []

class ChatRequest(BaseModel):
    message: str
    profile: Optional[UserProfile] = None
    language: Optional[str] = "en"
    is_fraud_alert: Optional[bool] = False

class ExplainRequest(BaseModel):
    recommended_action: str
    top_drivers: list
    user_profile: dict

class StarterPromptsRequest(BaseModel):
    profile: UserProfile
    language: Optional[str] = "en"

class NudgeRequest(BaseModel):
    user_profile: dict
    language: Optional[str] = "en"

# ── Helpers ────────────────────────────────────────────────────────────────────
def build_user_context(profile: UserProfile) -> str:
    income = profile.income or 80000
    savings = profile.savings or 20000
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

# ── Routes ─────────────────────────────────────────────────────────────────────
@app.get("/")
def home():
    return {"message": "SecureWealth Chat Service Running", "port": 8003}

@app.get("/health")
def health():
    return {"status": "ok", "service": "chat-service"}


@app.post("/api/chat")
def chat(request: ChatRequest):
    lang = request.language or "en"
    lang_prefix = LANG_PREFIXES.get(lang, "")
    profile = request.profile or UserProfile()
    context = build_user_context(profile)

    # Fraud alert urgency flag
    fraud_prefix = ""
    if request.is_fraud_alert:
        fraud_prefix = "[FRAUD ALERT] This is an urgent security message. Respond urgently and clearly. "

    system = f"""{lang_prefix}
{fraud_prefix}You are SecureWealth Twin, a personal financial advisor for Indian users.

User Profile:
{context}

STRICT RULES:
- Only answer finance-related queries. Politely refuse anything else.
- Never promise returns or guarantee outcomes.
- Always justify advice using the user's actual Rs. numbers and percentages.
- Highlight risks clearly if financial health is weak.
- Keep response under 80 words — be sharp and actionable.
- Tone: helpful, practical, non-judgmental.
- If user financial health is weak, explicitly say "This is a risk"
- Respond in the same language as the system prompt prefix if non-English."""

    text = call_llm(system, request.message, max_tokens=150)

    if not text:
        return {"response": "I'm unable to process that right now. Please try again."}

    return {"response": text[:400]}


@app.post("/api/chat/nudges")
def nudges(request: NudgeRequest):
    """Generate 3 proactive AI nudges for the dashboard."""
    lang = request.language or "en"
    lang_prefix = LANG_PREFIXES.get(lang, "")

    NUDGE_PROMPT = f"""{lang_prefix}
Generate exactly 3 short financial nudges for this user.
Each nudge must be under 20 words. Return as a JSON array of strings only. No other text.
User profile: {str(request.user_profile)[:400]}

Example output: ["Gold up 13% — consider booking Rs.20,000 profit.", "You have Rs.48,000 unused 80C space before March 31.", "You overspent Rs.3,200 on dining this month."]"""

    text = call_llm("You are a financial nudge engine. Return only valid JSON arrays.", NUDGE_PROMPT, max_tokens=150)

    try:
        parsed = json.loads(text) if text else []
        if isinstance(parsed, list) and len(parsed) >= 1:
            return {"nudges": parsed[:3]}
    except Exception:
        pass

    # Fallback nudges
    return {
        "nudges": [
            "Gold up 13% — consider booking profits this week.",
            "You have unused 80C space before March 31.",
            "Review your monthly dining spend — it's above average.",
        ]
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
    lang = req.language or "en"
    prompts = STARTER_PROMPTS.get(lang, STARTER_PROMPTS["en"])
    return {"prompts": prompts}


@app.get("/api/compliance")
def compliance():
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
