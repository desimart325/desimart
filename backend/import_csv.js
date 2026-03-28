// import_csv.js — run once to import CSV inventory into the SQLite DB
// Usage: node import_csv.js
const fs = require('fs');
const path = require('path');
const db = require('./db');

const CSV_PATH = path.join(__dirname, 'data', 'products.csv');

if (!fs.existsSync(CSV_PATH)) {
  console.error('CSV not found at', CSV_PATH);
  process.exit(1);
}

// ── CSV parser (handles quoted fields) ──────────────────────────────────────
function parseCSV(text) {
  const lines = text.split('\n');
  const headers = lines[0].replace(/^\uFEFF/, '').split(',').map(h => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const vals = [];
    let cur = '', inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; }
      else if (ch === ',' && !inQ) { vals.push(cur); cur = ''; }
      else cur += ch;
    }
    vals.push(cur);
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = (vals[idx] || '').trim(); });
    rows.push(obj);
  }
  return rows;
}

// ── dept_name → category slug ────────────────────────────────────────────────
const DEPT_TO_SLUG = {
  'Veggies':               'fresh-produce',
  'Hot Foods':             'hot-foods',
  'Generic':               'misc',
  'Snacks':                'snacks-namkeen',
  'Chocolates':            'chocolates',
  'Tea & Coffee':          'tea-coffee',
  'Masala & Spices':       'spices-masalas',
  'Drinks':                'beverages',
  'Dals and Lentils':      'lentils-dal',
  'Flour':                 'flour-atta',
  'Instant Mixes':         'instant-mixes',
  'Paste & Concentrate':   'paste-concentrate',
  'Naan & Paratha':        'breads-rotis',
  'Dairy':                 'dairy',
  'Cooking Oil & Ghee':    'oils-ghee',
  'Nuts & Seeds':          'nuts-seeds',
  'Pickle & Sauce':        'pickles-chutneys',
  'Ready To Eat':          'ready-to-eat',
  'Rice & Millets':        'rice-grains',
  'Frozen Veggies':        'frozen-foods',
  'Biscuits and Cookies':  'biscuits-cookies',
  'Salt & Sugar':          'salt-sugar',
  'Spice Mix':             'spices-masalas',
  'Juices':                'beverages',
  'Baking':                'baking',
  'Digestive & Refreshers':'digestive-refreshers',
  'Desserts & Ice Cream':  'sweets-mithai',
  'Personal Care':         'personal-care',
  'Noodles & Vermicelli':  'noodles-vermicelli',
};

// ── Full category list ───────────────────────────────────────────────────────
const CATEGORIES = [
  { slug: 'fresh-produce',       name: 'Fresh Produce',          sort_order: 1  },
  { slug: 'spices-masalas',      name: 'Spices & Masalas',       sort_order: 2  },
  { slug: 'lentils-dal',         name: 'Lentils & Dal',          sort_order: 3  },
  { slug: 'rice-grains',         name: 'Rice & Millets',         sort_order: 4  },
  { slug: 'flour-atta',          name: 'Flour & Atta',           sort_order: 5  },
  { slug: 'snacks-namkeen',      name: 'Snacks',                 sort_order: 6  },
  { slug: 'pickles-chutneys',    name: 'Pickles & Sauces',       sort_order: 7  },
  { slug: 'oils-ghee',           name: 'Cooking Oil & Ghee',     sort_order: 8  },
  { slug: 'tea-coffee',          name: 'Tea & Coffee',           sort_order: 9  },
  { slug: 'beverages',           name: 'Beverages & Juices',     sort_order: 10 },
  { slug: 'sweets-mithai',       name: 'Sweets & Desserts',      sort_order: 11 },
  { slug: 'frozen-foods',        name: 'Frozen Foods',           sort_order: 12 },
  { slug: 'hot-foods',           name: 'Hot Foods',              sort_order: 13 },
  { slug: 'dairy',               name: 'Dairy',                  sort_order: 14 },
  { slug: 'instant-mixes',       name: 'Instant Mixes',          sort_order: 15 },
  { slug: 'ready-to-eat',        name: 'Ready To Eat',           sort_order: 16 },
  { slug: 'biscuits-cookies',    name: 'Biscuits & Cookies',     sort_order: 17 },
  { slug: 'noodles-vermicelli',  name: 'Noodles & Vermicelli',   sort_order: 18 },
  { slug: 'breads-rotis',        name: 'Breads & Rotis',         sort_order: 19 },
  { slug: 'nuts-seeds',          name: 'Nuts & Seeds',           sort_order: 20 },
  { slug: 'paste-concentrate',   name: 'Paste & Concentrate',    sort_order: 21 },
  { slug: 'baking',              name: 'Baking',                 sort_order: 22 },
  { slug: 'chocolates',          name: 'Chocolates',             sort_order: 23 },
  { slug: 'salt-sugar',          name: 'Salt & Sugar',           sort_order: 24 },
  { slug: 'digestive-refreshers',name: 'Digestive & Refreshers', sort_order: 25 },
  { slug: 'personal-care',       name: 'Personal Care',          sort_order: 26 },
  { slug: 'misc',                name: 'General',                sort_order: 27 },
];

// ── slug generator ────────────────────────────────────────────────────────────
const slugCounts = {};
function toSlug(text) {
  const base = text.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  slugCounts[base] = (slugCounts[base] || 0) + 1;
  return slugCounts[base] === 1 ? base : `${base}-${slugCounts[base]}`;
}

