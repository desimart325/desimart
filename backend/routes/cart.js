const router = require('express').Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

const getCart = (userId) =>
  db.prepare(`
    SELECT ci.id, ci.quantity, p.id as product_id, p.name, p.slug, p.price, p.unit, p.image_url,
           i.quantity as stock
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    LEFT JOIN inventory i ON i.product_id = p.id
    WHERE ci.user_id = ?
  `).all(userId);

router.get('/', (req, res) => {
  res.json(getCart(req.user.id));
});

router.post('/items', (req, res) => {
  const { productId, quantity = 1 } = req.body;
  const product = db.prepare('SELECT id FROM products WHERE id = ?').get(productId);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  db.prepare(`
    INSERT INTO cart_items (user_id, product_id, quantity)
    VALUES (?, ?, ?)
    ON CONFLICT(user_id, product_id) DO UPDATE SET quantity = quantity + excluded.quantity
  `).run(req.user.id, productId, quantity);

  res.json(getCart(req.user.id));
});

router.put('/items/:id', (req, res) => {
  const { quantity } = req.body;
  if (quantity < 1) {
    db.prepare('DELETE FROM cart_items WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  } else {
    db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?').run(quantity, req.params.id, req.user.id);
  }
  res.json(getCart(req.user.id));
});

router.delete('/items/:id', (req, res) => {
  db.prepare('DELETE FROM cart_items WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json(getCart(req.user.id));
});

router.delete('/', (req, res) => {
  db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user.id);
  res.json([]);
});

module.exports = router;
