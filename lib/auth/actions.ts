'use server';

import { redirect } from 'next/navigation';
import { authenticateUser } from '@/lib/auth/users';
import { clearSessionCookie, setSessionCookie } from '@/lib/auth/session';

export type LoginState = { ok: boolean; error?: string };

export async function loginAction(
  _prev: LoginState,
  form: FormData,
): Promise<LoginState> {
  const email = String(form.get('email') ?? '').trim().toLowerCase();
  const password = String(form.get('password') ?? '');
  const next = String(form.get('next') ?? '/lineage/dashboard');

  if (!email || !password) {
    return { ok: false, error: 'Email and password are required.' };
  }

  try {
    const user = await authenticateUser(email, password);
    if (!user) return { ok: false, error: 'Invalid email or password.' };
    await setSessionCookie(user);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Login failed.';
    return { ok: false, error: message };
  }

  redirect(next.startsWith('/') ? next : '/lineage/dashboard');
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect('/login');
}
