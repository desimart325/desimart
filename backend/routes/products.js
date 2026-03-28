const router = require('express').Router();
const db = require('../db');

// Category list
router.get('/categories', (req, res) => {
  const rows = db.prepare('SELECT * FROM categories ORDER BY sort_order').all();
  res.json(rows);
});

// Derive a display base name: strip size from end for the card title
function baseName(name) {
  return name.trim()
    .replace(/\s+[\d.]+\s*(?:oz|lb|lbs|g|gm|kg|ml|ltr|pc|pcs|pack|count)\.?\s*$/i, '')
    .trim();
}

// Group flat product rows by group_key, return one representative per group
function groupProducts(rows) {
  const map = new Map();
  for (const p of rows) {
    const key = p.group_key || p.slug;
    if (!map.has(key)) {
      map.set(key, {
        ...p,
        display_name: baseName(p.name),
        variants: [],
        price_min: p.price,
        price_max: p.price,
      });
    }
    const g = map.get(key);
    g.variants.push({
      id: p.id,
      slug: p.slug,
      size_label: p.size_label,
      price: p.price,
      stock: p.stock,
      image_url: p.image_url,
    });
    if (p.price < g.price_min) g.price_min = p.price;
    if (p.price > g.price_max) g.price_max = p.price;
    // Prefer a variant that has a local image over one that doesn't
    if (!g.image_url && p.image_url) g.image_url = p.image_url;
    if (p.image_url && p.image_url.startsWith('/') && (!g.image_url || !g.image_url.startsWith('/'))) {
      g.image_url = p.image_url;
    }
  }
  return Array.from(map.values());
}

// Product list
router.get('/', (req, res) => {
  const { search = '', category = '', page = 1, limit = 24, featured } = req.query;

  let where = 'WHERE p.is_active = 1';
  const params = [];
  if (category) { where += ' AND p.category_slug = ?'; params.push(category); }
  if (search)   { where += ' AND LOWER(p.name) LIKE ?'; params.push(`%${search.toLowerCase()}%`); }
  if (featured) { where += ' AND p.is_featured = 1'; }

  const allRows = db.prepare(`
    SELECT p.*, i.quantity as stock, c.name as category_name
    FROM products p
    LEFT JOIN inventory i ON i.product_id = p.id
    LEFT JOIN categories c ON c.slug = p.category_slug
    ${where}
    ORDER BY p.is_featured DESC, p.group_key ASC, p.price ASC
  `).all(...params);

  const groups = groupProducts(allRows);
  const total = groups.length;
  const pg = parseInt(page);
  const lim = parseInt(limit);
  const paged = groups.slice((pg - 1) * lim, pg * lim);

  res.json({ products: paged, total, page: pg, pages: Math.ceil(total / lim) });
});

// Single product by slug — also returns all sibling variants
router.get('/:slug', (req, res) => {
  const p = db.prepare(`
    SELECT p.*, i.quantity as stock, c.name as category_name
    FROM products p
    LEFT JOIN inventory i ON i.product_id = p.id
    LEFT JOIN categories c ON c.slug = p.category_slug
    WHERE p.slug = ? AND p.is_active = 1
  `).get(req.params.slug);
  if (!p) return res.status(404).json({ error: 'Product not found' });

  // Fetch all variants in same group
  const variants = p.group_key
    ? db.prepare(`
        SELECT p.id, p.slug, p.name, p.price, p.size_label, p.image_url, i.quantity as stock
        FROM products p
        LEFT JOIN inventory i ON i.product_id = p.id
        WHERE p.group_key = ? AND p.is_active = 1
        ORDER BY p.price ASC
      `).all(p.group_key)
    : [{ id: p.id, slug: p.slug, name: p.name, price: p.price, size_label: p.size_label, stock: p.stock, image_url: p.image_url }];

  res.json({ ...p, display_name: baseName(p.name), variants });
});

module.exports = router;
