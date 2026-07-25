const express = require('express');
const axios = require('axios');
const { verifyToken } = require('../middleware/auth');
const { proxyHeaders } = require('../utils/proxy');
const router = express.Router();

const FRAUD_ENGINE = process.env.FRAUD_ENGINE_URL || 'http://localhost:8002';

const { readDb } = require('../utils/db');

// ── ACTION EXECUTE ──
router.post('/execute', verifyToken, async (req, res) => {
  try {
    const db = readDb();
    const user = db.users[req.user.userId];
    let nightLockActive = false;

    if (user && user.night_lock_enabled) {
      const start = user.night_lock_start || "22:00";
      const end = user.night_lock_end || "07:00";
      const now = new Date();
      const current = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const amount = Number(req.body.amount || 0);

      if (amount > 5000) {
        if (start < end) {
          nightLockActive = (current >= start && current <= end);
        } else {
          nightLockActive = (current >= start || current <= end);
        }
      }
    }

    const body = { 
      ...req.body, 
      user_id: String(req.user.userId),
      night_lock_active: nightLockActive,
      registered_carrier: user ? user.registered_carrier : "Jio"
    };

    const response = await axios.post(`${FRAUD_ENGINE}/api/risk/evaluate`, body, {
      headers: proxyHeaders(req)
    });
    return res.json(response.data);
  } catch (err) {
    console.error('[Fraud Router] execute failed:', err.message);
    return res.status(err.response?.status || 500).json({
      error: 'Fraud engine failed',
      detail: err.message
    });
  }
});

// ── RISK VELOCITY ──
router.get('/velocity/:user_id', verifyToken, async (req, res) => {
  try {
    const targetUserId = req.params.user_id;
    const response = await axios.get(`${FRAUD_ENGINE}/api/risk/velocity/${targetUserId}`, {
      headers: proxyHeaders(req)
    });
    return res.json(response.data);
  } catch (err) {
    console.error('[Fraud Router] velocity failed:', err.message);
    return res.status(err.response?.status || 500).json({
      error: 'Failed to fetch risk velocity',
      detail: err.message
    });
  }
});

// ── RISK HISTORY (ALL) ──
router.get('/history/all', verifyToken, async (req, res) => {
  try {
    const response = await axios.get(`${FRAUD_ENGINE}/api/risk/history/all`, {
      headers: proxyHeaders(req)
    });
    return res.json(response.data);
  } catch (err) {
    console.error('[Fraud Router] history all failed:', err.message);
    return res.status(err.response?.status || 500).json({
      error: 'Failed to fetch all risk history',
      detail: err.message
    });
  }
});

// ── RISK HISTORY (USER) ──
router.get('/history/:user_id', verifyToken, async (req, res) => {
  try {
    const targetUserId = req.params.user_id;
    const response = await axios.get(`${FRAUD_ENGINE}/api/risk/history/${targetUserId}`, {
      headers: proxyHeaders(req)
    });
    return res.json(response.data);
  } catch (err) {
    console.error('[Fraud Router] history user failed:', err.message);
    return res.status(err.response?.status || 500).json({
      error: 'Failed to fetch user risk history',
      detail: err.message
    });
  }
});

module.exports = router;
