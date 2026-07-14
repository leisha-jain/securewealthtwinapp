const express = require('express');
const axios = require('axios');
const { verifyToken } = require('../middleware/auth');
const { proxyHeaders } = require('../utils/proxy');
const router = express.Router();

const WEALTH_URL = process.env.WEALTH_ENGINE_URL || 'http://localhost:8001';

// ── Load Persistent DB utilities ──
const { readDb, writeDb, updatePersonaFile } = require('../utils/db');

// ── USER / PROFILE ──
router.get('/:id/profile', verifyToken, async (req, res) => {
  const userId = Number(req.params.id);
  const db = readDb();
  const user = db.users[userId];
  if (!user) return res.status(404).json({ error: 'User not found' });

  try {
    const response = await axios.get(`${WEALTH_URL}/users/${userId}`, {
      headers: proxyHeaders(req),
      timeout: 3000
    });
    return res.json(response.data);
  } catch (err) {
    console.warn(`[User] Wealth Engine unreachable — returning DB info for user ${userId}`);
    return res.json({ ...user, _stub: false });
  }
});

// ── DASHBOARD ──
router.get('/:id/dashboard', verifyToken, async (req, res) => {
  const userId = Number(req.params.id);
  const db = readDb();
  const user = db.users[userId];
  if (!user) return res.status(404).json({ error: 'User not found' });

  try {
    const response = await axios.get(`${WEALTH_URL}/dashboard/${userId}`, {
      headers: proxyHeaders(req),
      timeout: 3000
    });
    return res.json(response.data);
  } catch (err) {
    console.warn(`[User] Wealth Engine unreachable — returning consolidated dashboard`);
    
    let netWorth = 1250000;
    let totalAssets = 1850000;
    let totalExpense = 93600;
    let savingsRate = user.savings_rate * 100 || 22;

    if (user.persona) {
      try {
        const fs = require('fs');
        const path = require('path');
        const personaPath = path.resolve(__dirname, '../../../../data/personas', `${user.persona}.json`);
        if (fs.existsSync(personaPath)) {
          const pData = JSON.parse(fs.readFileSync(personaPath, 'utf-8'));
          netWorth = pData.financial_profile?.net_worth || netWorth;
          totalAssets = pData.financial_profile?.total_assets || totalAssets;
          totalExpense = pData.financial_profile?.total_expenses || totalExpense;
        }
      } catch (e) {
        console.warn('[Dashboard Helper] Failed to read persona file:', e.message);
      }
    }

    return res.json({
      user: user,
      net_worth: netWorth,
      total_assets: totalAssets,
      spending_summary: {
        monthly_income: user.monthly_income,
        total_expense: totalExpense,
        savings_rate: savingsRate,
      },
      goals: db.goals[userId] || []
    });
  }
});

// ── ASSETS ──
router.get('/:id/assets', verifyToken, async (req, res) => {
  const userId = Number(req.params.id);
  const db = readDb();
  const user = db.users[userId];

  try {
    const response = await axios.get(`${WEALTH_URL}/assets/`, {
      params: { user_id: userId },
      headers: proxyHeaders(req),
      timeout: 3000
    });
    return res.json(response.data);
  } catch (err) {
    console.warn(`[User] Wealth Engine unreachable — returning persona assets`);
    
    let assets = [
      { id: 1, name: 'Index Fund SIP', asset_type: 'MUTUAL_FUND', current_value: 450000 },
      { id: 2, name: 'Fixed Deposit', asset_type: 'FD', current_value: 200000 },
      { id: 3, name: 'Equity Portfolio', asset_type: 'STOCKS', current_value: 380000 },
    ];

    if (user && user.persona) {
      try {
        const fs = require('fs');
        const path = require('path');
        const personaPath = path.resolve(__dirname, '../../../../data/personas', `${user.persona}.json`);
        if (fs.existsSync(personaPath)) {
          const pData = JSON.parse(fs.readFileSync(personaPath, 'utf-8'));
          if (pData.portfolio) {
            assets = [];
            let idCounter = 1;
            if (pData.portfolio.equity) {
              pData.portfolio.equity.forEach(e => {
                assets.push({ id: idCounter++, name: e.ticker || e.name, asset_type: 'STOCKS', current_value: e.value });
              });
            }
            if (pData.portfolio.mutual_funds) {
              pData.portfolio.mutual_funds.forEach(m => {
                assets.push({ id: idCounter++, name: m.name, asset_type: 'MUTUAL_FUND', current_value: m.current_value });
              });
            }
            if (pData.portfolio.gold) {
              pData.portfolio.gold.forEach(g => {
                assets.push({ id: idCounter++, name: 'Physical Gold', asset_type: 'GOLD', current_value: g.value });
              });
            }
          }
        }
      } catch (e) {
        console.warn('[Assets Helper] Failed to read persona file:', e.message);
      }
    }
    return res.json(assets);
  }
});

// ── GOALS ──
router.get('/:id/goals', verifyToken, (req, res) => {
  const userId = Number(req.params.id);
  const db = readDb();
  return res.json(db.goals[userId] || []);
});

router.post('/:id/goals', verifyToken, (req, res) => {
  const userId = Number(req.params.id);
  const { title, targetAmount, deadline } = req.body;
  if (!title || !targetAmount) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  const db = readDb();
  const newGoal = {
    id: Date.now(),
    title,
    targetAmount: Number(targetAmount),
    deadline,
    progress: 0
  };
  if (!db.goals[userId]) db.goals[userId] = [];
  db.goals[userId].push(newGoal);
  writeDb(db);

  const user = db.users[userId];
  if (user && user.persona) {
    updatePersonaFile(user.persona, 'goals', db.goals[userId]);
  }

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
