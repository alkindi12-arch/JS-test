'use client';

import { useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button, Stack, Text } from '@/components/design-system';
import { loginAction, type LoginState } from '@/lib/auth/actions';
import styles from './login.module.css';

const initial: LoginState = { ok: true };

export function LoginForm() {
  const params = useSearchParams();
  const next = params.get('next') || '/lineage/dashboard';
  const [state, action, pending] = useActionState(loginAction, initial);

  return (
    <form action={action} className={styles.form}>
      <input type="hidden" name="next" value={next} />
      <Stack gap={4}>
        {state.error ? (
          <p className={styles.error} role="alert">
            {state.error}
          </p>
        ) : null}
        <label className={styles.field}>
          <span>Email</span>
          <input
            name="email"
            type="email"
            autoComplete="username"
            required
            placeholder="you@alkinda.com"
          />
        </label>
        <label className={styles.field}>
          <span>Password</span>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </label>
        <Button type="submit" block disabled={pending}>
          {pending ? 'Signing in…' : 'Sign in'}
        </Button>
        <Text size="xs" tone="faint">
          Lineage requires a signed-in user. Portal home stays public.
        </Text>
      </Stack>
    </form>
  );
}
