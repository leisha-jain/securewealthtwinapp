// ─────────────────────────────────────────────────────────────────
// routes/auth.js – Login & device-trust logic
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────────

const express = require('express');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
const { verifyToken } = require('../middleware/auth');
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
const { readDb, writeDb } = require('../utils/db');

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

  const db = readDb();
  const user = db.users[userId];
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Check device trust
  const userDevices = new Set(db.trustedDevices[userId] || []);
  const isTrustedDevice = userDevices.has(deviceId);

  // First login from this device → register it as trusted
  if (!isTrustedDevice) {
    if (!db.trustedDevices[userId]) db.trustedDevices[userId] = [];
    db.trustedDevices[userId].push(deviceId);
    console.log(`[Auth] New device registered for user ${userId}: ${deviceId}`);
  }

  // Generate 6-digit OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  db.otps[userId] = {
    code: otpCode,
    expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
  };
  writeDb(db);

  // Dispatch OTP via Twilio or Console Fallback
  const phone = user.phone || "+919999999999";
  const body = `Your SecureWealth Twin verification code is: ${otpCode}. Valid for 5 minutes.`;
  sendTwilioSms(phone, body);

  const payload = {
    userId: Number(userId),
    name: user.name,
    email: user.email,
    deviceId,
    isTrustedDevice,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  res.json({
    token,
    user: payload,
    isTrustedDevice,
    message: `OTP sent to ${phone}`,
  });
});

/**
 * POST /api/auth/verify-otp
 * Body: { userId, code }
 */
router.post('/verify-otp', (req, res) => {
  const { userId, code } = req.body;
  if (!userId || !code) {
    return res.status(400).json({ error: 'userId and code are required' });
  }

  const db = readDb();
  const otpInfo = db.otps[userId];
  if (!otpInfo) {
    return res.status(400).json({ error: 'No OTP requested for this user' });
  }
  if (Date.now() > otpInfo.expiresAt) {
    return res.status(400).json({ error: 'OTP has expired' });
  }
  if (otpInfo.code !== code) {
    return res.status(400).json({ error: 'Invalid OTP code' });
  }

  // Success: clear OTP
  delete db.otps[userId];
  writeDb(db);

  res.json({ success: true, message: 'Identity verified successfully' });
});

/**
 * Helper to dispatch Twilio SMS
 */
async function sendTwilioSms(to, messageBody) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.log('\n===================================================');
    console.log(`[OTP CONSOLE FALLBACK]`);
    console.log(`To: ${to}`);
    console.log(`Message: ${messageBody}`);
    console.log('===================================================\n');
    return;
  }

  try {
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    await axios.post(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      new URLSearchParams({
        To: to,
        From: fromNumber,
        Body: messageBody,
      }).toString(),
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    console.log(`[Twilio] OTP successfully dispatched to ${to}`);
  } catch (err) {
    console.error('[Twilio Error] Failed to send SMS:', err.response?.data || err.message);
  }
}

/**
 * POST /api/auth/logout
 */
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out. Please discard your token.' });
});

// ── Feature 10: Night Lock (Transaction Lullaby) ─────────────────
router.post('/settings/night-lock', verifyToken, (req, res) => {
  const { enabled, start, end } = req.body;
  const db = readDb();
  const user = db.users[req.user.userId];
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.night_lock_enabled = enabled;
  user.night_lock_start = start;
  user.night_lock_end = end;
  writeDb(db);
  res.json({ success: true, user });
});

// ── Feature 12: Nominee & Grief-Aware Mode ────────────────────────
router.post('/settings/nominee', verifyToken, (req, res) => {
  const { name, phone, relation, isEmergencyHeir } = req.body;
  const db = readDb();
  const user = db.users[req.user.userId];
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.nominee = { name, phone, relation, isEmergencyHeir: !!isEmergencyHeir };
  writeDb(db);
  res.json({ success: true, user });
});

