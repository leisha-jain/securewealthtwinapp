// ─────────────────────────────────────────────────────────────────
// routes/chat.js – Proxy to Chat Service (AUTH DISABLED FOR TESTING)
// ─────────────────────────────────────────────────────────────────

const express = require('express');
const axios = require('axios');
const { verifyToken } = require('../middleware/auth');
const { proxyHeaders } = require('../utils/proxy');
const router = express.Router();

const CHAT_URL = process.env.CHAT_SERVICE_URL || 'http://localhost:8003';

// ✅ CHAT MESSAGE
router.post('/message', verifyToken, async (req, res) => {
  const { userId, message, history } = req.body;

  if (!userId || !message) {
    return res.status(400).json({ error: 'userId and message are required' });
  }

  try {
    const response = await axios.post(
      `${CHAT_URL}/api/chat`,
      {
        message,
        profile: {
          income: 100000,
          savings: 20000,
          expenses: {
            rent: 30000,
            food: 10000,
            utilities: 5000
          },
          goals: ["Buy a house"]
        }
      },
      { 
        headers: proxyHeaders(req),
        timeout: 15000 
      }
    );

    // ✅ FIX: handle both response formats safely
    const reply =
      response.data.response ||
      response.data.reply ||
      "No response from AI";

    const reasoning =
      response.data.reasoning ||
      "Generated based on income, savings rate, and expense distribution.";

    return res.json({
      reply,
      reasoning
    });

  } catch (err) {
    console.warn('[Chat] Chat Service unreachable — returning stub');

    return res.json({
      reply: "I'm your SecureWealth AI advisor. Ask me about investments, savings, or fraud detection.",
      reasoning: 'Stub response (chat service offline)',
      _stub: true,
    });
  }
});

module.exports = router;