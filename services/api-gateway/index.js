// ─────────────────────────────────────────────────────────────────
// SecureWealth Twin – API Gateway
// Entry point: all frontend requests flow through here.
// ─────────────────────────────────────────────────────────────────

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const express = require('express');
const cors = require('cors');
const authRouter = require('./routes/auth');
const userRouter = require('./routes/user');
const actionRouter = require('./routes/action');
const chatRouter = require('./routes/chat');

const app = express();
const PORT = process.env.PORT || 8000;

// ── Middleware ────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Health Check ──────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'api-gateway', timestamp: new Date().toISOString() });
});

// ── Routes ────────────────────────────────────────────────────────
app.use('/api/auth',   authRouter);
app.use('/api/user',   userRouter);
app.use('/api/action', actionRouter);
app.use('/api/chat',   chatRouter);

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
  console.log(`   Wealth Engine → ${process.env.WEALTH_ENGINE_URL}`);
  console.log(`   Fraud Engine  → ${process.env.FRAUD_ENGINE_URL}`);
  console.log(`   Chat Service  → ${process.env.CHAT_SERVICE_URL}`);
});
