import { Button, Stack, Surface, Text } from '@/components/design-system';
import { AssignRoleForm } from '@/components/domain/AssignRoleForm';
import { PageHeader } from '@/components/layout/PageHeader';
import formStyles from '@/components/domain/EntityForm.module.css';
import { getSessionCapabilities } from '@/lib/auth/permissions';
import { listRoles, listUsers } from '@/lib/auth/users';
import { redirect } from 'next/navigation';

export default async function AdminPage() {
  const caps = await getSessionCapabilities();
  if (!caps.canAdmin) {
    redirect('/lineage/dashboard');
  }

  const [roles, users] = await Promise.all([listRoles(), listUsers()]);
  const selfId = caps.session?.id;

  return (
    <Stack gap={6}>
      <PageHeader
        eyebrow="Administration"
        title="Admin"
        description="Manage users and allocate roles for the Rotating crew."
        breadcrumbs={[{ label: 'Dashboard', href: '/lineage/dashboard' }, { label: 'Admin' }]}
        actions={<Button href="/lineage/admin/users/new">Add user</Button>}
      />

      <Surface pad={5} className="animate-fade-up">
        <Stack gap={3}>
          <Text display size="xl">
            Users
          </Text>
          <Text size="sm" tone="mute">
            Add, edit, or deactivate accounts. Assign roles inline — everyone is Rotating.
          </Text>
          {users.length === 0 ? (
            <Text size="sm" tone="mute">
              No users yet.
            </Text>
          ) : (
            <table className={formStyles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td className={formStyles.mono}>{u.email}</td>
                    <td>
                      <AssignRoleForm
                        userId={u.id}
                        roleId={u.roleId}
                        roles={roles}
                        disabled={u.id === selfId}
                      />
                    </td>
                    <td>{u.isActive ? 'Active' : 'Inactive'}</td>
                    <td>
                      <Button size="sm" variant="secondary" href={`/lineage/admin/users/${u.id}`}>
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Stack>
      </Surface>

      <Surface pad={5} className="animate-fade-up stagger-1">
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
                </Text>
              </li>
            ))}
          </ul>
        </Stack>
      </Surface>
    </Stack>
  );
}