// ── Open Food Facts image URL builder ────────────────────────────────────────
function offImageUrl(upc) {
  // Skip PLU codes (too many leading zeros, < 8 meaningful digits)
  const stripped = upc.replace(/^0+/, '');
  if (stripped.length < 6) return null;
  // Pad to 13 digits for EAN-13
  const ean = upc.padStart(13, '0');
  const a = ean.slice(0, 3);
  const b = ean.slice(3, 6);
  const c = ean.slice(6, 9);
  const d = ean.slice(9);
  return `https://images.openfoodfacts.org/images/products/${a}/${b}/${c}/${d}/front_en.400.jpg`;
}

// ── Main import ───────────────────────────────────────────────────────────────
console.log('Reading CSV…');
const content = fs.readFileSync(CSV_PATH, 'utf8');
const rows = parseCSV(content);

// Filter valid products
const products = rows.filter(r =>
  r.active === 'True' &&
  r.deleted !== 'True' &&
  r.HideFromECommerce !== 'True' &&
  parseFloat(r.normal_price || r.ECommercePrice || r.special_price || '0') > 0
);
console.log(`Found ${products.length} valid products`);

// Run everything in a transaction
const doImport = db.transaction(() => {
  // 1. Clear existing data
  db.prepare('DELETE FROM inventory').run();
  db.prepare('DELETE FROM products').run();
  db.prepare('DELETE FROM categories').run();
  console.log('Cleared existing products, categories, inventory');

  // 2. Insert categories
  const insCat = db.prepare('INSERT OR REPLACE INTO categories (name, slug, sort_order) VALUES (?, ?, ?)');
  for (const cat of CATEGORIES) {
    insCat.run(cat.name, cat.slug, cat.sort_order);
  }
  console.log(`Inserted ${CATEGORIES.length} categories`);

  // 3. Insert products
  const insProd = db.prepare(`
    INSERT OR IGNORE INTO products (sku, name, slug, description, category_slug, unit, price, image_url, is_active, is_featured)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 0)
  `);
  const insInv = db.prepare('INSERT OR IGNORE INTO inventory (product_id, quantity) VALUES (?, ?)');

  let imported = 0;
  let skipped = 0;
  const featuredCategories = ['spices-masalas', 'snacks-namkeen', 'lentils-dal', 'rice-grains', 'ready-to-eat', 'instant-mixes'];
  const featuredCounts = {};

  for (const row of products) {
    const categorySlug = DEPT_TO_SLUG[row.dept_name] || 'misc';
    const price = parseFloat(row.normal_price || row.ECommercePrice || row.special_price || '0');
    const qty = Math.max(0, Math.floor(parseFloat(row.QuantityOnHand || '0')));
    const upc = (row.upc || '').trim();
    const name = (row.ECommerceDescription || row.description || '').trim();
    if (!name) { skipped++; continue; }

    const slug = toSlug(name);
    const unit = (row.UnitOfMeasure || row.size || 'unit').trim() || 'unit';
    const imageUrl = (upc && upc.replace(/^0+/, '').length >= 6) ? offImageUrl(upc) : null;

    // Mark first 2 products per featured category as featured
    let isFeatured = 0;
    if (featuredCategories.includes(categorySlug)) {
      featuredCounts[categorySlug] = (featuredCounts[categorySlug] || 0) + 1;
      if (featuredCounts[categorySlug] <= 2) isFeatured = 1;
    }

    try {
      const result = insProd.run(upc || slug, name, slug, name, categorySlug, unit, price, imageUrl);
      if (result.lastInsertRowid) {
        insInv.run(result.lastInsertRowid, qty > 0 ? qty : 20);
        if (isFeatured) {
          db.prepare('UPDATE products SET is_featured = 1 WHERE id = ?').run(result.lastInsertRowid);
        }
        imported++;
      } else {
        skipped++;
      }
    } catch (e) {
      skipped++;
    }
  }

  console.log(`Imported: ${imported}, Skipped: ${skipped}`);
});

doImport();

// Mark top 12 products as featured (one from each of 12 popular categories)
const topCats = ['spices-masalas', 'lentils-dal', 'rice-grains', 'snacks-namkeen', 'ready-to-eat',
                 'instant-mixes', 'oils-ghee', 'flour-atta', 'dairy', 'sweets-mithai', 'biscuits-cookies', 'breads-rotis'];
db.prepare('UPDATE products SET is_featured = 0').run();
for (const slug of topCats) {
  const p = db.prepare('SELECT id FROM products WHERE category_slug = ? AND is_active = 1 LIMIT 1').get(slug);
  if (p) db.prepare('UPDATE products SET is_featured = 1 WHERE id = ?').run(p.id);
}

const featCount = db.prepare('SELECT COUNT(*) as c FROM products WHERE is_featured = 1').get().c;
const totalCount = db.prepare('SELECT COUNT(*) as c FROM products').get().c;
console.log(`\nDone! ${totalCount} total products, ${featCount} featured`);
console.log('Categories:');
db.prepare('SELECT slug, name, (SELECT COUNT(*) FROM products WHERE category_slug = categories.slug) as cnt FROM categories ORDER BY sort_order').all()
  .forEach(r => console.log(`  ${r.name} (${r.slug}): ${r.cnt} products`));
