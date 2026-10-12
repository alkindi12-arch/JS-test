'use client';

import { useEffect } from 'react';
import { Button, Stack, Text } from '@/components/design-system';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const mismatch =
    error.name === 'UnrecognizedActionError' ||
    error.message.includes('was not found on the server') ||
    error.message.includes('Failed to find Server Action');

  useEffect(() => {
    if (!mismatch) return;
    const key = 'lineage_error_boundary_reload';
    try {
      if (sessionStorage.getItem(key) === '1') return;
      sessionStorage.setItem(key, '1');
      window.location.reload();
    } catch {
      window.location.reload();
    }
  }, [mismatch]);

  return (
    <main style={{ padding: '2rem', maxWidth: 480, margin: '4rem auto' }}>
      <Stack gap={4}>
        <Text as="h1" display size="xl">
          Something went wrong
        </Text>
        <Text size="sm" tone="mute">
          {mismatch
            ? 'The app was updated while this page was open. Reloading to sync…'
            : error.message || 'Unexpected client error.'}
        </Text>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Button type="button" onClick={() => window.location.reload()}>
            Reload page
          </Button>
          {!mismatch ? (
            <Button type="button" variant="secondary" onClick={reset}>
              Try again
            </Button>
          ) : null}
        </div>
      </Stack>
    </main>
  );
}
