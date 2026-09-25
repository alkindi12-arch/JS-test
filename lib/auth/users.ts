import { getPool, isDatabaseConfigured } from '@/lib/db/mysql';
import { verifyPassword } from '@/lib/auth/password';
import type { SessionUser } from '@/lib/auth/session';

type Row = Record<string, unknown>;

export type DbUser = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  passwordHash: string;
  teamId: number | null;
  roleId: number;
  roleName: string;
  isActive: boolean;
};

export async function findUserByEmail(email: string): Promise<DbUser | null> {
  if (!isDatabaseConfigured()) return null;
  const [rows] = await getPool().query(
    `
    SELECT u.id, u.name, u.email, u.phone, u.password_hash, u.team_id, u.role_id, u.is_active,
           r.name AS role_name
    FROM users u
    JOIN roles r ON r.id = u.role_id
    WHERE u.email = :email
    LIMIT 1
    `,
    { email: email.trim().toLowerCase() },
  );
  const row = (rows as Row[])[0];
  if (!row) return null;
  return {
    id: Number(row.id),
    name: String(row.name),
    email: String(row.email),
    phone: row.phone ? String(row.phone) : null,
    passwordHash: String(row.password_hash),
    teamId: row.team_id == null ? null : Number(row.team_id),
    roleId: Number(row.role_id),
    roleName: String(row.role_name),
    isActive: Boolean(row.is_active),
  };
}

export async function authenticateUser(
  email: string,
  password: string,
): Promise<SessionUser | null> {
  const user = await findUserByEmail(email);
  if (!user || !user.isActive) return null;
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.roleName,
    teamId: user.teamId,
  };
}

export async function listTeams(): Promise<Array<{ id: number; name: string; discipline: string }>> {
  if (!isDatabaseConfigured()) {
    return [
      { id: 1, name: 'Rotating', discipline: 'rotating' },
      { id: 2, name: 'Electrical', discipline: 'electrical' },
      { id: 3, name: 'Instrument', discipline: 'instrument' },
      { id: 4, name: 'Static', discipline: 'static' },
      { id: 5, name: 'Ops', discipline: 'ops' },
      { id: 6, name: 'Vendor', discipline: 'vendor' },
    ];
  }
  const [rows] = await getPool().query(
    `SELECT id, name, discipline FROM teams ORDER BY id`,
  );
  return (rows as Row[]).map((r) => ({
    id: Number(r.id),
    name: String(r.name),
    discipline: String(r.discipline),
  }));
}
