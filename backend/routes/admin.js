const router = require('express').Router();
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');

router.use(requireAdmin);

// Dashboard stats
router.get('/stats', (req, res) => {
  const totalOrders = db.prepare('SELECT COUNT(*) as c FROM orders').get().c;
  const totalRevenue = db.prepare("SELECT SUM(total_amount) as s FROM orders WHERE status != 'CANCELLED'").get().s || 0;
  const totalProducts = db.prepare('SELECT COUNT(*) as c FROM products WHERE is_active = 1').get().c;
  const totalUsers = db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'CUSTOMER'").get().c;
  const recentOrders = db.prepare(`
    SELECT o.*, u.email, u.first_name, u.last_name
    FROM orders o JOIN users u ON u.id = o.user_id
    ORDER BY o.created_at DESC LIMIT 5
  `).all();
  res.json({ totalOrders, totalRevenue, totalProducts, totalUsers, recentOrders });
});

// Orders
router.get('/orders', (req, res) => {
  const { status, payment_status } = req.query;
  let sql = `
    SELECT o.*, u.email, u.first_name, u.last_name,
           GROUP_CONCAT(oi.product_name || ' x' || oi.quantity, ', ') as summary
    FROM orders o
    JOIN users u ON u.id = o.user_id
    LEFT JOIN order_items oi ON oi.order_id = o.id
    WHERE 1=1
  `;
  const params = [];
  if (status) { sql += ' AND o.status = ?'; params.push(status); }
  if (payment_status) { sql += ' AND o.payment_status = ?'; params.push(payment_status); }
  sql += ' GROUP BY o.id ORDER BY o.created_at DESC';
  res.json(db.prepare(sql).all(...params));
});

router.get('/orders/:id', (req, res) => {
  const order = db.prepare(`
    SELECT o.*, u.email, u.first_name, u.last_name, u.phone as customer_phone
    FROM orders o JOIN users u ON u.id = o.user_id WHERE o.id = ?
  `).get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  res.json({ ...order, items });
});

router.put('/orders/:id/status', (req, res) => {
  const { status } = req.body;
  const valid = ['PENDING','CONFIRMED','PROCESSING','SHIPPED','DELIVERED','CANCELLED'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ success: true });
});

router.put('/orders/:id/payment-status', (req, res) => {
  const { payment_status } = req.body;
  const valid = ['pending', 'paid', 'failed', 'refunded'];
  if (!valid.includes(payment_status)) return res.status(400).json({ error: 'Invalid payment status' });
  db.prepare('UPDATE orders SET payment_status = ? WHERE id = ?').run(payment_status, req.params.id);
  res.json({ success: true });
});

// Products
router.get('/products', (req, res) => {
  const products = db.prepare(`
    SELECT p.*, i.quantity as stock FROM products p
    LEFT JOIN inventory i ON i.product_id = p.id
    ORDER BY p.name
  `).all();
  res.json(products);
});

router.post('/products', (req, res) => {
  const { sku, name, slug, description, category_slug, unit, price, is_featured } = req.body;
  const r = db.prepare(`
    INSERT INTO products (sku, name, slug, description, category_slug, unit, price, is_featured)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(sku, name, slug, description, category_slug, unit, price, is_featured ? 1 : 0);
  db.prepare('INSERT INTO inventory (product_id, quantity) VALUES (?, 0)').run(r.lastInsertRowid);
  res.status(201).json({ id: r.lastInsertRowid });
});

router.put('/products/:id', (req, res) => {
  const { name, slug, description, category_slug, unit, price, is_active, is_featured } = req.body;
  db.prepare(`
    UPDATE products SET name=?, slug=?, description=?, category_slug=?, unit=?, price=?,
    is_active=?, is_featured=? WHERE id=?
  `).run(name, slug, description, category_slug, unit, price, is_active ? 1 : 0, is_featured ? 1 : 0, req.params.id);
  res.json({ success: true });
});

// Inventory
router.get('/inventory', (req, res) => {
  const rows = db.prepare(`
    SELECT p.id, p.sku, p.name, p.category_slug, i.quantity
    FROM products p LEFT JOIN inventory i ON i.product_id = p.id
    WHERE p.is_active = 1 ORDER BY i.quantity ASC
  `).all();
  res.json(rows);
});

router.put('/inventory/:productId', (req, res) => {
  const { quantity } = req.body;
  db.prepare('UPDATE inventory SET quantity = ? WHERE product_id = ?').run(quantity, req.params.productId);
  res.json({ success: true });
});

module.exports = router;
