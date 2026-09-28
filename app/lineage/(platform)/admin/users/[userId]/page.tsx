import { notFound, redirect } from 'next/navigation';
import { Button, Stack, Surface, Text } from '@/components/design-system';
import { ActionForm } from '@/components/domain/ActionForm';
import formStyles from '@/components/domain/EntityForm.module.css';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  deactivateUserAction,
  reactivateUserAction,
  updateUserAction,
} from '@/lib/auth/admin-actions';
import { getSessionCapabilities } from '@/lib/auth/permissions';
import { getUserById, listRoles } from '@/lib/auth/users';

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const caps = await getSessionCapabilities();
  if (!caps.canAdmin) redirect('/lineage/dashboard');

  const { userId: userIdRaw } = await params;
  const userId = Number(userIdRaw);
  if (!userId) notFound();

  const [user, roles] = await Promise.all([getUserById(userId), listRoles()]);
  if (!user) notFound();

  const isSelf = caps.session?.id === user.id;

  return (
    <Stack gap={6}>
      <PageHeader
        eyebrow="Administration"
        title={`Edit ${user.name}`}
        description={`${user.email} · ${user.roleName}${user.isActive ? '' : ' · inactive'}`}
        breadcrumbs={[
          { label: 'Admin', href: '/lineage/admin' },
          { label: user.name },
        ]}
      />

      <Surface pad={5} className={`animate-fade-up ${formStyles.form}`}>
        <ActionForm
          action={updateUserAction}
          submitLabel="Save changes"
          className={formStyles.fields}
        >
          <input type="hidden" name="userId" value={user.id} />
          <label className={formStyles.field}>
            <span>Name</span>
            <input name="name" required maxLength={120} defaultValue={user.name} />
          </label>
          <label className={formStyles.field}>
            <span>Email</span>
            <input
              name="email"
              type="email"
              required
              maxLength={190}
              defaultValue={user.email}
              autoComplete="off"
            />
          </label>
          <label className={formStyles.field}>
            <span>Phone</span>
            <input name="phone" maxLength={40} defaultValue={user.phone ?? ''} />
          </label>
          <label className={formStyles.field}>
            <span>New password</span>
            <input
              name="password"
              type="password"
              minLength={8}
              autoComplete="new-password"
              placeholder="Leave blank to keep current"
            />
          </label>
          <label className={formStyles.field}>
            <span>Role</span>
            <select name="roleId" required defaultValue={String(user.roleId)}>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
          <Text size="sm" tone="mute">
            Team is always Rotating for this plant.
          </Text>
          <label className={formStyles.field}>
            <span>Status</span>
            <select name="isActive" defaultValue={user.isActive ? '1' : '0'} disabled={isSelf}>
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
          </label>
          {isSelf ? <input type="hidden" name="isActive" value="1" /> : null}
          <div className={formStyles.actionsRow}>
            <Button variant="secondary" href="/lineage/admin">
              Cancel
            </Button>
          </div>
        </ActionForm>

        {!isSelf ? (
          <div className={formStyles.dangerZone}>
            <Stack gap={3}>
              <Text size="sm" tone="mute">
                {user.isActive
                  ? 'Remove access without deleting history — user cannot sign in while inactive.'
                  : 'Restore sign-in access for this account.'}
              </Text>
              {user.isActive ? (
                <ActionForm
                  action={deactivateUserAction}
                  submitLabel="Deactivate user"
                  submitVariant="danger"
                  pendingLabel="Removing…"
                >
                  <input type="hidden" name="userId" value={user.id} />
                </ActionForm>
              ) : (
                <ActionForm
                  action={reactivateUserAction}
                  submitLabel="Reactivate user"
                  submitVariant="secondary"
                >
                  <input type="hidden" name="userId" value={user.id} />
                </ActionForm>
              )}
            </Stack>
          </div>
        ) : (
          <div className={formStyles.dangerZone}>
            <Text size="sm" tone="mute">
              You cannot deactivate your own account.
            </Text>
          </div>
        )}
      </Surface>
    </Stack>
  );
}
