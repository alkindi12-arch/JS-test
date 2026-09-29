'use client';

import { Button } from '@/components/design-system';

export function PrintReportButton() {
  return (
    <Button type="button" variant="secondary" onClick={() => window.print()}>
      Print / Save PDF
    </Button>
  );
}
