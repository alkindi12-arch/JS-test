import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Surface, Text } from '@/components/design-system';
import { LoginForm } from './login-form';
import styles from './login.module.css';

export const metadata: Metadata = {
  title: 'Sign in',
};

export default function LoginPage() {
  return (
    <div className={`atmosphere-grid ${styles.page}`}>
      <Surface pad={6} className={styles.card}>
        <div className={styles.brand}>
          <Text eyebrow as="p">
            alkinda.com
          </Text>
          <Text as="h1" display size="2xl">
            Sign in to Lineage
          </Text>
          <Text tone="mute" size="sm">
            Equipment history for your personal Hostinger platform.
          </Text>
        </div>
        <Suspense fallback={<Text tone="mute">Loading…</Text>}>
          <LoginForm />
        </Suspense>
      </Surface>
    </div>
  );
}
