'use client';

import { useTransition } from 'react';
import { Button } from '@/components/design-system';
import { markActivityCompletedAction } from '@/lib/data/plant-writes';

export function MarkCompletedButton({
  activityId,
  disabled,
}: {
  activityId: string;
  disabled?: boolean;
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
          await markActivityCompletedAction(activityId);
        });
      }}
    >
      {pending ? 'Saving…' : 'Mark completed'}
    </Button>
  );
}
