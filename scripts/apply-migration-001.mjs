#!/usr/bin/env node
/**
 * Apply db/migrations/001_org_users_priority.sql and seed admin user.
 * Usage: node scripts/apply-migration-001.mjs
 * Reads DB_* from /tmp/hostinger-lineage-db-credentials.txt or process.env
 */
import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function loadCreds() {
  const fromEnv = {
    DB_HOST: process.env.DB_HOST,
    DB_PORT: process.env.DB_PORT || '3306',
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_NAME: process.env.DB_NAME,
  };
  if (fromEnv.DB_HOST && fromEnv.DB_USER && fromEnv.DB_PASSWORD && fromEnv.DB_NAME) {
    return fromEnv;
  }
  const file = '/tmp/hostinger-lineage-db-credentials.txt';
  const map = Object.fromEntries(
    fs
      .readFileSync(file, 'utf8')
      .trim()
      .split('\n')
      .filter((l) => /^DB_/.test(l))
      .map((l) => {
        const i = l.indexOf('=');
        return [l.slice(0, i), l.slice(i + 1)];
      }),
  );
  return map;
}

function splitSql(sql) {
  // Split on semicolons not inside quotes — good enough for our migration file
  const parts = [];
  let buf = '';
  let inSingle = false;
  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    if (ch === "'" && sql[i - 1] !== '\\') inSingle = !inSingle;
    if (ch === ';' && !inSingle) {
      const stmt = buf.trim();
      if (stmt) parts.push(stmt);
      buf = '';
    } else {
      buf += ch;
    }
  }
  const tail = buf.trim();
  if (tail) parts.push(tail);
  return parts;
}

const creds = loadCreds();
const sqlPath = path.join(root, 'db/migrations/001_org_users_priority.sql');
const raw = fs.readFileSync(sqlPath, 'utf8');
const statements = splitSql(raw);

const conn = await mysql.createConnection({
  host: creds.DB_HOST,
  port: Number(creds.DB_PORT || 3306),
  user: creds.DB_USER,
  password: creds.DB_PASSWORD,
  database: creds.DB_NAME,
  multipleStatements: false,
});

console.log(`Connected to ${creds.DB_NAME}@${creds.DB_HOST}`);
for (const [idx, statement] of statements.entries()) {
  try {
    await conn.query(statement);
  } catch (err) {
    console.error(`Statement ${idx + 1} failed:\n${statement.slice(0, 180)}...`);
    throw err;
  }
}
console.log(`Applied ${statements.length} SQL statements.`);

const adminEmail = (process.env.ADMIN_EMAIL || 'admin@alkinda.com').toLowerCase();
const adminPassword =
  process.env.ADMIN_PASSWORD || `Alk${randomBytes(4).toString('hex')}!9`;
const adminName = process.env.ADMIN_NAME || 'Alkinda Admin';
const passwordHash = await bcrypt.hash(adminPassword, 10);

const [existing] = await conn.query('SELECT id FROM users WHERE email = ? LIMIT 1', [
  adminEmail,
]);
if (existing.length) {
  await conn.query(
    'UPDATE users SET password_hash = ?, name = ?, role_id = 1, is_active = 1 WHERE email = ?',
    [passwordHash, adminName, adminEmail],
  );
  console.log(`Updated admin user ${adminEmail}`);
} else {
  await conn.query(
    `INSERT INTO users (name, email, password_hash, team_id, role_id, is_active)
     VALUES (?, ?, ?, 5, 1, 1)`,
    [adminName, adminEmail, passwordHash],
  );
  console.log(`Created admin user ${adminEmail}`);
}

const sessionSecret =
  process.env.SESSION_SECRET || randomBytes(24).toString('hex');

const out = `/tmp/alkinda-auth-credentials.txt`;
fs.writeFileSync(
  out,
  [
    `ADMIN_EMAIL=${adminEmail}`,
    `ADMIN_PASSWORD=${adminPassword}`,
    `ADMIN_NAME=${adminName}`,
    `SESSION_SECRET=${sessionSecret}`,
    `NOTES=Set SESSION_SECRET (and keep admin password) in Hostinger Node env vars.`,
  ].join('\n') + '\n',
  { mode: 0o600 },
);

const [cols] = await conn.query(
  `SELECT COLUMN_NAME FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'activities'
     AND COLUMN_NAME IN ('priority','severity','assigned_team_id')`,
);
const [counts] = await conn.query(
  `SELECT
     (SELECT COUNT(*) FROM roles) AS roles,
     (SELECT COUNT(*) FROM teams) AS teams,
     (SELECT COUNT(*) FROM users) AS users`,
);
console.log('Activity columns:', cols);
console.log('Org counts:', counts);
console.log(`Auth credentials written to ${out}`);
await conn.end();
