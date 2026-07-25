// ─────────────────────────────────────────────────────────────────
// routes/chat.js – Proxy to Chat Service (AUTH DISABLED FOR TESTING)
// ─────────────────────────────────────────────────────────────────

const express = require('express');
const axios = require('axios');
const { verifyToken } = require('../middleware/auth');
const { proxyHeaders } = require('../utils/proxy');
const router = express.Router();

const CHAT_URL = process.env.CHAT_SERVICE_URL || 'http://localhost:8003';

const { readDb } = require('../utils/db');
const fs = require('fs');
const path = require('path');

// ✅ CHAT MESSAGE
router.post('/message', verifyToken, async (req, res) => {
  const { userId, message, history, language, sessionUpdates, userAdditions } = req.body;

  if (!userId || !message) {
    return res.status(400).json({ error: 'userId and message are required' });
  }

  // Load user persona dynamically
  let profileData = {
    income: 80000,
    savings: 20000,
    expenses: {},
    goals: []
  };

  try {
    const db = readDb();
    const user = db.users[userId];
    if (user && user.persona) {
      const personaPath = path.resolve(__dirname, `../../../data/personas/${user.persona}.json`);
      if (fs.existsSync(personaPath)) {
        const personaJson = JSON.parse(fs.readFileSync(personaPath, 'utf-8'));
        const fp = personaJson.financial_profile || {};
        const expenses = {};
        
        // Handle expenses array or spending_categories object from persona json
        if (personaJson.spending_categories && typeof personaJson.spending_categories === 'object') {
          Object.entries(personaJson.spending_categories).forEach(([cat, amt]) => {
            expenses[cat] = Number(amt);
          });
        } else if (personaJson.expenses && Array.isArray(personaJson.expenses)) {
          personaJson.expenses.forEach(exp => {
            if (exp.category && exp.amount) {
              expenses[exp.category] = Number(exp.amount);
            }
          });
        }
        
        // Fallback to monthly expenses if categories are not present
        if (Object.keys(expenses).length === 0 && fp.monthly_expenses) {
          expenses.general = fp.monthly_expenses;
        }

        const goals = (personaJson.goals || []).map(g => g.name || g.title || g.description);

        profileData = {
          income: fp.monthly_income || user.monthly_income || 80000,
          savings: Math.round((fp.monthly_income || user.monthly_income || 80000) * (user.savings_rate || 0.2)),
          expenses: expenses,
          goals: goals,
          sessionUpdates: sessionUpdates || {},
          userAdditions: userAdditions || {},
          ...sessionUpdates,
          ...userAdditions
        };
      }
    }
  } catch (err) {
    console.error('[Chat Gateway] Error loading dynamic user profile:', err.message);
  }

  try {
    const response = await axios.post(
      `${CHAT_URL}/api/chat`,
      {
        message,
        history: history || [],
        language,
        profile: profileData,
        user_profile: profileData,
        sessionUpdates: sessionUpdates || {},
        userAdditions: userAdditions || {}
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

// ✅ EXPLAIN RISK INTERCEPT
router.post('/explain', verifyToken, async (req, res) => {
  const { recommended_action, top_drivers, user_profile } = req.body;
  try {
    const response = await axios.post(
      `${CHAT_URL}/api/explain`,
      {
        recommended_action,
        top_drivers: top_drivers || [],
        user_profile: user_profile || {
          income: 100000,
          savings: 20000,
          expenses: { rent: 30000, food: 10000 },
          goals: []
        }
      },
      { 
        headers: proxyHeaders(req),
        timeout: 15000 
      }
    );
    return res.json(response.data);
  } catch (err) {
    console.error('[Chat] Explain failed:', err.message);
    return res.json({
      short_reason: "Action blocked by automated risk guardrails.",
      full_explanation: "This action was flagged due to abnormal behaviour patterns (such as potential fast click sequence or unfamiliar device) to protect your funds."
    });
  }
});

module.exports = router;