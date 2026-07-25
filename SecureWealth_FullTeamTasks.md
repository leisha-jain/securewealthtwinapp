

SecureWealth Twin — Full Team Task Assignment
Every new feature · Every role · Every step · What to build, how to build it, and why it wins
PSBs Hackathon Series 2026  |  Cyber Security & Fraud in Wealth Management  |  Team 51
SecureWealth Twin  |  Team 51  |  PSBs Hackathon 2026  |  Confidential — Internal Use Only
This document covers every new feature to be added beyond what is already built. Each task includes what to build, which file it
goes  in,  why  it  will  impress  judges,  and  the  exact  steps  to  follow.  Read  your  section  fully  before  writing  a  single  line  of  code.
Follow the integration order on the last page.
## N. Kailash
## Team Lead + Cyber Security Engineer
Fraud Engine · Honeypot · Zero-Trust · Quantum
Security · GitHub Integration
ALREADY BUILT: 7-signal fraud engine, audit log, risk scorer, API gateway integration
## 1
## Honeypot Cyber Deception Layer
Why this wins: No other hackathon team will have active cyber deception. This is the single feature that makes security
judges stop and say 'they actually thought about attack surfaces, not just defenses.'
n Create services/fraud-engine/honeypot.py with 4 honeypot detector functions
n Honeypot 1 — Decoy Investments: Inject fake SIP entries (DECOY_MIDCAP_FUND_001) into portfolio data. Any API call
targeting them = +40 score
n Honeypot 2 — Shadow Accounts: Inject fake linked account XXXX9999 in aggregator response. Any transfer to it =
immediate BLOCK
n Honeypot 3 — Fake API Endpoints: Add routes /api/admin/users, /api/debug/dump, /api/internal/transfer to api.py.
Legitimate traffic never hits these. Any hit = HONEYPOT_TRIGGERED
n Honeypot 4 — Trap Form Fields: If the evaluate request contains trap_field with any value = bot detected
n In audit_log.py: add HONEYPOT_TRIGGERED as a special event type with severity CRITICAL
n Honeypot score = +40. Decision = BLOCK immediately. No cooling-off. No override.
n In signals.py: add signal_honeypot() as Signal 8 — runs first before all other signals
# honeypot.py — add this function
def signal_honeypot(payload, history):
triggered = bool(payload.get('trap_field', ''))
triggered = triggered or payload.get('target_account') == 'XXXX9999'
triggered = triggered or payload.get('action_type') in ['DECOY_MIDCAP_FUND_001']
return {'signal':'honeypot','triggered':triggered,'score':40 if triggered else 0}

SecureWealth Twin — Full Team Task AssignmentPSBs Hackathon 2026  |  Team 51  |  Page 2
SecureWealth Twin  |  Team 51  |  Confidential — Internal Use Only
## 2
Zero-Trust Inter-Service Authentication
Why this wins: Right now all microservices trust each other blindly. Adding a shared secret header means even if an attacker
gets inside the network, they cannot call services without the token. Judges from banking PMO will recognize this as a real
security pattern.
n Add INTERNAL_SECRET env variable to .env.example
n In all 3 Python services (wealth-engine/api.py, fraud-engine/api.py, chat-service/api.py): add FastAPI middleware that
checks X-Internal-Token header on every non-health route
n If X-Internal-Token is missing or wrong: return 401 immediately
n Tell Joy (Member 4) to add this header to every axios proxy call in the gateway
n This implements the Zero-Trust principle: never trust, always verify — even on internal calls
# Add to each Python service api.py
INTERNAL_SECRET = os.getenv('INTERNAL_SECRET','swt-2026')
## @app.middleware('http')
async def zero_trust(request, call_next):
if request.url.path != '/health':
if request.headers.get('X-Internal-Token') != INTERNAL_SECRET:
return JSONResponse({'error':'Unauthorized'},status_code=401)
return await call_next(request)
## 3
Velocity-Based Fraud Pattern Detection
Why this wins: Current signals look at one transaction at a time. Velocity detection looks at patterns across multiple
transactions in a time window — catching slow-burn fraud that evades single-transaction checks.
n In user_store.py: add a transaction_velocity dict per user — tracks timestamps of last 10 actions
n New signal (Signal 9): velocity_abuse — if user attempts 5+ wealth actions within 10 minutes = +15 score
n New signal (Signal 10): geographic_anomaly — if device_id changes mid-session = +20 score
n Add update_velocity(user_id, timestamp) function called after every evaluate request
n This catches automated bots that fire rapid transactions hoping one slips through
# In user_store.py — add velocity tracking
from collections import deque
def update_velocity(user_id, timestamp):
if user_id not in _VELOCITY: _VELOCITY[user_id] = deque(maxlen=10)
_VELOCITY[user_id].append(timestamp)
def check_velocity(user_id, window_minutes=10):
history = _VELOCITY.get(user_id, deque())
recent = [t for t in history if (now - t).seconds < window_minutes*60]
return len(recent) >= 5  # 5+ actions in 10 min = suspicious
## 4
Session Anomaly Score (Continuous Auth)
Why this wins: Banks globally are moving from point-in-time auth (login once, do anything) to continuous authentication
(re-score every action). This is the concept — implement it as a session risk accumulator.
n In user_store.py: add session_risk_accumulator dict — stores total risk seen in current session
n After every WARN decision: add 10 points to session accumulator
n After every BLOCK decision: add 25 points to session accumulator
n If session accumulator > 50: all subsequent actions in that session start at +15 (pre-penalised)
n Reset accumulator on logout or after 30 minutes of inactivity
n This means: if you've already had 2 suspicious actions, the 3rd is judged more harshly automatically

