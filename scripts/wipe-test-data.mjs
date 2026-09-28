#!/usr/bin/env node
/**
 * Fresh start: keep areas + system roles/teams + admin user.
 * Remove units, equipment, activities, and all related test rows.
 *
 * Usage (with DB_* env or /tmp/hostinger-lineage-db-credentials.txt):
 *   node scripts/wipe-test-data.mjs
 *   node scripts/wipe-test-data.mjs --dry-run
 */
import fs from 'fs';
import mysql from 'mysql2/promise';

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
  return Object.fromEntries(
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
}

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'alkindi12@gmail.com').toLowerCase();
const dryRun = process.argv.includes('--dry-run');

const PLANT_TABLES = [
  'attachments',
  'daily_updates',
  'work_orders',
  'root_cause_analysis',
  'equipment_status_history',
  'activities',
  'equipment',
  'units',
];

async function countAll(conn) {
  const tables = [
    ...PLANT_TABLES,
    'areas',
    'users',
    'roles',
    'teams',
  ];
  const out = {};
  for (const t of tables) {
    const [[{ n }]] = await conn.query(`SELECT COUNT(*) AS n FROM \`${t}\``);
    out[t] = n;
  }
  return out;
}

const creds = loadCreds();
const conn = await mysql.createConnection({
  host: creds.DB_HOST,
  port: Number(creds.DB_PORT || 3306),
  user: creds.DB_USER,
  password: creds.DB_PASSWORD,
  database: creds.DB_NAME,
  multipleStatements: true,
});

try {
  const before = await countAll(conn);
  const [areas] = await conn.query('SELECT id, name FROM areas ORDER BY id');
  const [users] = await conn.query(
    'SELECT id, email, name, role_id, is_active FROM users ORDER BY id',
  );

  console.log('Before:', before);
  console.log('Areas to keep:', areas);
  console.log('Users:', users);
  console.log(dryRun ? 'DRY RUN — no changes.' : 'Wiping plant test data…');

  if (!dryRun) {
    await conn.beginTransaction();
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const table of PLANT_TABLES) {
      const [r] = await conn.query(`DELETE FROM \`${table}\``);
      console.log(`  cleared ${table}: ${r.affectedRows} row(s)`);
    }
    const [userDel] = await conn.query(
      'DELETE FROM users WHERE LOWER(email) <> ?',
      [ADMIN_EMAIL],
    );
    console.log(`  removed non-admin users: ${userDel.affectedRows} row(s)`);
    // Ensure admin stays active Admin role
    await conn.query(
      'UPDATE users SET role_id = 1, is_active = 1 WHERE LOWER(email) = ?',
      [ADMIN_EMAIL],
    );
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    await conn.commit();
  }

  const after = await countAll(conn);
  const [areasAfter] = await conn.query('SELECT id, name FROM areas ORDER BY id');
  const [usersAfter] = await conn.query(
    'SELECT id, email, name, role_id, is_active FROM users ORDER BY id',
  );
  console.log('After:', after);
  console.log('Areas:', areasAfter);
  console.log('Users:', usersAfter);

  if (after.areas < 1) {
    throw new Error('Abort check: areas table is empty after wipe.');
  }
  if (after.users < 1) {
    throw new Error('Abort check: no admin user left.');
  }
  console.log(dryRun ? 'Dry run complete.' : 'Fresh plant data wipe complete.');
} catch (err) {
  try {
    await conn.rollback();
  } catch {
    /* ignore */
  }
  console.error(err);
  process.exitCode = 1;
} finally {
  await conn.end();
}
