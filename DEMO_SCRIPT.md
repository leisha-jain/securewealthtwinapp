# SecureWealth Twin — 7-Beat Demo Script
**PSBs Hackathon 2026 | Team 51 | Target: Under 5 minutes**

---

## Pre-Demo Checklist
- [ ] Run `GET /api/health/all` — confirm all services green
- [ ] Browser open at `localhost:3000`, logged out
- [ ] DevTools closed (open only for Beat 7)
- [ ] Screen mirrored / projector confirmed

---

## Beat 1 — Login & Consent (30 seconds)
**Say:** "Let me show you SecureWealth Twin — a real-time AI fraud detection and wealth management system."

**Do:**
1. Go to `localhost:3000`
2. Enter username: `priya`, password: `1234` → click Login
3. OTP screen appears → click Verify
4. Consent modal appears → click **"I Agree"**
5. Land on Dashboard

**Judge reaction:** *"Clean onboarding. Consent modal shows responsible AI thinking."*

---

## Beat 2 — Dashboard Intelligence (45 seconds)
**Say:** "The moment Priya logs in, her AI twin springs to life."

**Point to:**
- **Health Score 72/100** — animates from 0 to 72 on load
- **Market news ticker** scrolling at the top — live market data
- **3 AI nudge cards** — "Gold up 13% — consider booking profits" etc.
- **Savings Velocity chart** — 8 months of cumulative growth
- **Trending stocks panel** on the right — RELIANCE, GOLDBEES with portfolio badges

**Say:** "These nudges are AI-generated, personalised to Priya's exact financial profile."

**Judge reaction:** *"This feels like a real fintech product, not a hackathon project."*

---

## Beat 3 — Goals Simulator (30 seconds)
**Say:** "Now let me show the 'twin' concept working visually."

**Do:**
1. Click **Goals** in sidebar
2. Point to **"Buy a Car"** goal at 20% progress
3. Drag the **Extra Monthly SIP slider** from ₹0 to ₹5,000
4. Watch the **Recharts line chart** update in real time
5. Read out: *"Save ₹5,000 more per month → reach goal 18 months earlier"*
6. Also drag **Expected Return slider** from 8% to 12% — show compounding

**Say:** "No API call — pure financial math running in the browser, instantly."

**Judge reaction:** *"Interactive and visually engaging. The twin is working."*

---

## Beat 4 — AI Coach Chat (45 seconds)
**Say:** "Every user has a 24/7 AI wealth coach."

**Do:**
1. Click **AI Coach** in sidebar (or chat bubble on dashboard)
2. Click suggested starter prompt: **"What is my biggest financial risk?"**
3. Show AI response — personalized to Priya's Rs. numbers
4. Click **"Why?"** on any insight card → show SHAP values panel
5. Point to: *"Time Horizon: 95% impact, Risk Tolerance: 72% impact"*

**Say:** "This is explainable AI — we don't just give recommendations, we show exactly why."

**Judge reaction:** *"SHAP values for transparency is very impressive."*

---

## Beat 5 — FRAUD INTERCEPT — The Climax (60 seconds)
**Say:** "Now watch what happens when an attacker tries to move money."

**Do:**
1. Click **logout** (or use Command Palette `Ctrl+K` → "Switch to suspicious_actor")
2. Login as `suspicious_actor` / `123`
3. Go to Dashboard → click **"Execute Optimization"**
4. **RED BLOCK MODAL fires** — score 90+/100
5. Read out each triggered signal slowly:
   - *"New untrusted device — +20"*
   - *"Action within 10 seconds of login — +15"*
   - *"Amount 3x the 90-day average — +25"*
   - *"OTP retried twice — +20"*
   - *"Night transfer above ₹50,000 — +10"*
6. Point to: *"Total score: 90. Decision: BLOCK. No override possible."*

**Say:** "Seven independent signals, evaluated in real-time, before a single rupee moves."

**Judge reaction:** *"This is exactly how banking fraud systems work."*

---

## Beat 6 — Audit Log (30 seconds)
**Say:** "Every event is logged. Nothing is hidden."

**Do:**
1. Click **Alerts & Risk** in sidebar
2. Point to the BLOCK entry at the top with all 5 signals listed
3. Click **filter button: "Blocked"** — only blocked transactions shown
4. Show the score, timestamp, and decision

**Say:** "This is your forensic trail — every action, every signal, every decision. Regulators love this."

**Judge reaction:** *"Clean audit trail. This is production-grade thinking."*

---

## Beat 7 — Honeypot Cyber Deception (30 seconds)
**Say:** "Finally — what happens when an attacker probes our system?"

**Do:**
1. Open **DevTools** (`F12`) → Network tab
2. In the address bar or DevTools console, run:
   ```
   fetch('/api/admin/users').then(r => console.log(r.status))
   ```
3. Show **403 Forbidden** in the response
4. Go back to **Alerts & Risk** tab → refresh
5. Point to the **dark red HONEYPOT row** at the very top:
   - Skull icon
   - **"CYBER DECEPTION TRIGGERED"**
   - Tooltip: *"An automated attack probe accessed a decoy asset. Session terminated."*

**Say:** "No real team has active cyber deception. Attackers reveal themselves just by looking."

**Judge reaction:** *"This is genuinely creative security thinking. No one else will have this."*

---

## Language Demo (bonus — 20 seconds)
**Do:**
1. Click language selector in sidebar → switch to **हिंदी**
2. Trigger a BLOCK (or WARN) → RiskModal now shows Hindi text
3. Say: "700 million non-English Indian bank customers. They deserve warnings in their language."

---

## Closing Line
*"SecureWealth Twin doesn't just protect wealth. It understands it, explains it, and speaks your language."*

---

**Total time target: 4 minutes 30 seconds. Rehearse 3 times.**
