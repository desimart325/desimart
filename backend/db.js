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
    group_key TEXT,
    size_label TEXT,
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
    payment_method TEXT NOT NULL DEFAULT 'cash',
    payment_id TEXT,
    payment_status TEXT NOT NULL DEFAULT 'pending',
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

// ── Indexes for query performance ────────────────────────────────────────────
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_products_active        ON products(is_active);
  CREATE INDEX IF NOT EXISTS idx_products_active_cat    ON products(is_active, category_slug);
  CREATE INDEX IF NOT EXISTS idx_products_featured      ON products(is_featured);
  CREATE INDEX IF NOT EXISTS idx_products_group_key     ON products(group_key);
  CREATE INDEX IF NOT EXISTS idx_inventory_product      ON inventory(product_id);
  CREATE INDEX IF NOT EXISTS idx_cart_user              ON cart_items(user_id);
  CREATE INDEX IF NOT EXISTS idx_orders_user            ON orders(user_id);
`);

// ── Safe migrations (add columns to existing DBs if missing) ─────────────────
const productCols = db.prepare("PRAGMA table_info(products)").all().map(c => c.name);
if (!productCols.includes('group_key'))   db.prepare("ALTER TABLE products ADD COLUMN group_key TEXT").run();
if (!productCols.includes('size_label'))  db.prepare("ALTER TABLE products ADD COLUMN size_label TEXT").run();

const orderCols = db.prepare("PRAGMA table_info(orders)").all().map(c => c.name);
if (!orderCols.includes('payment_method'))  db.prepare("ALTER TABLE orders ADD COLUMN payment_method TEXT NOT NULL DEFAULT 'cash'").run();
if (!orderCols.includes('payment_id'))      db.prepare("ALTER TABLE orders ADD COLUMN payment_id TEXT").run();
if (!orderCols.includes('payment_status'))  db.prepare("ALTER TABLE orders ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'pending'").run();

// ── CSV seeding helpers ───────────────────────────────────────────────────────
const DEPT_TO_SLUG = {
  'Veggies':              'fresh-produce',
  'Masala & Spices':      'spices-masalas',
  'Spice Mix':            'spices-masalas',
  'Dals and Lentils':     'lentils-dal',
  'Rice & Millets':       'rice-grains',
  'Flour':                'flour-atta',
  'Snacks':               'snacks-namkeen',
  'Biscuits and Cookies': 'biscuits-cookies',
  'Pickle & Sauce':       'pickles-chutneys',
  'Cooking Oil & Ghee':   'oils-ghee',
  'Tea & Coffee':         'tea-coffee',
  'Drinks':               'beverages',
  'Juices':               'beverages',
  'Desserts & Ice Cream': 'sweets-mithai',
  'Chocolates':           'chocolates',
  'Frozen Veggies':       'frozen-foods',
  'Hot Foods':            'hot-foods',
  'Dairy':                'dairy',
  'Instant Mixes':        'instant-mixes',
  'Ready To Eat':         'ready-to-eat',
  'Noodles & Vermicelli': 'noodles-vermicelli',
  'Naan & Paratha':       'breads-rotis',
  'Nuts & Seeds':         'nuts-seeds',
  'Paste & Concentrate':  'paste-concentrate',
  'Baking':               'baking',
  'Salt & Sugar':         'salt-sugar',
  'Digestive & Refreshers': 'digestive-refreshers',
  'Personal Care':        'personal-care',
  'Generic':              'misc',
};

const CSV_CATEGORIES = [
  { name: 'Fresh Produce',       slug: 'fresh-produce',        sort_order: 1  },
  { name: 'Spices & Masalas',    slug: 'spices-masalas',       sort_order: 2  },
  { name: 'Lentils & Dal',       slug: 'lentils-dal',          sort_order: 3  },
  { name: 'Rice & Grains',       slug: 'rice-grains',          sort_order: 4  },
  { name: 'Flour & Atta',        slug: 'flour-atta',           sort_order: 5  },
  { name: 'Snacks & Namkeen',    slug: 'snacks-namkeen',       sort_order: 6  },
  { name: 'Biscuits & Cookies',  slug: 'biscuits-cookies',     sort_order: 7  },
  { name: 'Pickles & Chutneys',  slug: 'pickles-chutneys',     sort_order: 8  },
  { name: 'Oils & Ghee',         slug: 'oils-ghee',            sort_order: 9  },
  { name: 'Tea & Coffee',        slug: 'tea-coffee',           sort_order: 10 },
  { name: 'Beverages',           slug: 'beverages',            sort_order: 11 },
  { name: 'Sweets & Mithai',     slug: 'sweets-mithai',        sort_order: 12 },
  { name: 'Chocolates',          slug: 'chocolates',           sort_order: 13 },
  { name: 'Frozen Foods',        slug: 'frozen-foods',         sort_order: 14 },
  { name: 'Hot Foods',           slug: 'hot-foods',            sort_order: 15 },
  { name: 'Dairy',               slug: 'dairy',                sort_order: 16 },
  { name: 'Instant Mixes',       slug: 'instant-mixes',        sort_order: 17 },
  { name: 'Ready To Eat',        slug: 'ready-to-eat',         sort_order: 18 },
  { name: 'Noodles & Vermicelli',slug: 'noodles-vermicelli',   sort_order: 19 },
  { name: 'Breads & Rotis',      slug: 'breads-rotis',         sort_order: 20 },
  { name: 'Nuts & Seeds',        slug: 'nuts-seeds',           sort_order: 21 },
  { name: 'Paste & Concentrate', slug: 'paste-concentrate',    sort_order: 22 },
  { name: 'Baking',              slug: 'baking',               sort_order: 23 },
  { name: 'Salt & Sugar',        slug: 'salt-sugar',           sort_order: 24 },
  { name: 'Digestive & Refreshers', slug: 'digestive-refreshers', sort_order: 25 },
  { name: 'Personal Care',       slug: 'personal-care',        sort_order: 26 },
  { name: 'Misc',                slug: 'misc',                 sort_order: 27 },
];

function parseCsvLine(line) {
  const fields = [];
  let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (ch === ',' && !inQ) {
      fields.push(cur); cur = '';
    } else {
      cur += ch;
    }
  }
  fields.push(cur);
  return fields;
}

function toSlug(name, used) {
  let base = name.toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  let slug = base, n = 2;
  while (used.has(slug)) slug = `${base}-${n++}`;
  used.add(slug);
  return slug;
}

// Seed categories
const catCount = db.prepare('SELECT COUNT(*) as c FROM categories').get().c;
if (catCount === 0) {
  const ins = db.prepare('INSERT INTO categories (name, slug, sort_order) VALUES (?, ?, ?)');
  for (const c of CSV_CATEGORIES) ins.run(c.name, c.slug, c.sort_order);
  console.log('Seeded categories');
}

// Seed products from CSV
const prodCount = db.prepare('SELECT COUNT(*) as c FROM products').get().c;
if (prodCount === 0) {
  const csvPath = path.join(__dirname, 'data/products.csv');
  const lines = fs.readFileSync(csvPath, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/);
  const headers = parseCsvLine(lines[0]);
  const idx = (h) => headers.indexOf(h);

  const ins = db.prepare(`
    INSERT OR IGNORE INTO products (sku, name, slug, description, category_slug, unit, price, is_featured)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insInv = db.prepare('INSERT OR IGNORE INTO inventory (product_id, quantity) VALUES (?, ?)');

  const usedSlugs = new Set();
  let seeded = 0, featured = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const f = parseCsvLine(line);

    const active   = (f[idx('active')]          || '').toLowerCase();
    const hidden   = (f[idx('HideFromECommerce')]|| '').toLowerCase();
    const deleted  = (f[idx('deleted')]         || '').toLowerCase();
    if (active === 'false' || hidden === 'true' || deleted === 'true') continue;

    const rawPrice = parseFloat(f[idx('normal_price')]) || 0;
    if (rawPrice <= 0) continue;

    const upc      = (f[idx('upc')] || '').trim();
    const name     = (f[idx('description')] || '').trim();
    if (!name) continue;

    const deptName = (f[idx('dept_name')] || '').trim();
    const catSlug  = DEPT_TO_SLUG[deptName] || 'misc';
    const unit     = (f[idx('UnitOfMeasure')] || f[idx('size')] || '').trim() || 'per unit';
    const qty      = Math.max(0, parseInt(f[idx('QuantityOnHand')]) || 50);
    const slug     = toSlug(name, usedSlugs);
    const isFeat   = featured < 12 ? 1 : 0;
    if (isFeat) featured++;

    const result = ins.run(upc || `SKU-${slug.slice(0, 8).toUpperCase()}`, name, slug, name, catSlug, unit, rawPrice, isFeat);
    if (result.lastInsertRowid) {
      insInv.run(result.lastInsertRowid, qty);
      seeded++;
    }
  }
  console.log(`Seeded ${seeded} products from CSV`);
}

// ── Apply fresh-produce images (runs every boot, only fills NULL slots) ───────
const produceImages = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/produce-images.json'), 'utf8'));
const patchImg = db.prepare(
  "UPDATE products SET image_url = ? WHERE category_slug = 'fresh-produce' AND LOWER(name) LIKE ? AND (image_url IS NULL OR image_url = '')"
);
let imgPatched = 0;
for (const { match, url } of produceImages) {
  const info = patchImg.run(url, match);
  imgPatched += info.changes;
}
if (imgPatched > 0) console.log(`Patched ${imgPatched} fresh-produce images`);

module.exports = db;
