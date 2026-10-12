'use client';

import { useTransition } from 'react';
import { Button } from '@/components/design-system';
import { reopenActivityAction } from '@/lib/data/plant-writes';

export function ReopenActivityButton({
  activityId,
  disabled,
  label = 'Revert to In Progress',
}: {
  activityId: string;
  disabled?: boolean;
  label?: string;
}) {
  const [pending, start] = useTransition();

  return (
    <Button
      type="button"
      variant="secondary"
      block
      disabled={disabled || pending}
      onClick={() => {
        start(async () => {
          await reopenActivityAction(activityId);
        });
      }}
    >
      {pending ? 'Reopening…' : label}
    </Button>
  );
}
