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

module.exports = router;
