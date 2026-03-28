// Downloads remaining Deep brand images from GroceryBabu S3 CDN
const https = require('https');
const fs    = require('fs');
const path  = require('path');
const db    = require('./db');

const IMG_DIR = path.join(__dirname, '../frontend/public/products/deep');
fs.mkdirSync(IMG_DIR, { recursive: true });

const IMAGES = {
  "Deep All Purpose Flour Maida 2lb": "https://s3-us-west-2.amazonaws.com/gbabu-img/thumb/36373730364132453546373337333433323636433639.jpg",
  "Deep Almond 14oz": "https://s3-us-west-2.amazonaws.com/gbabu-img/thumb/36373730364132453645333333313634363136433639.jpg",
  "Deep Bay Leaves 100gm": "https://s3-us-west-2.amazonaws.com/gbabu-img/thumb/36373730364132453546333933303331363736433639.jpg",
  "Deep Black Raisin 198g": "https://s3-us-west-2.amazonaws.com/gbabu-img/thumb/36373730364132453546333533313631373236433639.jpg",
  "Deep Cashew Split 7oz": "https://s3-us-west-2.amazonaws.com/gbabu-img/thumb/36373730364132453546364533313733363336433639.jpg",
  "Deep Cashew Whole 14oz": "https://s3-us-west-2.amazonaws.com/gbabu-img/thumb/36373730364132453546364533323737363336433639.jpg",
  "Deep Channa Dal Split 2 lbs": "https://s3-us-west-2.amazonaws.com/gbabu-img/thumb/36373730364132453546354633343331364336433639.jpg",
  "Deep Cinnamon Stick 3.5oz": "https://s3-us-west-2.amazonaws.com/gbabu-img/thumb/36373730364132453546333733353331373336433639.jpg",
  "Deep Cinnamon Stick 7oz": "https://s3-us-west-2.amazonaws.com/gbabu-img/thumb/36373730364132453643333733353331373336433639.jpg",
  "Deep Clove 3.5oz": "https://s3-us-west-2.amazonaws.com/gbabu-img/thumb/36373730364132453546364533383333373336433639.jpg",
  "Deep Clove 7oz": "https://s3-us-west-2.amazonaws.com/gbabu-img/thumb/36373730364132453546364533393333373336433639.jpg",
  "Deep Coconut Chutney": "https://s3-us-west-2.amazonaws.com/gbabu-img/thumb/36373730364132453546333131313633363636433639.jpg",
  "Deep Cumin Pwd 400g": "https://s3-us-west-2.amazonaws.com/gbabu-img/thumb/36373730364132453546354633363331373336433639.jpg",
  "Deep Cumin seeds 200g": "https://s3-us-west-2.amazonaws.com/gbabu-img/thumb/36373730364132453546354633353335373336433639.jpg",
  "Deep Curd Chili 7oz": "https://s3-us-west-2.amazonaws.com/gbabu-img/thumb/36373730364132453546354633373335363736433639.jpg",
  "Deep Dry Apricots 7Oz": "https://s3-us-west-2.amazonaws.com/gbabu-img/thumb/36373730364132453546354633313633363136433639.jpg",
  "Deep Fenugreek Seeds 400g": "https://s3-us-west-2.amazonaws.com/gbabu-img/thumb/36373730364132453546354633393331373336433639.jpg",
  "Deep Fried Onion 800g": "https://s3-us-west-2.amazonaws.com/gbabu-img/thumb/36373730364132453546354633333339373136433639.jpg",
  "Deep Ginger garlic paste 283g": "https://s3-us-west-2.amazonaws.com/gbabu-img/thumb/36373730364132453546354633343338373036433639.jpg",
  "Deep Green Cardamom 3.5oz": "https://s3-us-west-2.amazonaws.com/gbabu-img/thumb/36373730364132453645333133393331373336433639.jpg",
  "Deep Green Chili Chutney 220g": "https://s3-us-west-2.amazonaws.com/gbabu-img/thumb/36373730364132453546333633313633363636433639.jpg",
  "Deep Guava Juice 1 LTR": "https://s3-us-west-2.amazonaws.com/gbabu-img/thumb/39366336343738333833663566356532613630373736_thumb.jpg",
  "Deep Gulab Jamun Mix 100g": "https://s3-us-west-2.amazonaws.com/gbabu-img/thumb/36373730364132453546354633333339373036433639.jpg",
  "Deep Gulab Jamun Mix 200g": "https://s3-us-west-2.amazonaws.com/gbabu-img/thumb/36373730364132453546364333333339373036433639.jpg",
  "Deep Idli Rava Flr 2lb": "https://s3-us-west-2.amazonaws.com/gbabu-img/thumb/36373730364132453546354633313333363636433639.jpg",
  "Deep Juwar Flour 2Lb": "https://s3-us-west-2.amazonaws.com/gbabu-img/thumb/36373730364132453546354633383333363636433639.jpg",
  "Deep Kashmiri Chili pwd14oz": "https://s3-us-west-2.amazonaws.com/gbabu-img/thumb/36373730364132453546333733363331373336433639.jpg",
  "Deep Ladu Besan 2lb": "https://s3-us-west-2.amazonaws.com/gbabu-img/thumb/36373730364132453546354633393333363636433639.jpg",
  "Deep Lime Pickle w/oG 10.5oz": "https://s3-us-west-2.amazonaws.com/gbabu-img/thumb/36373730364132453546354633353333373036433639.jpg",
  "Deep Mango Thokku Pickle 10.5oz": "https://s3-us-west-2.amazonaws.com/gbabu-img/thumb/36373730364132453546373437353339333436433639.jpg",
  "Deep Masoor Dal 2lb": "https://s3-us-west-2.amazonaws.com/gbabu-img/thumb/36373730364132453546354633383331364336433639.jpg",
  "Deep Mixed Veg Pickle 10.5oz": "https://s3-us-west-2.amazonaws.com/gbabu-img/thumb/36373730364132453546373437353334333536433639.jpg",
  "Deep Mustard Seeds 7oz": "https://s3-us-west-2.amazonaws.com/gbabu-img/thumb/36373730364132453546364533373332373336433639.jpg",
  "Deep Panipuri 3.5 Oz": "https://s3-us-west-2.amazonaws.com/gbabu-img/thumb/36373730364132453546354633333634364436433639.jpg",
  "Deep Pistachio 14oz": "https://s3-us-west-2.amazonaws.com/gbabu-img/thumb/36373730364132453645333233313733373036433639.jpg",
  "Deep Pistachio 7oz": "https://s3-us-west-2.amazonaws.com/gbabu-img/thumb/36373730364132453645333133313733373036433639.jpg",
  "Deep Pudina Makhana 3.2Oz": "https://s3-us-west-2.amazonaws.com/gbabu-img/thumb/36373730364132453546333133303644363436433639.jpg",
  "Deep Pumpkin Seeds 7Oz": "https://s3-us-west-2.amazonaws.com/gbabu-img/thumb/36373730364132453546333733313733373036433639.jpg",
  "Deep Ragi Flour 4Lbs": "https://s3-us-west-2.amazonaws.com/gbabu-img/thumb/36373730364132453546354633363332363636433639.jpg",
  "Deep Raisins 7oz": "https://s3-us-west-2.amazonaws.com/gbabu-img/thumb/36373730364132453645333133313631373236433639.jpg",
  "Deep Rasam Powder 3.5Oz": "https://s3-us-west-2.amazonaws.com/gbabu-img/thumb/39366336333732333033343366356532613630373736_thumb.jpg",
  "Deep Rava Dosa Mix7oz": "https://s3-us-west-2.amazonaws.com/gbabu-img/thumb/36373730364132453546354633323331373036433639.jpg",
  "Deep Rava Idli Mix 7oz": "https://s3-us-west-2.amazonaws.com/gbabu-img/thumb/36373730364132453546354633313331373036433639.jpg",
  "Deep Red Chili Pwd 28oz": "https://s3-us-west-2.amazonaws.com/gbabu-img/thumb/36373730364132453546333933323331373336433639.jpg",
  "Deep Red Chili X Hot14oz": "https://s3-us-west-2.amazonaws.com/gbabu-img/thumb/36373730364132453546333733363331373336433639.jpg",
  "Deep Ribbon Pakodi 7oz": "https://s3-us-west-2.amazonaws.com/gbabu-img/thumb/36373730364132453546373337353338333136433639.jpg",
  "Deep Roasted Upma Rava 4lb": "https://s3-us-west-2.amazonaws.com/gbabu-img/thumb/36373730364132453546354633383337363636433639.jpg",
  "Deep Sesame Oil 500ml": "https://s3-us-west-2.amazonaws.com/gbabu-img/thumb/36373730364132453546333533313643364636433639.jpg",
  "Deep Sev Regular 12 oz": "https://s3-us-west-2.amazonaws.com/gbabu-img/thumb/36373730364132453330333633303330333036433639.jpg",
  "Deep Shah Jeera 7Oz": "https://s3-us-west-2.amazonaws.com/gbabu-img/thumb/36373730364132453546333633383331373336433639.jpg",
  "Deep Sunflower Seeds7oz": "https://s3-us-west-2.amazonaws.com/gbabu-img/thumb/39366336333733373133663566356532613630373736_thumb.jpg",
  "Deep Toor Dal Oily 4lb": "https://s3-us-west-2.amazonaws.com/gbabu-img/thumb/36373730364132453546354633313331364336433639.jpg",
  "Deep Turmeric pwd 14oz": "https://s3-us-west-2.amazonaws.com/gbabu-img/thumb/36373730364132453546354633323331373336433639.jpg",
  "Deep Turmeric pwd 7oz": "https://s3-us-west-2.amazonaws.com/gbabu-img/thumb/36373730364132453546354633343339373336433639.jpg",
  "Deep Walnuts 14 oz": "https://s3-us-west-2.amazonaws.com/gbabu-img/thumb/36373730364132453546333233313643373736433639.jpg",
  "Deep Whl Black Pepper 7oz": "https://s3-us-west-2.amazonaws.com/gbabu-img/thumb/36373730364132453546364533363337373336433639.jpg",
  "Deep Whl Garam Masla7oz": "https://s3-us-west-2.amazonaws.com/gbabu-img/thumb/36373730364132453546333333303331373336433639.jpg",
  "Deep XM Bisi Bele Bath": "https://s3-us-west-2.amazonaws.com/gbabu-img/thumb/36373730364132453546333833313644373836433639.jpg",
  "Deep XM Upma 3.5oz": "https://s3-us-west-2.amazonaws.com/gbabu-img/thumb/36373730364132453546333133313644373836433639.jpg",
};

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode !== 200) {
        file.close(); fs.existsSync(dest) && fs.unlinkSync(dest);
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      res.pipe(file);
      file.on('finish', () => resolve(fs.statSync(dest).size));
      file.on('error', reject);
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

async function main() {
  const entries = Object.entries(IMAGES);
  console.log(`\nDownloading ${entries.length} images from GroceryBabu CDN…\n`);
  let ok = 0, skip = 0, fail = 0;

  for (const [name, url] of entries) {
    // Find matching product in DB
    const product = db.prepare(
      `SELECT id, slug FROM products WHERE LOWER(name) = LOWER(?) LIMIT 1`
    ).get(name);

    if (!product) {
      console.log(`  ⚠ Not in DB: ${name}`);
      skip++;
      continue;
    }

    const filename = `${product.slug}.jpg`;
    const destPath = path.join(IMG_DIR, filename);
    const publicUrl = `/products/deep/${filename}`;

    process.stdout.write(`  ${name.slice(0, 50).padEnd(50)} `);

    if (fs.existsSync(destPath) && fs.statSync(destPath).size > 5000) {
      db.prepare('UPDATE products SET image_url = ? WHERE id = ?').run(publicUrl, product.id);
      process.stdout.write(`✓ cached\n`);
      skip++; continue;
    }

    try {
      const bytes = await download(url, destPath);
      if (bytes < 3000) {
        fs.unlinkSync(destPath);
        process.stdout.write(`✗ too small\n`);
        fail++; continue;
      }
      db.prepare('UPDATE products SET image_url = ? WHERE id = ?').run(publicUrl, product.id);
      process.stdout.write(`✓ ${(bytes/1024).toFixed(0)}KB\n`);
      ok++;
    } catch (e) {
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      process.stdout.write(`✗ ${e.message}\n`);
      fail++;
    }

    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`✓ Downloaded: ${ok}   ✓ Cached/Skipped: ${skip}   ✗ Failed: ${fail}`);

  const total = db.prepare(`SELECT COUNT(*) as c FROM products WHERE name LIKE 'Deep %' AND image_url IS NOT NULL AND image_url NOT LIKE 'http%'`).get().c;
  const grand = db.prepare(`SELECT COUNT(*) as c FROM products WHERE name LIKE 'Deep %'`).get().c;
  console.log(`\nDeep brand coverage: ${total}/${grand} products have local images`);
}

main().catch(console.error);
