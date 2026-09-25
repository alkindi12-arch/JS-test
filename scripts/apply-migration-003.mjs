#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
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
  if (fromEnv.DB_HOST && fromEnv.DB_USER && fromEnv.DB_PASSWORD && fromEnv.DB_NAME) return fromEnv;
  const map = Object.fromEntries(
    fs
      .readFileSync('/tmp/hostinger-lineage-db-credentials.txt', 'utf8')
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

function stripLineComments(sql) {
  return sql
    .split('\n')
    .map((line) => {
      const idx = line.indexOf('--');
      if (idx === -1) return line;
      // Keep strings with -- intact is rare in our migrations; strip simple comments
      return line.slice(0, idx);
    })
    .join('\n');
}

function splitSql(sql) {
  const cleaned = stripLineComments(sql);
  const parts = [];
  let buf = '';
  let inSingle = false;
  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (ch === "'" && cleaned[i - 1] !== '\\') inSingle = !inSingle;
    if (ch === ';' && !inSingle) {
      const stmt = buf.trim();
      if (stmt) parts.push(stmt);
      buf = '';
    } else buf += ch;
  }
  const tail = buf.trim();
  if (tail) parts.push(tail);
  return parts;
}

const creds = loadCreds();
const sqlPath = path.join(root, 'db/migrations/003_equipment_status_history.sql');
const statements = splitSql(fs.readFileSync(sqlPath, 'utf8'));

const conn = await mysql.createConnection({
  host: creds.DB_HOST,
  port: Number(creds.DB_PORT || 3306),
  user: creds.DB_USER,
  password: creds.DB_PASSWORD,
  database: creds.DB_NAME,
});

console.log(`Connected to ${creds.DB_NAME}@${creds.DB_HOST}`);
for (const [idx, statement] of statements.entries()) {
  try {
    await conn.query(statement);
  } catch (err) {
    console.error(`Statement ${idx + 1} failed:\n${statement.slice(0, 200)}`);
    throw err;
  }
}

const [tables] = await conn.query(`
  SELECT TABLE_NAME FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'equipment_status_history'
`);
const [rows] = await conn.query(`SELECT COUNT(*) AS n FROM equipment_status_history`);
const [sample] = await conn.query(`
  SELECT equipment_id, status, reason FROM equipment_status_history ORDER BY id LIMIT 8
`);
console.log({ table: tables, rowCount: rows, sample });
await conn.end();
console.log(`Applied ${statements.length} statements from 003.`);
