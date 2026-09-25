'use client';

import { useActionState } from 'react';
import type { ReactNode } from 'react';
import { Button } from '@/components/design-system';
import type { ActionState } from '@/lib/data/plant-writes';
import styles from './ActionForm.module.css';

const initial: ActionState = { ok: true };

export function ActionForm({
  action,
  children,
  submitLabel,
  className,
}: {
  action: (prev: ActionState, form: FormData) => Promise<ActionState>;
  children: ReactNode;
  submitLabel: string;
  className?: string;
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
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