SecureWealth Twin — Full Team Task AssignmentPSBs Hackathon 2026  |  Team 51  |  Page 3
SecureWealth Twin  |  Team 51  |  Confidential — Internal Use Only
## 5
GitHub — Integration Owner Duties
Why this wins: As team lead you own merging all branches. Clean merges = clean demo.
n Create branch protection rule on GitHub: no direct push to main allowed
n Every member opens a Pull Request. You review and merge.
n After each merge: immediately run python test_engine.py from services/fraud-engine/ to confirm nothing broke
n Keep a CHANGELOG.md in root — one line per merge noting what was added
n Day 3 end: create a release tag: git tag v1.0-hackathon && git push --tags
n Tag is what you show judges as the 'submitted version'
git checkout main && git pull
git merge --no-ff member2-ai-engine -m 'merge: wealth engine + market model'
git merge --no-ff member4-api-gateway -m 'merge: gateway + zero-trust routes'
# repeat for each branch in integration order
git tag v1.0-hackathon && git push origin --tags

SecureWealth Twin — Full Team Task AssignmentPSBs Hackathon 2026  |  Team 51  |  Page 4
SecureWealth Twin  |  Team 51  |  Confidential — Internal Use Only
## Leisha Jain
## Frontend Engineer
React Web App · All Pages · RiskModal · Charts ·
UX Polish
ALREADY BUILT: All 7 pages, RiskModal 3 states, spending charts, health score badge
## 1
## Language Selector + Translated Fraud Warnings
Why this wins: When someone's money is being blocked, they need to read that warning in their own language. A language
selector that translates the RiskModal warning text is immediately visible to judges and directly serves 700M non-English
Indian bank customers.
n In Navbar.jsx: add a language dropdown with 8 options — English, nnnnn, nnnnn, nnnnnn, nnnnn, nnnnn,
nnnnn, nnnnnnn
n Store selected language in localStorage as preferred_language
n In RiskModal.jsx: import language strings from a local languageStrings.js file
n Translate: modal title, warning message, signal reasons, action buttons (Confirm / Cancel / Dismiss)
n Most critical: the BLOCK state message must show in the user's language
n Pass language field to every POST /api/chat call
n Add a small flag/language icon next to the selected language for visual appeal
// src/utils/languageStrings.js
export const strings = {
en: { blocked: 'Action Blocked', warning: 'Security Review Required' },
hi: { blocked: 'nnnnn nnnnnnn', warning: 'nnnnnnn nnnnnnn nnnnnn' },
ta: { blocked: 'nnnnn nnnnnnnnnnnnnn', warning: 'nnnnnnnnnn nnnnn nnnn' },
// ... add all 8 languages
## }
## 2
Honeypot Alert Display in Audit Log
Why this wins: When the honeypot fires, it needs to look dramatic in the UI. Judges watching the demo will remember this
moment — a special high-alert row that screams 'attacker detected.'
n In Alerts.jsx: add special styling for entries where decision === HONEYPOT_TRIGGERED
n Show a distinct dark red row with a skull/warning icon and label 'CYBER DECEPTION TRIGGERED'
n Show a tooltip or expanded row: 'An automated attack probe accessed a decoy asset. Session terminated.'
n Add a filter button at the top of the Alerts page: All / Security / Honeypot / Blocked
n Honeypot entries should show at the top of the list regardless of timestamp

SecureWealth Twin — Full Team Task AssignmentPSBs Hackathon 2026  |  Team 51  |  Page 5
SecureWealth Twin  |  Team 51  |  Confidential — Internal Use Only
## 3
## Market News Scrolling Ticker + Trending Stocks Widget
Why this wins: The dashboard currently shows static data. A live-feeling market ticker and trending stocks widget makes the
product feel like a real fintech app, not a hackathon project. Judges will notice the difference immediately.
n In Dashboard.jsx: add a horizontal auto-scrolling ticker at the very top showing market_alerts from the market snapshot API
n Use CSS animation (marquee effect with keyframes) — no library needed
n Add a TrendingStocks.jsx component showing top 5 stocks with green/red change arrows
n Show: stock symbol, company name, change_pct with color coding
n Add a small badge: 'In your portfolio' if the stock matches user's holdings
n Place trending stocks in a side panel on the Dashboard page
n Fetch from GET /api/market/snapshot — the data is already there, just display it
// Ticker CSS animation in index.css
.ticker-wrap { overflow: hidden; width: 100%; }
.ticker { display: inline-block; animation: ticker 20s linear infinite; }
@keyframes ticker { 0% { transform: translateX(100%); }
100% { transform: translateX(-100%); } }
## 4
## Savings Simulator — Interactive Goal Projection
Why this wins: The Goals page currently shows static progress. An interactive simulator where the user drags a slider and
watches their goal date change in real time is a powerful demo moment that shows the 'twin' concept working visually.
n In Goals.jsx: add a monthly_contribution slider (range input) — min: current SIP amount, max: 2x monthly income
n On slider change: recalculate months_to_goal = (goal_amount - goal_saved) / (savings_rate * monthly_income +
slider_value)
n Show a Recharts LineChart updating in real time as the slider moves — no API call needed, pure JS math
n Show: 'Save Rs.X more per month to reach your goal Y months earlier'
n Add a second slider for expected annual return (6% to 15%) to show the compounding effect
n This is the most visually engaging non-fraud feature — use it in the demo
## 5
Responsive Mobile-First Layout
Why this wins: Judges may open the demo on a tablet or phone. If the layout breaks on smaller screens, it undermines the
entire product. 30 minutes of responsive CSS work prevents an embarrassing moment.
n Add Tailwind responsive prefixes (sm:, md:) to Sidebar, Navbar, Dashboard grid
n On mobile: Sidebar becomes a bottom navigation bar (5 icons)
n Dashboard cards stack vertically on screens below 768px
n RiskModal is already full-screen — verify it works on mobile
n Test at 375px (iPhone SE), 768px (iPad), 1280px (laptop)
n Add a tag in index.html if not already present
## 6
Micro-interactions and Loading States
Why this wins: A polished app feels alive. These small details are the difference between a hackathon project and a product.
Judges who use the demo will feel the quality even if they cannot articulate why.
n Add skeleton loading screens (gray placeholder cards) while API data loads — not just a spinner
n Add a success toast notification when an ALLOW action completes: 'SIP started successfully'
n Add a subtle pulse animation on the HealthScoreBadge when the score updates
n Add hover effects on all action buttons — slight scale transform and shadow
n Add a page transition animation (fade-in) when navigating between routes using React Router
n Add number counter animation when health score first loads (counts from 0 to actual score)

SecureWealth Twin — Full Team Task AssignmentPSBs Hackathon 2026  |  Team 51  |  Page 6
SecureWealth Twin  |  Team 51  |  Confidential — Internal Use Only
## Shourya
## Solanki
AI/ML Engineer
Wealth Engine · SHAP · Market-Aware Model ·
## Recommendation Intelligence
ALREADY BUILT: GradientBoosting + SHAP KernelExplainer, /api/recommend/explain endpoint
## 1
Market-Trend Personalized Recommendation Model (Two-Stage Engine)
Why this wins: This is your biggest new feature. The current model only looks at the user's profile. This new layer also reads
live market conditions and blends both. When a judge asks 'how does the AI work?' you can say 'it has two intelligence layers
— personal and macro.' No other team will have this.
n Create services/wealth-engine/market_model.py
n Stage 1: run existing explainer.explain(user_profile) — gets personal recommendation
n Stage 2: run _analyze_market(market_snapshot) — reads nifty_ytd_return, gold_ytd_return, best_fd_rate, cpi_inflation,
rbi_repo_rate
n Market rules: gold > 10% YTD → suggest book_gold_profits | FD rate > 7.5% + inflation > 6.5% → suggest shift_to_fd | Nifty
down > 5% → reinforce increase_sip (averaging benefit) | Nifty up > 15% → suggest partial rebalance
n Stage 3: blend — if personal and market agree → high confidence | if they disagree → market wins at 60/40 weight
n Return: user_recommendation, market_recommendation, final_recommendation, blend_reasoning, confidence
n Add new endpoint: POST /api/recommend/market-aware
n This endpoint fetches market_snapshot.json itself — caller only needs to send user profile
# market_model.py — core blend function
def blend(user_rec, market_signals, user_conf):
for signal in market_signals:
if signal['action'] == user_rec:
return user_rec, min(user_conf + 0.15, 0.99), 'Both personal profile and market agree'
if market_signals:
top = max(market_signals, key=lambda x: x['strength'])
return top['action'], 0.72, f'Market overrides: {top["reason"]}'
return user_rec, user_conf, 'Based on your personal financial profile'
## 2
Financial Persona Clustering (Unsupervised ML)
Why this wins: Beyond giving recommendations, the system should automatically detect which type of investor the user is —
and tell them. This is a genuinely novel feature that demonstrates real ML thinking beyond classification.
n Create services/wealth-engine/clustering.py
n Use KMeans (k=5) on the 15 user profile features to cluster users into archetypes
n Define 5 archetypes: Cautious Saver, Growth Seeker, Balanced Builder, Risk Taker, Wealth Consolidator
n Each archetype gets a description, a typical recommendation pattern, and a behavioral insight
n Add endpoint: POST /api/recommend/archetype — takes user profile, returns their archetype + description
n Display this on the Dashboard: 'You are a Cautious Saver. Here is what that means for your financial health.'
n Judges will ask: 'what ML techniques did you use?' — now you have a second answer beyond just GradientBoosting
# clustering.py
## ARCHETYPES = {
0: {'name':'Cautious Saver','desc':'Low risk, FD-heavy, needs inflation-proofing'},
1: {'name':'Growth Seeker','desc':'Young, high savings rate, SIP-ready'},
2: {'name':'Balanced Builder','desc':'Mix of equity and debt, goal-oriented'},
3: {'name':'Risk Taker','desc':'Heavy equity, needs rebalancing guardrails'},
4: {'name':'Wealth Consolidator','desc':'High net worth, tax optimization focus'},
## }

SecureWealth Twin — Full Team Task AssignmentPSBs Hackathon 2026  |  Team 51  |  Page 7
SecureWealth Twin  |  Team 51  |  Confidential — Internal Use Only
## 3
## Goal Feasibility Projection Engine
Why this wins: Users want to know: will I actually reach my goal? Build a financial projection function that tells them exactly
— with a timeline chart and a 'what needs to change' breakdown.
n Create services/wealth-engine/projection.py
n Function: project_goal(current_savings, monthly_contribution, goal_amount, expected_return_pct, months_remaining)
n Returns month-by-month savings projection array (for the frontend chart)
n Returns: on_track (bool), projected_months, gap_amount, required_monthly_to_hit_deadline
n Also returns 3 'what-if' scenarios: if I invest Rs.500 more, if I get 2% better returns, if I extend deadline by 6 months
n Add endpoint: POST /api/recommend/goal-projection
n Member 1 (Leisha) uses this for the Goals page interactive simulator
## 4
## Spending Anomaly Detector
Why this wins: The wealth engine should proactively flag when a user's spending this month is significantly above their
historical average — before they even ask. This is the 'twin watching over you' concept in action.
n In explainer.py: add analyze_spending_anomaly(user_transactions) function
n Calculate: this_month_total vs avg_month_total from transactions array
n If this month > 1.4x average: flag top overspending category
n Return: {'anomaly': True, 'excess_amount': 8400, 'top_category': 'shopping', 'message': 'You spent Rs.8,400 more than
usual on shopping this month'}
n This powers the Dashboard nudge cards: 'You are overspending on dining — Rs.3,200 above your average'
n Add to POST /api/recommend/explain response as spending_anomalies array

SecureWealth Twin — Full Team Task AssignmentPSBs Hackathon 2026  |  Team 51  |  Page 8
SecureWealth Twin  |  Team 51  |  Confidential — Internal Use Only
## Joy Vashisht
## Backend Engineer
API Gateway · Action Orchestration · JWT Auth ·
Rate Limiting · Zero-Trust
ALREADY BUILT: API Gateway, action execute flow, JWT auth, all proxy routes
## 1
## Rate Limiting — Brute Force Protection
Why this wins: Without rate limiting, an attacker can call /api/auth/login 10,000 times to brute-force passwords. Rate limiting
is a basic security requirement that banking judges will check for. It takes 10 minutes to add and prevents an obvious
vulnerability.
n npm install express-rate-limit in services/api-gateway/
n Add rate limiter to login endpoint: max 5 attempts per IP per 15 minutes
n Add general rate limiter to all routes: max 100 requests per IP per minute
n On limit exceeded: return 429 Too Many Requests with message 'Too many attempts. Please try again in 15 minutes.'
n Log rate limit violations to console with IP address and endpoint
n This also protects the fraud engine from being overwhelmed by automated probes
const rateLimit = require('express-rate-limit');
const loginLimiter = rateLimit({
windowMs: 15 * 60 * 1000, // 15 minutes
max: 5,
message: { error: 'Too many login attempts. Try again in 15 minutes.' }
## });
app.post('/api/auth/login', loginLimiter, loginHandler);
## 2
Request Logging + Audit Trail in Gateway
Why this wins: Every single API request should be logged at the gateway level with timestamp, user ID, endpoint, response
time, and status code. This is what a real bank's API layer looks like and judges will ask 'how do you audit API usage?'
n Add morgan or a custom middleware that logs every request
n Log format: [timestamp] [user_id] [method] [path] [status] [response_time_ms]
n Write logs to a logs/ folder as JSON lines — one file per day
n Add endpoint: GET /api/admin/logs (protected, only accessible with admin JWT claim)
n This is separate from the fraud audit log — this is the API infrastructure audit
n In production this would feed into CloudWatch — mention this to judges
// Custom logging middleware
app.use((req, res, next) => {
const start = Date.now();
res.on('finish', () => {
const log = { ts: new Date().toISOString(),
user: req.user?.user_id || 'anon',
method: req.method, path: req.path,
status: res.statusCode, ms: Date.now()-start };
fs.appendFileSync('logs/api.log', JSON.stringify(log)+'\n');
}); next();
## });

SecureWealth Twin — Full Team Task AssignmentPSBs Hackathon 2026  |  Team 51  |  Page 9
SecureWealth Twin  |  Team 51  |  Confidential — Internal Use Only
## 3
Add X-Internal-Token to All Proxy Calls (Zero-Trust)
Why this wins: Kailash is adding zero-trust middleware to all Python services. Your job is to make sure the gateway always
sends the internal secret header when calling any downstream service. Without this, those services will return 401.
n Add INTERNAL_SECRET to services/api-gateway/.env
n Create a helper function proxyHeaders(req) that returns the forwarded auth header + X-Internal-Token
n Update EVERY axios.post/get call in index.js to use proxyHeaders(req) in the headers option
n Test: start fraud engine → call /api/action/execute → confirm it reaches fraud engine without 401
n Without this change nothing will work after Kailash pushes the zero-trust middleware
// Helper — add to top of index.js
const proxyHeaders = (req) => ({
'Authorization': req.headers.authorization || '',
'X-Internal-Token': process.env.INTERNAL_SECRET,
'Content-Type': 'application/json'
## });
// Then use in every proxy call:
await axios.post(FRAUD_URL+'/api/risk/evaluate', body, { headers: proxyHeaders(req) });
## 4
New Gateway Routes for New Features
Why this wins: As Shourya and Kailash add new endpoints, you need to add proxy routes for each one. Do this as soon as
they tell you the endpoint is ready.
n POST /api/recommend/market-aware → proxy to wealth engine port 8001
n GET /api/market/trending → proxy to wealth engine port 8001
n POST /api/recommend/archetype → proxy to wealth engine port 8001
n POST /api/recommend/goal-projection → proxy to wealth engine port 8001
n GET /api/risk/velocity/:user_id → proxy to fraud engine port 8002
n All routes must: verify JWT, add X-Internal-Token, forward user_id
n Create a routes/ folder and split index.js into route files: auth.js, wealth.js, fraud.js, chat.js — easier to manage
## 5
## Health Check Dashboard Endpoint
Why this wins: Add GET /api/health/all that pings all 4 services and returns their status. This is used by you before the demo
to confirm everything is running. It is also a great thing to show judges — 'all services are green.'
n GET /api/health/all — calls /health on ports 8001, 8002, 8003, 8004
n Returns: { wealth_engine: 'ok', fraud_engine: 'ok', chat_service: 'ok', aggregator: 'ok', gateway: 'ok' }
n If any service is down: returns { wealth_engine: 'DOWN', ... } with 503 status
n Leisha should add a small status indicator in the Navbar showing these health states
n Run this before every demo rehearsal to catch any service that failed to start
app.get('/api/health/all', async (req, res) => {
const check = async (url) => {
try { await axios.get(url+'/health',{timeout:2000}); return 'ok'; }
catch { return 'DOWN'; }
## };
res.json({
wealth_engine: await check(process.env.WEALTH_ENGINE_URL),
fraud_engine:  await check(process.env.FRAUD_ENGINE_URL),
chat_service:  await check(process.env.CHAT_SERVICE_URL),
## });
## });

SecureWealth Twin — Full Team Task AssignmentPSBs Hackathon 2026  |  Team 51  |  Page 10
SecureWealth Twin  |  Team 51  |  Confidential — Internal Use Only
## Sarthak Pandit
## Data Engineer
## User Personas · Market Data · Account Aggregator ·
## Trending Stocks · Language Strings
ALREADY BUILT: 6 persona JSONs, market_snapshot.json, mock_aggregator.py
## 1
Expand Market Snapshot with Trending Stocks + News
Why this wins: Shourya's trending stock analysis and Leisha's news ticker both depend on richer market data. You provide
the data layer they build on. Do this first — everyone is waiting for it.
n Open data/market_snapshot.json and add two new arrays: trending_stocks and market_news
n trending_stocks: add 8 entries with fields: symbol, name, change_pct, volume, sector
n Include stocks from different sectors: banking (HDFCBANK), tech (TCS, INFY), energy (RELIANCE), pharma
(SUNPHARMA), gold ETF (GOLDBEES)
n market_news: add 6 entries with fields: headline, impact (positive_fd / positive_gold / negative_equity / neutral / watch),
timestamp
n Make headlines realistic and current: mention RBI, SEBI, Nifty, gold, inflation
n Also add a market_scenario field: current value 'high_inflation' — Harshit can switch this during demo
{"symbol":"RELIANCE","name":"Reliance Industries","change_pct":3.2,"volume":"high","sector":"Energy
## "},
{"symbol":"GOLDBEES","name":"Gold BeES ETF","change_pct":0.9,"volume":"high","sector":"Gold"},
{"headline":"RBI holds repo rate at 6.5% — FD rates remain attractive",
"impact":"positive_fd","timestamp":"2026-04-20T09:00:00"}
## 2
Add Honeypot Decoy Assets to Every Persona
Why this wins: Kailash's honeypot needs fake assets injected into user data. You provide these in the persona files. This is a
5-minute change per file but critical for the honeypot feature to work.
n Open each persona JSON file in data/personas/
n Add a honeypot_assets array to every persona with exactly these entries:
n { name: DECOY_MIDCAP_FUND_001, type: fake_sip, monthly_amount: 0 }
n { account: XXXX9999, bank: SHADOW_BANK, type: honeypot_account }
n These are invisible in the real UI but exist in the API response
n Also add a trap_field_label: _csrf_token_backup to document what the hidden form field is named
n Also add the suspicious_actor persona a third honeypot entry — a fake large FD that a bot would target

SecureWealth Twin — Full Team Task AssignmentPSBs Hackathon 2026  |  Team 51  |  Page 11
SecureWealth Twin  |  Team 51  |  Confidential — Internal Use Only
## 3
Create language_strings.json — Translated UI Strings
Why this wins: Leisha's language selector needs translation strings. You build the data file she imports. This covers all critical
UI text in all 8 languages.
n Create data/language_strings.json
n Include these key strings in all 8 languages (English, Hindi, Tamil, Telugu, Bengali, Marathi, Kannada, Gujarati):
n action_blocked, security_review, action_approved, confirm_after_review, cancel_action
n fraud_warning_title, helpline_message, cooling_off_message
n Use Google Translate for accuracy — these are short phrases so quality will be good
n Keep the JSON structure flat: { key: { en: '...', hi: '...', ta: '...' } }
n Copy this file to frontend/src/utils/languageStrings.js and export it as a JS object
## {"action_blocked": {
"en": "Action Blocked for Your Protection",
"hi": "nnnn nnnnnnn nn nnn nnnnn nnnnnnn",
"ta": "nnnnnn nnnnnnnnnnnnnnn nnnnn nnnnnnnnnnnnnn"
## }}
## 4
Create a Realistic 12-Month Transaction History Generator
Why this wins: Currently each persona has only 5-10 transactions. Shourya's spending anomaly detector and market-aware
model need richer data to produce convincing outputs. Generate a full year of realistic transactions programmatically.
n Create data/generate_transactions.py — a script that generates 12 months × ~25 transactions per month = 300 transactions
per persona
n Each transaction has: date, category, amount (vary by ±20% each month), description
n For priya_27: add 3 months where shopping spikes by 40% (anomaly months) — Shourya's detector will catch these
n For suspicious_actor: make October a month where transactions suddenly jump 5x — this is the fraud pattern
n Run the script: python generate_transactions.py → outputs updated persona JSONs
n Rich transaction data makes SHAP outputs more meaningful and demo more convincing
# generate_transactions.py — core loop
import random, json
from datetime import date, timedelta
def generate_month(base_amounts, anomaly_factor=1.0):
txns = []
for cat, base in base_amounts.items():
n_txns = random.randint(3, 8)
for _ in range(n_txns):
amount = base/n_txns * random.uniform(0.8,1.2) * anomaly_factor
txns.append({'category':cat,'amount':round(amount,0)})
return txns

SecureWealth Twin — Full Team Task AssignmentPSBs Hackathon 2026  |  Team 51  |  Page 12
SecureWealth Twin  |  Team 51  |  Confidential — Internal Use Only
## Harshit Rai
## Chat & Demo Engineer
AI Coach · Compliance · 8-Language Support ·
## Demo Script · Presentation
ALREADY BUILT: Claude chat service, compliance screens, basic demo script
## 1
8-Language Support in Chat Service
Why this wins: When a customer gets a fraud warning, they need guidance in their own language. An AI coach that responds
in Hindi or Tamil is a feature no other team will have and it directly addresses the rural India inclusion problem that judges care
about.
n In services/chat-service/api.py: add LANGUAGE_PROMPTS dict with system prompt prefixes for all 8 languages
n Detect language from request body: language field sent by frontend
n If language is not English: prepend the language-specific instruction to the system prompt
n Add a special flag: is_fraud_alert (bool) — when True, make AI respond urgently and start with [FRAUD ALERT]
n Add suggested starter prompts in the user's language — 3 prompts per language
n Test: send a chat message with language: 'hi' and verify the response is in Hindi
n Keep response under 400 tokens to keep latency fast — critical for demo
## LANG_PREFIXES = {
'hi': 'nnnnn nnn nnnn nnnn nnnnnnnnn nn nnnnnn nnnnn',
'ta': 'nnnnnnn nnnnnnnnnnnnn. nnnnnnnnnnn nnnnnnnnnnnnnn nnnnnnnnn',
'te': 'nnnnnnnn nnnnnnn nnnnnnnn',
'bn': 'nnnnnnn nnnnn nnnn',
'mr': 'nnnnnn nnnnn nnnnn',
'kn': 'nnnnnnnnnn nnnnnnnnn',
'gu': 'nnnnnnnnnn nnnn nnnn'
## }
## 2
Proactive AI Nudge Engine
Why this wins: Instead of waiting for the user to ask, the AI should proactively surface insights. When the dashboard loads,
show 3 AI-generated nudges tailored to the user's specific situation. This is the 'twin watching over you' concept made
tangible.
n Add endpoint: POST /api/chat/nudges — takes user_profile, returns 3 short proactive tips
n System prompt for nudges: 'You are a financial advisor. Given this profile, generate exactly 3 short, actionable nudges.
Each must be under 20 words. Format as JSON array of strings. No preamble.'
n Examples of good nudges: 'Gold up 13% — consider booking Rs.20,000 profit this week.' | 'You have Rs.48,000 unused
80C space before March 31.' | 'You overspent Rs.3,200 on dining this month.'
n Leisha displays these in the Dashboard as 3 colored card chips at the top
n This replaces hardcoded nudge text with AI-generated personalized ones — huge quality jump
n Keep max_tokens=150 for speed — nudges must load fast
# POST /api/chat/nudges
NUDGE_PROMPT = '''Generate exactly 3 financial nudges for this user.
Each under 20 words. Return as JSON array only. No other text.
User profile: {profile}'''
## @app.post('/api/chat/nudges')
async def nudges(data: dict):
prompt = NUDGE_PROMPT.format(profile=str(data['user_profile'])[:400])
resp = client.messages.create(model='claude-haiku-4-5-20251001',
max_tokens=150, messages=[{'role':'user','content':prompt}])
return {'nudges': json.loads(resp.content[0].text)}

SecureWealth Twin — Full Team Task AssignmentPSBs Hackathon 2026  |  Team 51  |  Page 13
SecureWealth Twin  |  Team 51  |  Confidential — Internal Use Only
## 3
Full 7-Beat Demo Script with Exact Clicks
Why this wins: The demo is your most important deliverable. A rehearsed, smooth demo wins more than any feature. Write a
script where every beat has: what to say, what to click, what to show, what judge reaction to expect.
n Beat 1 (30s): Login as priya_27. ConsentModal appears. Click 'I Agree'. Land on Dashboard.
n Beat 2 (45s): Point to Health Score 72/100. Explain the spending chart. Show market news ticker. Point to AI nudge cards.
n Beat 3 (30s): Navigate to Goals. Show 'Buy a Car' at 20%. Move slider — show projected date changing live.
n Beat 4 (45s): Navigate to Chat. Click suggested prompt 'What is my biggest financial risk?' Show AI response. Point to
'Why?' panel showing SHAP values.
n Beat 5 (60s): Log out. Log in as suspicious_actor. Click 'Start SIP'. Fraud engine fires. RED BLOCK modal with score
90/100. Read out each triggered signal. This is the climax.
n Beat 6 (30s): Navigate to Alerts. Show audit log. Point to BLOCK entry with all 5 signals listed.
n Beat 7 (30s): Open browser DevTools. Hit the honeypot route /api/admin/users. Show 403. Refresh Alerts —
HONEYPOT_TRIGGERED entry appears at top.
n Rehearse this sequence until you can do it in under 5 minutes with zero hesitation
## 4
## Quantum Security Talking Points Document
Why this wins: Three slides in the PPT mention quantum security. You need a 1-page cheat sheet so any team member can
answer judge questions about it confidently without sounding vague.
n Create a simple text document: QUANTUM_TALKING_POINTS.md in the repo root
n Cover: what is the quantum threat to banking (harvest now, decrypt later attacks)
n Cover: what is post-quantum TLS 1.3 (Kyber-based hybrid key exchange — NIST standard)
n Cover: what is crypto-agility (architecture that can swap algorithms without rebuild)
n Cover: why banks specifically need this (long-lived financial records, 10+ year data retention)
n Cover: what we implemented vs what is roadmap
n Keep it to 5 bullet points max — judges ask follow-ups, you give depth from memory
## 5
## Error Fallback Screens
Why this wins: What happens if the AI service is slow or the wealth engine times out during the demo? Right now the app
probably crashes or shows a blank screen. Build graceful fallbacks so the demo never breaks visibly.
n In Chat.jsx: if POST /api/chat fails, show fallback message: 'Our AI advisor is temporarily unavailable. Here are general tips
based on your profile.' + 3 hardcoded generic tips
n In Dashboard.jsx: if POST /api/recommend/explain fails, show static recommendation cards
n In all pages: wrap every API call in try/catch with a toast notification on failure
n Add a demo_mode flag in .env — when true, all API failures return mock responses instead of errors
n Test this: kill the wealth engine service → verify Dashboard still loads without crashing
n Never let a service failure show a blank white screen during the demo

SecureWealth Twin — Full Team Task AssignmentPSBs Hackathon 2026  |  Team 51  |  Page 14
SecureWealth Twin  |  Team 51  |  Confidential — Internal Use Only
## ALL MEMBERS
## Integration Order + Final Checklist
Follow this sequence on Day 3. Deviation causes
merge conflicts.
StepWhoWhatOthers waiting on this
1Sarthak (M5)Push expanded market_snapshot.json + language_strings.json + generated transactionsShourya, Leisha, Harshit
2Kailash (YOU)Push honeypot.py + zero-trust middleware + velocity trackingJoy
3Shourya (M2)Push market_model.py + clustering.py + projection.py + new endpointsJoy, Leisha
4Joy (M4)Add X-Internal-Token to all proxy calls + new gateway routes + rate limitingEveryone
5Harshit (M6)Push 8-language chat + nudge endpointLeisha
6Leisha (M1)Add language selector + honeypot alert display + market ticker + simulatorNo one (last)
7Kailash (YOU)Merge all PRs into main. Run full integration test. Tag v1.0-hackathon—
## FINAL DEMO DAY CHECKLIST
n KailashAll 6 terminals running. /api/health/all returns all green.
n Kailashsuspicious_actor login → Start SIP → BLOCK modal fires with score 90+
n KailashHoneypot probe → /api/admin/users → 403 → HONEYPOT_TRIGGERED in audit log
n LeishaLanguage switched to Hindi → RiskModal shows Hindi text
n LeishaMarket news ticker scrolling on Dashboard. Trending stocks widget visible.
n LeishaGoals page slider moves → projected date updates in real time
n ShouryaPOST /api/recommend/market-aware returns blend_reasoning field
n ShouryaPOST /api/recommend/archetype returns correct archetype for priya_27
n JoyRate limiter: 6th login attempt in 15 min returns 429
n JoyGET /api/health/all returns all services green
n Sarthakmarket_snapshot has trending_stocks and market_news arrays
n HarshitPOST /api/chat with language:hi returns Hindi response
n HarshitPOST /api/chat/nudges returns 3 personalized nudge strings
n HarshitDemo script rehearsed 3 times. 7 beats under 5 minutes total.
n ALLKill wealth-engine → Dashboard still loads (fallback screens work)
SecureWealth Twin — The version of this project that a judge has never seen before.