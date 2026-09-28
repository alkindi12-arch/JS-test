import { redirect } from 'next/navigation';
import { Stack, Surface, Text } from '@/components/design-system';
import { PageHeader } from '@/components/layout/PageHeader';
import { getSessionCapabilities } from '@/lib/auth/permissions';
import { listTeams } from '@/lib/auth/users';
import { getPool, isDatabaseConfigured } from '@/lib/db/mysql';

export default async function AdminPage() {
  const caps = await getSessionCapabilities();
  if (!caps.canAdmin) {
    redirect('/lineage/dashboard');
  }

  type RoleRow = { id: number; name: string; permissions_json: unknown };
  type UserRow = {
    id: number;
    name: string;
    email: string;
    role_name: string;
    is_active: number;
  };

  let roles: RoleRow[] = [];
  let users: UserRow[] = [];
  const teams = await listTeams();

  if (isDatabaseConfigured()) {
    const pool = getPool();
    const [roleRows] = await pool.query(
      `SELECT id, name, permissions_json FROM roles ORDER BY id`,
    );
    const [userRows] = await pool.query(
      `
      SELECT u.id, u.name, u.email, u.is_active, r.name AS role_name
      FROM users u
      JOIN roles r ON r.id = u.role_id
      ORDER BY u.id
      `,
    );
    roles = roleRows as RoleRow[];
    users = userRows as UserRow[];
  }

  return (
    <Stack gap={6}>
      <PageHeader
        eyebrow="Administration"
        title="Admin"
        description="Roles, permissions, and users enforced from Hostinger MySQL."
        breadcrumbs={[{ label: 'Dashboard', href: '/lineage/dashboard' }, { label: 'Admin' }]}
      />

      <Surface pad={5} className="animate-fade-up">
        <Stack gap={3}>
          <Text display size="xl">
            Roles
          </Text>
          <Text size="sm" tone="mute">
            Permissions come from roles.permissions_json (Admin has all).
          </Text>
          <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
            {roles.map((r) => (
              <li key={r.id}>
                <Text size="sm">
                  <strong>{r.name}</strong>
                  {' · '}
                  {typeof r.permissions_json === 'string'
                    ? r.permissions_json
                    : JSON.stringify(r.permissions_json)}
                </Text>
              </li>
            ))}
          </ul>
        </Stack>
      </Surface>

      <Surface pad={5} className="animate-fade-up stagger-1">
        <Stack gap={3}>
          <Text display size="xl">
            Users
          </Text>
          <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
            {users.map((u) => (
              <li key={u.id}>
                <Text size="sm">
                  {u.name} · {u.email} · {u.role_name}
                  {u.is_active ? '' : ' (inactive)'}
                </Text>
              </li>
            ))}
          </ul>
        </Stack>
      </Surface>

      <Surface pad={5} className="animate-fade-up stagger-2">
        <Stack gap={3}>
          <Text display size="xl">
            Teams
          </Text>
          <Text size="sm" tone="mute">
            {teams.map((t) => t.name).join(' · ')}
          </Text>
        </Stack>
      </Surface>
    </Stack>
  );
}
