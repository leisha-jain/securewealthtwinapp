// ─────────────────────────────────────────────────────────────────
// routes/user.js – User profile, dashboard, assets + goals (AUTH DISABLED)
// ─────────────────────────────────────────────────────────────────

const express = require('express');
const axios = require('axios');
// const { verifyToken } = require('../middleware/auth'); ❌ disabled for now
const router = express.Router();

const WEALTH_URL = process.env.WEALTH_ENGINE_URL || 'http://localhost:8001';

// ─────────────────────────────────────────────
// STUB USER PROFILES
// ─────────────────────────────────────────────
const STUB_PROFILES = {
  1: { id: 1, name: 'Arjun Mehta',   health_score: 78, savings_rate: 0.22, risk_appetite: 'moderate', kyc_verified: true,  monthly_income: 120000 },
  2: { id: 2, name: 'Priya Sharma',  health_score: 85, savings_rate: 0.30, risk_appetite: 'conservative', kyc_verified: true, monthly_income: 95000  },
  3: { id: 3, name: 'Ravi Kumar',    health_score: 62, savings_rate: 0.12, risk_appetite: 'aggressive', kyc_verified: false, monthly_income: 150000 },
  4: { id: 4, name: 'Fatima Sheikh', health_score: 91, savings_rate: 0.35, risk_appetite: 'conservative', kyc_verified: true, monthly_income: 80000  },
};

// ─────────────────────────────────────────────
// GOALS STORE (in-memory per user)
// ─────────────────────────────────────────────
const USER_GOALS = {
  1: [],
  2: [],
  3: [],
  4: []
};

// ─────────────────────────────────────────────
// PROFILE
// ─────────────────────────────────────────────
router.get('/:id/profile', async (req, res) => {
  const userId = Number(req.params.id);

  try {
    const response = await axios.get(`${WEALTH_URL}/users/${userId}`, { timeout: 3000 });
    return res.json(response.data);
  } catch (err) {
    console.warn(`[User] Wealth Engine unreachable — returning stub for user ${userId}`);
    const stub = STUB_PROFILES[userId];
    if (!stub) return res.status(404).json({ error: 'User not found' });
    return res.json({ ...stub, _stub: true });
  }
});

// ─────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────
router.get('/:id/dashboard', async (req, res) => {
  const userId = Number(req.params.id);

  try {
    const response = await axios.get(`${WEALTH_URL}/dashboard/${userId}`, { timeout: 3000 });
    return res.json(response.data);
  } catch (err) {
    console.warn(`[User] Wealth Engine unreachable — returning stub dashboard`);

    return res.json({
      _stub: true,
      user: STUB_PROFILES[userId] || { id: userId, name: 'Unknown' },
      net_worth: 1250000,
      total_assets: 1850000,
      spending_summary: {
        monthly_income: 120000,
        total_expense: 93600,
        savings_rate: 22,
      },
      goals: USER_GOALS[userId] || [] // ✅ include goals here
    });
  }
});

// ─────────────────────────────────────────────
// ASSETS
// ─────────────────────────────────────────────
router.get('/:id/assets', async (req, res) => {
  const userId = Number(req.params.id);

  try {
    const response = await axios.get(`${WEALTH_URL}/assets/`, {
      params: { user_id: userId },
      timeout: 3000
    });
    return res.json(response.data);
  } catch (err) {
    console.warn(`[User] Wealth Engine unreachable — returning stub assets`);

    return res.json([
      { id: 1, name: 'Index Fund SIP', asset_type: 'MUTUAL_FUND', current_value: 450000 },
      { id: 2, name: 'Fixed Deposit', asset_type: 'FD', current_value: 200000 },
      { id: 3, name: 'Equity Portfolio', asset_type: 'STOCKS', current_value: 380000 },
    ]);
  }
});

// ─────────────────────────────────────────────
// GOALS APIs
// ─────────────────────────────────────────────

/**
 * GET /api/user/:id/goals
 */
router.get('/:id/goals', (req, res) => {
  const userId = Number(req.params.id);
  return res.json(USER_GOALS[userId] || []);
});

/**
 * POST /api/user/:id/goals
 */
router.post('/:id/goals', (req, res) => {
  const userId = Number(req.params.id);
  const { title, targetAmount, deadline } = req.body;

  if (!title || !targetAmount) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const newGoal = {
    id: Date.now(),
    title,
    targetAmount,
    deadline,
    progress: 0
  };

  if (!USER_GOALS[userId]) USER_GOALS[userId] = [];
  USER_GOALS[userId].push(newGoal);

  return res.json(newGoal);
});

// ─────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────
module.exports = router;