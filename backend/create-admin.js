/**
 * Run once to create the admin user:
 *   node create-admin.js
 */
const bcrypt = require('bcryptjs');
const db = require('./db');

const email = 'admin@desimart.com';
const password = 'Admin@123';

const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
if (existing) {
  db.prepare("UPDATE users SET role = 'ADMIN' WHERE email = ?").run(email);
  console.log(`✅ Updated ${email} to ADMIN`);
} else {
  db.prepare(
    "INSERT INTO users (email, password, first_name, last_name, role) VALUES (?, ?, 'Admin', 'DesiMart', 'ADMIN')"
  ).run(email, bcrypt.hashSync(password, 10));
  console.log(`✅ Created admin: ${email} / ${password}`);
}
