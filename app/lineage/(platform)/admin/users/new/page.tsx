import { redirect } from 'next/navigation';
import { Button, Stack, Surface, Text } from '@/components/design-system';
import { ActionForm } from '@/components/domain/ActionForm';
import formStyles from '@/components/domain/EntityForm.module.css';
import { PageHeader } from '@/components/layout/PageHeader';
import { createUserAction } from '@/lib/auth/admin-actions';
import { getSessionCapabilities } from '@/lib/auth/permissions';
import { listRoles } from '@/lib/auth/users';

export default async function NewUserPage() {
  const caps = await getSessionCapabilities();
  if (!caps.canAdmin) redirect('/lineage/dashboard');

  const roles = await listRoles();

  return (
    <Stack gap={6}>
      <PageHeader
        eyebrow="Administration"
        title="Add user"
        description="Create a Lineage account with a role. All users are Rotating."
        breadcrumbs={[
          { label: 'Admin', href: '/lineage/admin' },
          { label: 'Add user' },
        ]}
      />

      <Surface pad={5} className={`animate-fade-up ${formStyles.form}`}>
        <ActionForm
          action={createUserAction}
          submitLabel="Create user"
          className={formStyles.fields}
        >
          <label className={formStyles.field}>
            <span>Name</span>
            <input name="name" required maxLength={120} placeholder="Full name" />
          </label>
          <label className={formStyles.field}>
            <span>Email</span>
            <input
              name="email"
              type="email"
              required
              maxLength={190}
              placeholder="user@alkinda.com"
              autoComplete="off"
            />
          </label>
          <label className={formStyles.field}>
            <span>Phone</span>
            <input name="phone" maxLength={40} placeholder="Optional" />
          </label>
          <label className={formStyles.field}>
            <span>Temporary password</span>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="At least 8 characters"
            />
          </label>
          <label className={formStyles.field}>
            <span>Role</span>
            <select name="roleId" required defaultValue="3">
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
          <Text size="sm" tone="mute">
            User can sign in immediately. Team is always Rotating.
          </Text>
          <div className={formStyles.actionsRow}>
            <Button variant="secondary" href="/lineage/admin">
              Cancel
            </Button>
          </div>
        </ActionForm>
      </Surface>
    </Stack>
  );
}
