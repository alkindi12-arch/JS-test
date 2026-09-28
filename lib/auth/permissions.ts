import { getPool, isDatabaseConfigured } from '@/lib/db/mysql';
import { getSession, type SessionUser } from '@/lib/auth/session';

export type AppPermission =
  | 'activities.read'
  | 'activities.create'
  | 'activities.write'
  | 'activities.update'
  | 'activities.complete'
  | 'activities.close'
  | 'equipment.write'
  | 'admin';

export type RolePermissions = {
  all?: boolean;
  admin?: boolean;
  activities?: string[];
  equipment?: string[];
};

const FALLBACK_BY_ROLE: Record<string, RolePermissions> = {
  Admin: { all: true },
  Supervisor: {
    activities: ['read', 'write', 'complete', 'close'],
    admin: false,
  },
  Technician: {
    activities: ['read', 'write', 'update'],
    admin: false,
  },
  Operator: {
    activities: ['read', 'create'],
    admin: false,
  },
};

function parsePermissions(raw: unknown): RolePermissions {
  if (!raw) return {};
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as RolePermissions;
    } catch {
      return {};
    }
  }
  if (typeof raw === 'object') return raw as RolePermissions;
  return {};
}

export async function getRolePermissions(roleName: string): Promise<RolePermissions> {
  if (!roleName) return {};
  if (!isDatabaseConfigured()) {
    return FALLBACK_BY_ROLE[roleName] ?? {};
  }
  const [rows] = await getPool().query(
    `SELECT permissions_json FROM roles WHERE name = :name LIMIT 1`,
    { name: roleName },
  );
  const row = (rows as Array<{ permissions_json: unknown }>)[0];
  if (!row) return FALLBACK_BY_ROLE[roleName] ?? {};
  return parsePermissions(row.permissions_json);
}

export function can(perms: RolePermissions | null | undefined, action: AppPermission): boolean {
  if (!perms) return false;
  if (perms.all === true) return true;

  if (action === 'admin') return perms.admin === true;

  if (action === 'equipment.write') {
    const eq = perms.equipment ?? [];
    if (eq.includes('write') || eq.includes('all')) return true;
    // Supervisors/techs with activity write may also change equipment status
    const acts = perms.activities ?? [];
    return acts.includes('write') || acts.includes('complete') || acts.includes('close');
  }

  const [, verb] = action.split('.') as [string, string];
  const acts = perms.activities ?? [];
  if (acts.includes(verb)) return true;
  // Broad write covers create/update/attach but not complete/close
  if (
    (verb === 'create' || verb === 'update' || verb === 'write') &&
    acts.includes('write')
  ) {
    return true;
  }
  return false;
}

export type AuthzOk = { ok: true; session: SessionUser; permissions: RolePermissions };
export type AuthzFail = { ok: false; error: string };
export type AuthzResult = AuthzOk | AuthzFail;

export async function requireSession(): Promise<AuthzResult> {
  const session = await getSession();
  if (!session) {
    return { ok: false, error: 'Sign in required.' };
  }
  const permissions = await getRolePermissions(session.role);
  return { ok: true, session, permissions };
}

export async function requirePermission(action: AppPermission): Promise<AuthzResult> {
  const auth = await requireSession();
  if (!auth.ok) return auth;
  if (!can(auth.permissions, action)) {
    return {
      ok: false,
      error: `Not allowed (${action}). Your role: ${auth.session.role}.`,
    };
  }
  return auth;
}

export async function getSessionCapabilities(): Promise<{
  session: SessionUser | null;
  permissions: RolePermissions;
  canCreate: boolean;
  canUpdate: boolean;
  canComplete: boolean;
  canClose: boolean;
  canEquipmentWrite: boolean;
  canAdmin: boolean;
}> {
  const session = await getSession();
  if (!session) {
    return {
      session: null,
      permissions: {},
      canCreate: false,
      canUpdate: false,
      canComplete: false,
      canClose: false,
      canEquipmentWrite: false,
      canAdmin: false,
    };
  }
  const permissions = await getRolePermissions(session.role);
  return {
    session,
    permissions,
    canCreate: can(permissions, 'activities.create'),
    canUpdate: can(permissions, 'activities.update'),
    canComplete: can(permissions, 'activities.complete'),
    canClose: can(permissions, 'activities.close'),
    canEquipmentWrite: can(permissions, 'equipment.write'),
    canAdmin: can(permissions, 'admin'),
  };
}
