require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const db = require('./db');

const app = express();

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false, // API-only server; CSP handled on frontend
}));

// ── CORS ──────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGIN = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(cors({
  origin: ALLOWED_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Raw body parser for Stripe webhooks (must come before express.json) ───────
app.use('/api/payments/stripe/webhook', express.raw({ type: 'application/json' }));

// ── Body parser ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' })); // limit payload size

// ── Rate limiters ─────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: 'Too many attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const paymentLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 30,
  message: { error: 'Too many payment requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const orderLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 40,
  message: { error: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',     authLimiter,    require('./routes/auth'));
app.use('/api/products',                 require('./routes/products'));
app.use('/api/cart',                     require('./routes/cart'));
app.use('/api/orders',   orderLimiter,   require('./routes/orders'));
app.use('/api/admin',                    require('./routes/admin'));
app.use('/api/payments', paymentLimiter, require('./routes/payments'));
app.use('/api/delivery',                 require('./routes/delivery'));

// Categories shortcut
app.get('/api/categories', (req, res) => {
  res.json(db.prepare('SELECT * FROM categories ORDER BY sort_order').all());
});

// ── Global error handler (never leak stack traces) ────────────────────────────
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(3001, () => console.log('Desi Mart API → http://localhost:3001'));
