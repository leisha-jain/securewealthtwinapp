// ─────────────────────────────────────────────────────────────────
// routes/auth.js – Login & device-trust logic
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────────

const express = require('express');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { error: 'Too many attempts. Please try again in 15 minutes.' },
  handler: (req, res, next, options) => {
    console.warn(`[Rate Limit Exceeded] IP: ${req.ip} tried to access login endpoint ${req.originalUrl}`);
    res.status(429).json(options.message);
  }
});

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
const JWT_EXPIRES_IN = '24h';

// In-memory store of trusted devices per user.
// In production, persist this in a DB alongside the User record.
const trustedDevices = {
  // userId → Set of trusted deviceIds
  1: new Set(['device-arjun-phone']),
  2: new Set(['device-priya-laptop']),
  3: new Set(['device-ravi-phone']),
  4: new Set(['device-fatima-tablet']),
};

/**
 * POST /api/auth/login
 * Body: { userId, password, deviceId }
 *
 * Returns a JWT token.
 * If the device is not in the user's trusted set, isTrustedDevice=false
 * is embedded in the token payload → Fraud Engine adds +20 risk points.
 */
router.post('/login', loginLimiter, (req, res) => {
  const { userId, password, deviceId } = req.body;

  if (!userId || !password || !deviceId) {
    return res.status(400).json({ error: 'userId, password, and deviceId are required' });
  }

  // ── STUB: accept any password for demo; replace with real DB check ──
  // In production: verify hashed password against DB.
  const DEMO_USERS = {
    1: { name: 'Arjun Mehta', email: 'arjun.mehta@demo.com', password: '1234' },
    2: { name: 'Priya Sharma', email: 'priya.sharma@demo.com', password: '1234' },
    3: { name: 'Ravi Kumar', email: 'ravi.kumar@demo.com', password: '1234' },
    4: { name: 'Fatima Sheikh', email: 'fatima.sheikh@demo.com', password: '1234' },
  };
  
  const user = DEMO_USERS[userId];
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Check device trust
  const userDevices = trustedDevices[userId] || new Set();
  const isTrustedDevice = userDevices.has(deviceId);

  // First login from this device → register it as trusted
  if (!isTrustedDevice) {
    if (!trustedDevices[userId]) trustedDevices[userId] = new Set();
    trustedDevices[userId].add(deviceId);
    console.log(`[Auth] New device registered for user ${userId}: ${deviceId}`);
  }

  const payload = {
    userId: Number(userId),
    name: user.name,
    email: user.email,
    deviceId,
    isTrustedDevice,   // ← picked up by Fraud Engine
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  res.json({
    token,
    user: payload,
    isTrustedDevice,
    message: isTrustedDevice
      ? 'Login successful (trusted device)'
      : 'Login successful (new device — isTrustedDevice=false, fraud score +20)',
  });
});

/**
 * POST /api/auth/logout
 * Stateless JWT — just tell the client to drop the token.
 */
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out. Please discard your token.' });
});

module.exports = router;
