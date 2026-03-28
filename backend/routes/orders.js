const router = require('express').Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', (req, res) => {
  const orders = db.prepare(`
    SELECT o.*, GROUP_CONCAT(oi.product_name || ' x' || oi.quantity, ', ') as summary
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id
    WHERE o.user_id = ?
    GROUP BY o.id
    ORDER BY o.created_at DESC
  `).all(req.user.id);
  res.json(orders);
});

router.get('/:id', (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  res.json({ ...order, items });
});

router.post('/', (req, res) => {
  const { shippingAddress, payment_method = 'cash', payment_id = null } = req.body;
  if (!shippingAddress) return res.status(400).json({ error: 'Shipping address required' });

  const cartItems = db.prepare(`
    SELECT ci.quantity, p.id as product_id, p.name, p.price, i.quantity as stock
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    LEFT JOIN inventory i ON i.product_id = p.id
    WHERE ci.user_id = ?
  `).all(req.user.id);

  if (!cartItems.length) return res.status(400).json({ error: 'Cart is empty' });

  for (const item of cartItems) {
    if (item.stock < item.quantity)
      return res.status(400).json({ error: `Insufficient stock for ${item.name}` });
  }

  const total = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;

  const place = db.transaction(() => {
    const paymentStatus = payment_method === 'cash' ? 'pending' : 'paid';
    const { lastInsertRowid: orderId } = db.prepare(
      'INSERT INTO orders (user_id, order_number, total_amount, shipping_address, payment_method, payment_id, payment_status) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(req.user.id, orderNumber, total, JSON.stringify(shippingAddress), payment_method, payment_id, paymentStatus);

    const insItem = db.prepare(
      'INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price) VALUES (?, ?, ?, ?, ?)'
    );
    const deduct = db.prepare('UPDATE inventory SET quantity = quantity - ? WHERE product_id = ?');

    for (const item of cartItems) {
      insItem.run(orderId, item.product_id, item.name, item.quantity, item.price);
      deduct.run(item.quantity, item.product_id);
    }

    db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user.id);
    return orderId;
  });

  const orderId = place();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);
  res.status(201).json({ ...order, items });
});

module.exports = router;
