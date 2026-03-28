const router = require('express').Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const STRIPE_SECRET        = process.env.STRIPE_SECRET_KEY        || '';
const STRIPE_PUB           = process.env.STRIPE_PUBLISHABLE_KEY   || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET   || '';
const PAYPAL_CLIENT        = process.env.PAYPAL_CLIENT_ID         || '';
const PAYPAL_SECRET        = process.env.PAYPAL_CLIENT_SECRET     || '';
const PAYPAL_BASE          = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';
const ZELLE_CONTACT        = process.env.ZELLE_CONTACT            || '';

const stripeConfigured  = STRIPE_SECRET  && !STRIPE_SECRET.includes('REPLACE');
const paypalConfigured  = PAYPAL_CLIENT  && !PAYPAL_CLIENT.includes('REPLACE');

// Lazy-load stripe only when configured
let stripe = null;
if (stripeConfigured) {
  try { stripe = require('stripe')(STRIPE_SECRET); } catch(e) {}
}

// ── Config endpoint (tells frontend which methods are live) ───────────────────
router.get('/config', (req, res) => {
  res.json({
    stripe:          stripeConfigured,
    paypal:          paypalConfigured,
    cash:            true,
    zelle:           true,
    stripePublishableKey: stripeConfigured ? STRIPE_PUB : '',
    paypalClientId:       paypalConfigured ? PAYPAL_CLIENT : '',
    zelleContact:         ZELLE_CONTACT,
  });
});

// ── Stripe: create payment intent ─────────────────────────────────────────────
router.post('/stripe/intent', requireAuth, async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Stripe is not configured yet.' });

  const cartItems = db.prepare(`
    SELECT ci.quantity, p.price FROM cart_items ci
    JOIN products p ON p.id = ci.product_id WHERE ci.user_id = ?
  `).all(req.user.id);

  if (!cartItems.length) return res.status(400).json({ error: 'Cart is empty' });

  const amountCents = Math.round(
    cartItems.reduce((s, i) => s + i.price * i.quantity, 0) * 100
  );

  try {
    const intent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      metadata: { userId: String(req.user.id) },
    });
    res.json({ clientSecret: intent.client_secret, intentId: intent.id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Stripe: verify intent (called after confirmCardPayment succeeds) ───────────
router.post('/stripe/verify/:intentId', requireAuth, async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Stripe is not configured yet.' });
  try {
    const intent = await stripe.paymentIntents.retrieve(req.params.intentId);
    if (intent.status !== 'succeeded') {
      return res.status(400).json({ error: `Payment status: ${intent.status}` });
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── PayPal helpers ─────────────────────────────────────────────────────────────
async function paypalAccessToken() {
  const creds = Buffer.from(`${PAYPAL_CLIENT}:${PAYPAL_SECRET}`).toString('base64');
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('PayPal auth failed');
  return data.access_token;
}

// ── PayPal: create order ───────────────────────────────────────────────────────
router.post('/paypal/create-order', requireAuth, async (req, res) => {
  if (!paypalConfigured) return res.status(503).json({ error: 'PayPal is not configured yet.' });

  const cartItems = db.prepare(`
    SELECT ci.quantity, p.price FROM cart_items ci
    JOIN products p ON p.id = ci.product_id WHERE ci.user_id = ?
  `).all(req.user.id);

  if (!cartItems.length) return res.status(400).json({ error: 'Cart is empty' });

  const total = cartItems.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2);

  try {
    const token = await paypalAccessToken();
    const response = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{ amount: { currency_code: 'USD', value: total }, description: 'Desi Mart Order' }],
      }),
    });
    const order = await response.json();
    if (!order.id) throw new Error(order.message || 'PayPal order creation failed');
    res.json({ id: order.id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── PayPal: capture payment ────────────────────────────────────────────────────
router.post('/paypal/capture/:paypalOrderId', requireAuth, async (req, res) => {
  if (!paypalConfigured) return res.status(503).json({ error: 'PayPal is not configured yet.' });

  try {
    const token = await paypalAccessToken();
    const response = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${req.params.paypalOrderId}/capture`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    const capture = await response.json();
    if (capture.status !== 'COMPLETED') {
      return res.status(400).json({ error: `PayPal capture status: ${capture.status}` });
    }
    res.json({ ok: true, captureId: capture.purchase_units?.[0]?.payments?.captures?.[0]?.id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Stripe webhook (raw body verified with signing secret) ────────────────────
router.post('/stripe/webhook', (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Stripe not configured' });
  if (!STRIPE_WEBHOOK_SECRET) {
    console.warn('STRIPE_WEBHOOK_SECRET not set — skipping signature verification');
    return res.json({ received: true });
  }

  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    console.error('Webhook signature verification failed:', e.message);
    return res.status(400).json({ error: `Webhook error: ${e.message}` });
  }

  // Handle relevant events
  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object;
    db.prepare(
      "UPDATE orders SET payment_status = 'paid' WHERE payment_id = ? AND payment_status != 'paid'"
    ).run(intent.id);
  }

  if (event.type === 'payment_intent.payment_failed') {
    const intent = event.data.object;
    db.prepare(
      "UPDATE orders SET payment_status = 'failed' WHERE payment_id = ? AND payment_status = 'pending'"
    ).run(intent.id);
  }

  res.json({ received: true });
});

module.exports = router;
