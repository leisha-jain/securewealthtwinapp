const express = require('express');
const axios = require('axios');
const { verifyToken } = require('../middleware/auth');
const { proxyHeaders } = require('../utils/proxy');
const router = express.Router();

const FRAUD_ENGINE = process.env.FRAUD_ENGINE_URL || 'http://localhost:8002';

// ── ACTION EXECUTE ──
router.post('/execute', verifyToken, async (req, res) => {
  try {
    const body = { ...req.body, user_id: String(req.user.userId) };
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

module.exports = router;
