// ─────────────────────────────────────────────────────────────────
// SecureWealth Twin – API Gateway
// Entry point: all frontend requests flow through here.
// ─────────────────────────────────────────────────────────────────

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const rateLimit = require('express-rate-limit');

const { verifyToken } = require('./middleware/auth');

// Routers
const authRouter = require('./routes/auth');
const wealthRouter = require('./routes/wealth');
const fraudRouter = require('./routes/fraud');
const chatRouter = require('./routes/chat');

const app = express();
const PORT = process.env.PORT || 8000;

// ── Middleware ────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── General Rate Limiter ──────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: { error: 'Too many attempts. Please try again in 15 minutes.' },
  handler: (req, res, next, options) => {
    console.warn(`[Rate Limit Exceeded] IP: ${req.ip} tried to access endpoint ${req.originalUrl}`);
    res.status(429).json(options.message);
  }
});
app.use(generalLimiter);

// ── Daily Request Logging Middleware ──────────────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const timestamp = new Date().toISOString();
    const userId = req.user?.userId || req.user?.user_id || 'anon';
    const method = req.method;
    const pathName = req.path;
    const status = res.statusCode;
    const responseTime = Date.now() - start;

    const logObj = {
      ts: timestamp,
      timestamp,
      user: userId,
      user_id: userId,
      method,
      path: pathName,
      status,
      ms: responseTime,
      response_time_ms: responseTime
    };

    const logLine = JSON.stringify(logObj) + '\n';
    const dateStr = new Date().toISOString().split('T')[0];
    const logDir = path.join(__dirname, 'logs');
    
    try {
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      const logFilePath = path.join(logDir, `api-${dateStr}.log`);
      fs.appendFileSync(logFilePath, logLine);
    } catch (err) {
      console.error('[Logging Error] Failed to write API log:', err.message);
    }
  });
  next();
});

// ── Health Check (Gateway itself) ─────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'api-gateway', timestamp: new Date().toISOString() });
});

// ── Health Check Dashboard Aggregator ─────────────────────────────
app.get('/api/health/all', async (req, res) => {
  // Disable caching to prevent 304 responses, guaranteeing CORS headers are always parsed
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');

  const check = async (url) => {
    if (!url) return 'DOWN';
    try {
      await axios.get(`${url}/health`, { timeout: 2000 });
      return 'ok';
    } catch (err) {
      return 'DOWN';
    }
  };

  const wealthUrl = process.env.WEALTH_ENGINE_URL || 'http://localhost:8001';
  const fraudUrl = process.env.FRAUD_ENGINE_URL || 'http://localhost:8002';
  const chatUrl = process.env.CHAT_SERVICE_URL || 'http://localhost:8003';
  const aggregatorUrl = process.env.AGGREGATOR_URL || 'http://localhost:8004';

  const results = {
    wealth_engine: await check(wealthUrl),
    fraud_engine: await check(fraudUrl),
    chat_service: await check(chatUrl),
    aggregator: await check(aggregatorUrl),
    gateway: 'ok'
  };

  const isAnyDown = Object.values(results).includes('DOWN');
  if (isAnyDown) {
    res.status(503).json(results);
  } else {
    res.json(results);
  }
});

// ── GET /api/admin/logs (Protected Audit endpoint) ───────────────
app.get('/api/admin/logs', verifyToken, (req, res) => {
  const isAdmin = req.user && (req.user.role === 'admin' || req.user.isAdmin === true);
  if (!isAdmin) {
    return res.status(403).json({ error: 'Access denied: Admin role required' });
  }

  try {
    const logDir = path.join(__dirname, 'logs');
    if (!fs.existsSync(logDir)) {
      return res.json([]);
    }
    const files = fs.readdirSync(logDir);
    let allLogs = [];
    for (const file of files) {
      if (file.startsWith('api-') && file.endsWith('.log')) {
        const filePath = path.join(logDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        for (const line of lines) {
          if (line.trim()) {
            try {
              allLogs.push(JSON.parse(line));
            } catch (err) {
              // ignore malformed lines
            }
          }
        }
      }
    }
    // Sort logs by timestamp ascending
    allLogs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    res.json(allLogs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve logs', detail: err.message });
  }
});

// Honeypot decoy endpoint proxy (Zero Trust attacker traps)
app.all('/api/admin/users', async (req, res) => {
  try {
    const fraudUrl = process.env.FRAUD_ENGINE_URL || 'http://localhost:8002';
    const response = await axios({
      method: req.method,
      url: `${fraudUrl}/api/admin/users`,
      headers: {
        'X-Internal-Token': process.env.INTERNAL_SECRET || 'swt-2026',
        'Content-Type': 'application/json'
      },
      data: req.body,
      validateStatus: () => true
    });
    return res.status(response.status).json(response.data);
  } catch (err) {
    return res.status(500).json({ error: 'Gateway honeypot proxy failed', detail: err.message });
  }
});

// ── Routes ────────────────────────────────────────────────────────
app.use('/api/auth',      authRouter);
app.use('/api/user',      wealthRouter);
app.use('/api/recommend', wealthRouter);
app.use('/api/market',    wealthRouter);
app.use('/api/action',    fraudRouter);
app.use('/api/risk',      fraudRouter);
app.use('/api/chat',      chatRouter);

// ── 404 Handler ───────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.originalUrl });
});

// ── Global Error Handler ──────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Gateway Error]', err.message);
  res.status(500).json({ error: 'Internal gateway error', detail: err.message });
});

// ── Start ─────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🛡️  API Gateway running on http://localhost:${PORT}`);
  console.log(`   Wealth Engine → ${process.env.WEALTH_ENGINE_URL || 'http://localhost:8001'}`);
  console.log(`   Fraud Engine  → ${process.env.FRAUD_ENGINE_URL || 'http://localhost:8002'}`);
  console.log(`   Chat Service  → ${process.env.CHAT_SERVICE_URL || 'http://localhost:8003'}`);
  console.log(`   Aggregator    → ${process.env.AGGREGATOR_URL || 'http://localhost:8004'}`);
});
