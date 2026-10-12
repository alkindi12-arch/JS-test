/**
 * Hostinger MySQL client (mysql2).
 * Credentials come from hPanel environment variables — never commit secrets.
 *
 * Hostinger note: for Node.js use the MySQL hostname from Databases → Remote MySQL
 * (e.g. srvXXXX.hstgr.io), not `localhost` (IPv6 loopback issue on Node).
 */

import mysql, { type Pool, type PoolOptions } from 'mysql2/promise';

let pool: Pool | null = null;

export function isDatabaseConfigured(): boolean {
  return Boolean(
    process.env.DB_HOST &&
      process.env.DB_USER &&
      process.env.DB_PASSWORD &&
      process.env.DB_NAME,
  );
}

function buildPoolOptions(): PoolOptions {
  return {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 5,
    namedPlaceholders: true,
    timezone: 'Z',
  };
}

export function getPool(): Pool {
  if (!isDatabaseConfigured()) {
    throw new Error(
      'Database env vars missing. Set DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME in Hostinger.',
    );
  }
  if (!pool) {
    pool = mysql.createPool(buildPoolOptions());
  }
  return pool;
}

export async function pingDatabase(): Promise<{ ok: boolean; message: string }> {
  if (!isDatabaseConfigured()) {
    return { ok: false, message: 'not_configured' };
  }
  try {
    const conn = await getPool().getConnection();
    await conn.ping();
    conn.release();
    return { ok: true, message: 'connected' };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'connection_failed';
    return { ok: false, message };
  }
}
