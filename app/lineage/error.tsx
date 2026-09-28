'use client';

import { useEffect } from 'react';
import { Button, Stack, Text } from '@/components/design-system';

export default function LineageError({
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
    const key = 'lineage_lineage_error_reload';
    try {
      if (sessionStorage.getItem(key) === '1') return;
      sessionStorage.setItem(key, '1');
      window.location.reload();
    } catch {
      window.location.reload();
    }
  }, [mismatch]);

  return (
    <Stack gap={4}>
      <Text as="h1" display size="xl">
        Page failed to load
      </Text>
      <Text size="sm" tone="mute">
        {mismatch
          ? 'Lineage was redeployed. Reloading this page…'
          : error.message || 'Unexpected error.'}
      </Text>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <Button type="button" onClick={() => window.location.reload()}>
          Reload
        </Button>
        {!mismatch ? (
          <Button type="button" variant="secondary" onClick={reset}>
            Try again
          </Button>
        ) : null}
      </div>
    </Stack>
  );
}
