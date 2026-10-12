'use client';

import { useEffect } from 'react';
import { Button } from '@/components/design-system';

export function PrintReportButton({ fileName }: { fileName: string }) {
  // Set title on mount so Ctrl/Cmd+P uses the same name.
  useEffect(() => {
    if (!fileName) return;
    const previous = document.title;
    document.title = fileName;
    return () => {
      document.title = previous;
    };
  }, [fileName]);

  return (
    <Button
      type="button"
      variant="secondary"
      onClick={() => {
        const previous = document.title;
        if (fileName) document.title = fileName;
        const restore = () => {
          document.title = previous;
          window.removeEventListener('afterprint', restore);
        };
        window.addEventListener('afterprint', restore);
        window.print();
        // Fallback if afterprint is delayed/skipped
        window.setTimeout(restore, 2000);
      }}
    >
      Print / Save PDF
    </Button>
  );
}
