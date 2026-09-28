'use client';

import { useActionState } from 'react';
import type { ReactNode } from 'react';
import { Button } from '@/components/design-system';
import styles from './ActionForm.module.css';

type FormActionState = { ok: boolean; error?: string };

const initial: FormActionState = { ok: true };

export function ActionForm({
  action,
  children,
  submitLabel,
  className,
  submitVariant = 'primary',
  pendingLabel = 'Saving…',
}: {
  action: (prev: FormActionState, form: FormData) => Promise<FormActionState>;
  children: ReactNode;
  submitLabel: string;
  className?: string;
  submitVariant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  pendingLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form action={formAction} className={className}>
      {state.error ? (
        <p className={styles.error} role="alert">
          {state.error}
        </p>
      ) : null}
      {children}
      <div className={styles.actions}>
        <Button type="submit" variant={submitVariant} disabled={pending}>
          {pending ? pendingLabel : submitLabel}
        </Button>
      </div>
    </form>
  );
}
