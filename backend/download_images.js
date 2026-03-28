// download_images.js — fetches & caches product images for a brand
// Usage: node download_images.js [brand]   e.g.  node download_images.js deep
// Tries Open Food Facts API by UPC, then falls back to direct image URL patterns

const https = require('https');
const http  = require('http');
const fs    = require('fs');
const path  = require('path');
const db    = require('./db');

const BRAND = (process.argv[2] || 'deep').toLowerCase();
const IMG_DIR = path.join(__dirname, `../frontend/public/products/${BRAND}`);
const PUBLIC_PATH = `/products/${BRAND}`;
const DELAY_MS = 600; // respectful delay between OFF API calls

fs.mkdirSync(IMG_DIR, { recursive: true });

// ── helpers ──────────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function get(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, {
      headers: {
        'User-Agent': 'DesiMart-ImageFetcher/1.0 (github.com/desimart)',
        'Accept': 'application/json, image/*'
      }
    }, (res) => {
      const chunks = [];
      res.on('data', d => chunks.push(d));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

async function downloadImage(url, destPath) {
  const res = await get(url);
  if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
  const ct = res.headers['content-type'] || '';
  if (!ct.includes('image') && !ct.includes('octet')) throw new Error(`Not image: ${ct}`);
  if (res.body.length < 2000) throw new Error(`Too small (${res.body.length} bytes) — likely placeholder`);
  fs.writeFileSync(destPath, res.body);
  return res.body.length;
}

async function getOffImageUrl(upc) {
  // Query Open Food Facts product API
  const url = `https://world.openfoodfacts.org/api/v0/product/${upc}.json?fields=image_front_url,image_url`;
  const res = await get(url);
  if (res.status !== 200) return null;
  try {
    const json = JSON.parse(res.body.toString());
    if (json.status !== 1) return null;
    return json.product?.image_front_url || json.product?.image_url || null;
  } catch { return null; }
}

function offFallbackUrl(upc) {
  // Try the direct image path (barcode image #1 at 400px)
  const ean = upc.padStart(13, '0');
  if (ean.replace(/^0+/, '').length < 6) return null;
  const [a, b, c, d] = [ean.slice(0,3), ean.slice(3,6), ean.slice(6,9), ean.slice(9)];
  return `https://images.openfoodfacts.org/images/products/${a}/${b}/${c}/${d}/1.400.jpg`;
}

// ── main ─────────────────────────────────────────────────────────────────────
async function main() {
  const products = db.prepare(
    `SELECT id, sku, name, slug FROM products WHERE LOWER(name) LIKE ? ORDER BY name`
  ).all(`${BRAND} %`);

  console.log(`\nDownloading images for ${products.length} ${BRAND} products…\n`);

  let downloaded = 0, already = 0, failed = 0;
  const failures = [];

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const filename = `${p.slug}.jpg`;
    const destPath = path.join(IMG_DIR, filename);
    const publicUrl = `${PUBLIC_PATH}/${filename}`;

    process.stdout.write(`[${String(i+1).padStart(3)}/${products.length}] ${p.name.slice(0, 50).padEnd(50)} `);

    // Already downloaded — just re-link in DB
    if (fs.existsSync(destPath) && fs.statSync(destPath).size > 2000) {
      db.prepare('UPDATE products SET image_url = ? WHERE id = ?').run(publicUrl, p.id);
      process.stdout.write(`✓ cached\n`);
      already++;
      continue;
    }

    const upc = p.sku;
    let imageUrl = null;
    let bytes = 0;

    // Step 1: OFF product API (most accurate, returns exact front image)
    try {
      imageUrl = await getOffImageUrl(upc);
    } catch { imageUrl = null; }

    // Step 2: OFF direct fallback URL
    if (!imageUrl) imageUrl = offFallbackUrl(upc);

    // Attempt download
    let success = false;
    if (imageUrl) {
      try {
        bytes = await downloadImage(imageUrl, destPath);
        success = true;
      } catch (e) {
        if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
        // If API gave URL but it failed, try direct fallback
        if (imageUrl !== offFallbackUrl(upc)) {
          const fallback = offFallbackUrl(upc);
          if (fallback) {
            try {
              bytes = await downloadImage(fallback, destPath);
              success = true;
            } catch { if (fs.existsSync(destPath)) fs.unlinkSync(destPath); }
          }
        }
      }
    }

    if (success) {
      db.prepare('UPDATE products SET image_url = ? WHERE id = ?').run(publicUrl, p.id);
      process.stdout.write(`✓ ${(bytes/1024).toFixed(0)}KB\n`);
      downloaded++;
    } else {
      process.stdout.write(`✗ not found\n`);
      failed++;
      failures.push(p.name);
    }

    await sleep(DELAY_MS);
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`✓ Downloaded: ${downloaded}   ✓ Cached: ${already}   ✗ Failed: ${failed}`);
  if (failures.length) {
    console.log(`\nNot found on Open Food Facts (${failures.length}):`);
    failures.forEach(n => console.log(`  - ${n}`));
  }
  console.log('');
}

main().catch(console.error);