router.post('/settings/emergency-mode', verifyToken, (req, res) => {
  const { isEmergencyHeir } = req.body;
  const db = readDb();
  const user = db.users[req.user.userId];
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (!user.nominee) user.nominee = {};
  user.nominee.isEmergencyHeir = !!isEmergencyHeir;
  writeDb(db);
  res.json({ success: true, user });
});

// ── User Profile getter ───────────────────────────────────────────
router.get('/profile', verifyToken, (req, res) => {
  const db = readDb();
  const user = db.users[req.user.userId];
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

// ── Feature 3: Sleep On It Button ─────────────────────────────────
router.post('/sleep-on-it', verifyToken, (req, res) => {
  const { action } = req.body;
  const db = readDb();
  if (!db.sleepOnIt[req.user.userId]) {
    db.sleepOnIt[req.user.userId] = [];
  }
  db.sleepOnIt[req.user.userId].push({
    ...action,
    timestamp: Date.now()
  });
  writeDb(db);
  res.json({ success: true });
});

router.get('/sleep-on-it', verifyToken, (req, res) => {
  const db = readDb();
  const list = db.sleepOnIt[req.user.userId] || [];
  res.json({ list });
});

// ── Feature 4: Trusted Second Pair of Eyes ───────────────────────
router.post('/ask-trusted', verifyToken, (req, res) => {
  const { amount, action_type, target } = req.body;
  const db = readDb();
  const user = db.users[req.user.userId];
  if (!user || !user.nominee || !user.nominee.phone) {
    return res.status(400).json({ error: 'No trusted nominee registered' });
  }

  // Generate unique approval token
  const token = Math.random().toString(36).substring(2, 15);
  db.pendingApprovals[token] = {
    userId: req.user.userId,
    amount,
    action_type,
    target,
    status: 'pending',
    expiresAt: Date.now() + 5 * 60 * 1000
  };
  writeDb(db);

  const baseUrl = `http://localhost:${process.env.PORT || 8000}/api/auth`;
  const yesLink = `${baseUrl}/approve/${token}`;
  const noLink = `${baseUrl}/reject/${token}`;
  const body = `[Second Pair of Eyes] ${user.name} wants to perform ${action_type} of ₹${Number(amount).toLocaleString()} to ${target || 'target'}. Confirm? YES: ${yesLink} | NO: ${noLink}`;

  sendTwilioSms(user.nominee.phone, body);

  res.json({ success: true, token });
});

router.get('/pending-approvals/:token', (req, res) => {
  const { token } = req.params;
  const db = readDb();
  const txn = db.pendingApprovals[token];
  if (!txn) {
    return res.status(404).json({ error: 'Transaction expired or not found' });
  }
  res.json({ status: txn.status });
});

router.get('/approve/:token', (req, res) => {
  const { token } = req.params;
  const db = readDb();
  const txn = db.pendingApprovals[token];
  if (!txn) {
    return res.status(404).send('<html><body style="font-family:sans-serif; text-align:center; padding: 50px;"><h1>Link Invalid or Expired</h1></body></html>');
  }
  txn.status = 'approved';
  writeDb(db);
  res.send('<html><body style="font-family:sans-serif; text-align:center; padding: 50px; background:#f0fcf4; color:#1e4620;"><h1>✔️ Transaction Approved Successfully!</h1><p>The transaction will proceed now. You can close this window.</p></body></html>');
});

router.get('/reject/:token', (req, res) => {
  const { token } = req.params;
  const db = readDb();
  const txn = db.pendingApprovals[token];
  if (!txn) {
    return res.status(404).send('<html><body style="font-family:sans-serif; text-align:center; padding: 50px;"><h1>Link Invalid or Expired</h1></body></html>');
  }
  txn.status = 'rejected';
  writeDb(db);
  res.send('<html><body style="font-family:sans-serif; text-align:center; padding: 50px; background:#fdf2f2; color:#7a2020;"><h1>❌ Transaction Blocked!</h1><p>You have successfully blocked this transaction for security. You can close this window.</p></body></html>');
});

module.exports = router;
