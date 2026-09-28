'use client';

import { ActionForm } from '@/components/domain/ActionForm';
import { assignRoleAction } from '@/lib/auth/admin-actions';
import styles from './AssignRoleForm.module.css';

export function AssignRoleForm({
  userId,
  roleId,
  roles,
  disabled,
}: {
  userId: number;
  roleId: number;
  roles: Array<{ id: number; name: string }>;
  disabled?: boolean;
}) {
  if (disabled) {
    const current = roles.find((r) => r.id === roleId);
    return <span className={styles.locked}>{current?.name ?? '—'}</span>;
  }

  return (
    <ActionForm
      action={assignRoleAction}
      submitLabel="Set"
      submitVariant="secondary"
      pendingLabel="…"
      className={styles.form}
    >
      <input type="hidden" name="userId" value={userId} />
      <select name="roleId" defaultValue={String(roleId)} className={styles.select} required>
        {roles.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </select>
    </ActionForm>
  );
}
