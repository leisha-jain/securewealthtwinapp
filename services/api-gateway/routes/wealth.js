const express = require('express');
const axios = require('axios');
const { verifyToken } = require('../middleware/auth');
const { proxyHeaders } = require('../utils/proxy');
const router = express.Router();

const WEALTH_URL = process.env.WEALTH_ENGINE_URL || 'http://localhost:8001';

// ── In-Memory Stub fallbacks (from original user.js) ──
const STUB_PROFILES = {
  1: { id: 1, name: 'Arjun Mehta',   health_score: 78, savings_rate: 0.22, risk_appetite: 'moderate', kyc_verified: true,  monthly_income: 120000 },
  2: { id: 2, name: 'Priya Sharma',  health_score: 85, savings_rate: 0.30, risk_appetite: 'conservative', kyc_verified: true, monthly_income: 95000  },
  3: { id: 3, name: 'Ravi Kumar',    health_score: 62, savings_rate: 0.12, risk_appetite: 'aggressive', kyc_verified: false, monthly_income: 150000 },
  4: { id: 4, name: 'Fatima Sheikh', health_score: 91, savings_rate: 0.35, risk_appetite: 'conservative', kyc_verified: true, monthly_income: 80000  },
};

const USER_GOALS = {
  1: [],
  2: [],
  3: [],
  4: []
};

// ── USER / PROFILE ──
router.get('/:id/profile', verifyToken, async (req, res) => {
  const userId = Number(req.params.id);
  try {
    const response = await axios.get(`${WEALTH_URL}/users/${userId}`, {
      headers: proxyHeaders(req),
      timeout: 3000
    });
    return res.json(response.data);
  } catch (err) {
    console.warn(`[User] Wealth Engine unreachable — returning stub for user ${userId}`);
    const stub = STUB_PROFILES[userId];
    if (!stub) return res.status(404).json({ error: 'User not found' });
    return res.json({ ...stub, _stub: true });
  }
});

// ── DASHBOARD ──
router.get('/:id/dashboard', verifyToken, async (req, res) => {
  const userId = Number(req.params.id);
  try {
    const response = await axios.get(`${WEALTH_URL}/dashboard/${userId}`, {
      headers: proxyHeaders(req),
      timeout: 3000
    });
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
      goals: USER_GOALS[userId] || []
    });
  }
});

// ── ASSETS ──
router.get('/:id/assets', verifyToken, async (req, res) => {
  const userId = Number(req.params.id);
  try {
    const response = await axios.get(`${WEALTH_URL}/assets/`, {
      params: { user_id: userId },
      headers: proxyHeaders(req),
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

// ── GOALS ──
router.get('/:id/goals', verifyToken, (req, res) => {
  const userId = Number(req.params.id);
  return res.json(USER_GOALS[userId] || []);
});

router.post('/:id/goals', verifyToken, (req, res) => {
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

// ── RECOMMEND / MARKET-AWARE ──
router.post('/market-aware', verifyToken, async (req, res) => {
  try {
    const body = { ...req.body, user_id: String(req.user.userId) };
    const response = await axios.post(`${WEALTH_URL}/api/recommend/market-aware`, body, {
      headers: proxyHeaders(req)
    });
    return res.json(response.data);
  } catch (err) {
    console.error('[Wealth Router] market-aware failed:', err.message);
    return res.status(err.response?.status || 500).json({
      error: 'Failed to evaluate market-aware recommendation',
      detail: err.message
    });
  }
});

// ── RECOMMEND / ARCHETYPE ──
router.post('/archetype', verifyToken, async (req, res) => {
  try {
    const body = { ...req.body, user_id: String(req.user.userId) };
    const response = await axios.post(`${WEALTH_URL}/api/recommend/archetype`, body, {
      headers: proxyHeaders(req)
    });
    return res.json(response.data);
  } catch (err) {
    console.error('[Wealth Router] archetype failed:', err.message);
    return res.status(err.response?.status || 500).json({
      error: 'Failed to evaluate user archetype',
      detail: err.message
    });
  }
});

// ── RECOMMEND / GOAL-PROJECTION ──
router.post('/goal-projection', verifyToken, async (req, res) => {
  try {
    const body = { ...req.body, user_id: String(req.user.userId) };
    const response = await axios.post(`${WEALTH_URL}/api/recommend/goal-projection`, body, {
      headers: proxyHeaders(req)
    });
    return res.json(response.data);
  } catch (err) {
    console.error('[Wealth Router] goal-projection failed:', err.message);
    return res.status(err.response?.status || 500).json({
      error: 'Failed to project goal growth',
      detail: err.message
    });
  }
});

// ── MARKET / TRENDING ──
router.get('/trending', verifyToken, async (req, res) => {
  try {
    const response = await axios.get(`${WEALTH_URL}/api/market-context`, {
      headers: proxyHeaders(req)
    });
    return res.json(response.data);
  } catch (err) {
    console.error('[Wealth Router] market/trending failed:', err.message);
    return res.status(err.response?.status || 500).json({
      error: 'Failed to fetch trending market context',
      detail: err.message
    });
  }
});

module.exports = router;
