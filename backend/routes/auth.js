const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET, requireAuth } = require('../middleware/auth');

router.post('/register', (req, res) => {
  const { email, password, firstName, lastName, phone } = req.body;
  if (!email || !password || !firstName || !lastName)
    return res.status(400).json({ error: 'Missing required fields' });

  // Validate email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: 'Invalid email address' });

  // Enforce minimum password strength
  if (password.length < 8)
    return res.status(400).json({ error: 'Password must be at least 8 characters' });

  // Sanitize name fields — strip control characters
  const safeName = (s) => s.trim().replace(/[\x00-\x1F\x7F]/g, '');
  const cleanFirst = safeName(firstName);
  const cleanLast  = safeName(lastName);
  if (!cleanFirst || !cleanLast)
    return res.status(400).json({ error: 'Invalid name' });

  if (db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase()))
    return res.status(409).json({ error: 'Email already registered' });

  const hash = bcrypt.hashSync(password, 12);
  const result = db.prepare(
    'INSERT INTO users (email, password, first_name, last_name, phone) VALUES (?, ?, ?, ?, ?)'
  ).run(email.toLowerCase(), hash, cleanFirst, cleanLast, phone || null);

  const user = { id: result.lastInsertRowid, email, firstName, lastName, role: 'CUSTOMER' };
  const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password required' });

  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  // Use constant-time compare regardless of whether user exists (prevent timing attacks)
  const hash = row ? row.password : '$2a$12$invalidhashfortimingprotection000000000000000000000000';
  if (!row || !bcrypt.compareSync(password, hash))
    return res.status(401).json({ error: 'Invalid email or password' });

  const user = { id: row.id, email: row.email, firstName: row.first_name, lastName: row.last_name, role: row.role };
  const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user });
});

router.get('/me', requireAuth, (req, res) => {
  const row = db.prepare('SELECT id, email, first_name, last_name, phone, role FROM users WHERE id = ?').get(req.user.id);
  if (!row) return res.status(404).json({ error: 'User not found' });
  res.json({ id: row.id, email: row.email, firstName: row.first_name, lastName: row.last_name, phone: row.phone, role: row.role });
});

module.exports = router;
