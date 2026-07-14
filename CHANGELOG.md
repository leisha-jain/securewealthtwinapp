# CHANGELOG — SecureWealth Twin (Team 51)

One line per merge into `main`. Maintained by the Integration Owner (Kailash).
Newest at the top.

## Unreleased

### Cyber Security Engineer (Kailash) — fraud-engine + zero-trust
- Add **honeypot cyber-deception layer** (`services/fraud-engine/honeypot.py`): 4 decoy surfaces — decoy investments, shadow accounts, fake API endpoints, trap form fields. Any hit forces an immediate BLOCK.
- Add **Signal 8 `signal_honeypot`** — runs first; a trigger is an instant BLOCK with no cooling-off and no override.
- Add fake decoy endpoints `/api/admin/users`, `/api/debug/dump`, `/api/internal/transfer` — any probe returns 403 and logs a CRITICAL `HONEYPOT_TRIGGERED` audit event.
- Add **zero-trust inter-service auth**: `X-Internal-Token` middleware on the fraud-engine and chat-service (`INTERNAL_SECRET`, default `swt-2026`); non-exempt routes return 401 without a valid token.
- Add **Signal 9 `velocity_abuse`** (5+ actions in 10 min, +15) and **Signal 10 `geographic_anomaly`** (device change mid-session, +20) with velocity/session tracking in `user_store.py`.
- Add **session risk accumulator** (continuous auth): WARN +10, BLOCK +25; once past 50, subsequent actions in the session are pre-penalised +15. Resets on logout / 30-min idle.
- Add `severity` field to audit entries; add `GET /api/risk/velocity/{user_id}` and `POST /api/risk/logout`.
- Extend `test_engine.py` with Signals 8–10, honeypot-override, and session pre-penalty scenarios — all pass.

<!--
Integration Owner checklist (Day 3):
  1. Sarthak  — market_snapshot.json + language_strings.json + transactions
  2. Kailash  — honeypot.py + zero-trust + velocity/session  ← this entry
  3. Shourya  — market_model.py + clustering.py + projection.py + endpoints
  4. Joy      — X-Internal-Token on all proxy calls + gateway routes + rate limiting
  5. Harshit  — 8-language chat + nudge endpoint
  6. Leisha   — language selector + honeypot alert display + ticker + simulator
  7. Kailash  — merge all PRs → main, run test_engine.py, tag v1.0-hackathon
After each merge run:  cd services/fraud-engine && python test_engine.py
-->
