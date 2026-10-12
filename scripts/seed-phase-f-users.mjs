#!/usr/bin/env node
/**
 * Phase F seed: Technician + Supervisor demo users for permission testing.
 */
import fs from 'fs';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

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

const users = [
  {
    name: 'Lineage Technician',
    email: 'tech@alkinda.com',
    password: 'TechLineage1!',
    roleId: 3,
    teamId: 1,
  },
  {
    name: 'Lineage Supervisor',
    email: 'supervisor@alkinda.com',
    password: 'SuperLineage1!',
    roleId: 2,
    teamId: 5,
  },
];

const creds = loadCreds();
const conn = await mysql.createConnection({
  host: creds.DB_HOST,
  port: Number(creds.DB_PORT || 3306),
  user: creds.DB_USER,
  password: creds.DB_PASSWORD,
  database: creds.DB_NAME,
});

console.log(`Connected to ${creds.DB_NAME}@${creds.DB_HOST}`);

for (const u of users) {
  const hash = await bcrypt.hash(u.password, 10);
  const [existing] = await conn.query('SELECT id FROM users WHERE email = ? LIMIT 1', [
    u.email,
  ]);
  if (existing.length) {
    await conn.query(
      `UPDATE users SET name = ?, password_hash = ?, role_id = ?, team_id = ?, is_active = 1 WHERE email = ?`,
      [u.name, hash, u.roleId, u.teamId, u.email],
    );
    console.log(`Updated ${u.email} (role ${u.roleId})`);
  } else {
    await conn.query(
      `INSERT INTO users (name, email, password_hash, team_id, role_id, is_active)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [u.name, u.email, hash, u.teamId, u.roleId],
    );
    console.log(`Created ${u.email} (role ${u.roleId})`);
  }
}

const [rows] = await conn.query(
  `SELECT u.email, r.name AS role FROM users u JOIN roles r ON r.id = u.role_id ORDER BY u.id`,
);
console.log({ users: rows });
await conn.end();

fs.writeFileSync(
  '/tmp/alkinda-phase-f-users.txt',
  [
    'admin@alkinda.com / (existing admin password)',
    'tech@alkinda.com / TechLineage1!',
    'supervisor@alkinda.com / SuperLineage1!',
    '',
  ].join('\n'),
);
console.log('Wrote /tmp/alkinda-phase-f-users.txt');
