const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// In production (Fly.io), DB lives on a persistent volume at /data
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'desimart.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'CUSTOMER',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    sort_order INTEGER DEFAULT 99
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    category_slug TEXT NOT NULL,
    unit TEXT,
    price REAL NOT NULL,
    image_url TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    is_featured INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER UNIQUE NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS cart_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    UNIQUE(user_id, product_id)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    order_number TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    total_amount REAL NOT NULL,
    shipping_address TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES orders(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL
  );
`);

// Seed categories
const catCount = db.prepare('SELECT COUNT(*) as c FROM categories').get().c;
if (catCount === 0) {
  const cats = [
    { name: 'Fresh Produce', slug: 'fresh-produce', sort_order: 1 },
    { name: 'Spices & Masalas', slug: 'spices-masalas', sort_order: 2 },
    { name: 'Lentils & Dal', slug: 'lentils-dal', sort_order: 3 },
    { name: 'Rice & Grains', slug: 'rice-grains', sort_order: 4 },
    { name: 'Flour & Atta', slug: 'flour-atta', sort_order: 5 },
    { name: 'Snacks & Namkeen', slug: 'snacks-namkeen', sort_order: 6 },
    { name: 'Pickles & Chutneys', slug: 'pickles-chutneys', sort_order: 7 },
    { name: 'Oils & Ghee', slug: 'oils-ghee', sort_order: 8 },
    { name: 'Beverages', slug: 'beverages', sort_order: 9 },
    { name: 'Sweets & Mithai', slug: 'sweets-mithai', sort_order: 10 },
    { name: 'Frozen Foods', slug: 'frozen-foods', sort_order: 11 },
    { name: 'Hot Foods', slug: 'hot-foods', sort_order: 12 },
  ];
  const ins = db.prepare('INSERT INTO categories (name, slug, sort_order) VALUES (?, ?, ?)');
  for (const c of cats) ins.run(c.name, c.slug, c.sort_order);
  console.log('Seeded categories');
}

// Seed products
const prodCount = db.prepare('SELECT COUNT(*) as c FROM products').get().c;
if (prodCount === 0) {
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/products.json'), 'utf8'));
  const ins = db.prepare(`
    INSERT OR IGNORE INTO products (sku, name, slug, description, category_slug, unit, price, is_featured)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insInv = db.prepare('INSERT OR IGNORE INTO inventory (product_id, quantity) VALUES (?, ?)');
  let i = 0;
  for (const p of raw) {
    const result = ins.run(
      p.sku || `SKU-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      p.name,
      p.slug,
      p.description || p.name,
      p.category,
      p.unit || 'per unit',
      p.price,
      i < 12 ? 1 : 0
    );
    if (result.lastInsertRowid) {
      insInv.run(result.lastInsertRowid, p.quantity || 50);
    }
    i++;
  }
  console.log(`Seeded ${raw.length} products`);
}

module.exports = db;
