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
      return idx === -1 ? line : line.slice(0, idx);
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
const sqlPath = path.join(root, 'db/migrations/005_attachments_hardening.sql');
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

const [cols] = await conn.query(`
  SELECT COLUMN_NAME FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'attachments'
    AND COLUMN_NAME IN ('file_size', 'uploaded_by_user_id', 'file_url')
  ORDER BY COLUMN_NAME
`);
const [idx] = await conn.query(`
  SELECT INDEX_NAME FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'attachments'
    AND INDEX_NAME = 'idx_attachments_activity'
`);
console.log({ columns: cols, index: idx });
await conn.end();
console.log(`Applied ${statements.length} statements from 005.`);
