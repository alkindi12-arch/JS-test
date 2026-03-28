'use client';

import { useEffect, useState } from 'react';

export function HealthCheck() {
  const [text, setText] = useState<string>('Loading…');
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/health', { cache: 'no-store' });
        const body = await res.text();
        if (cancelled) {
          return;
        }
        if (!res.ok) {
          setErr(`HTTP ${res.status}: ${body.slice(0, 200)}`);
          return;
        }
        setText(body);
        setErr(null);
      } catch (e) {
        if (!cancelled) {
          setErr(e instanceof Error ? e.message : String(e));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section style={{ marginTop: '1.5rem' }}>
      <h2 style={{ fontSize: '1.1rem', margin: '0 0 0.5rem' }}>Client fetch: GET /api/health</h2>
      {err ? (
        <pre
          style={{
            background: '#fef2f2',
            padding: '1rem',
            borderRadius: 8,
            overflow: 'auto',
            fontSize: '0.85rem',
          }}
        >
          {err}
        </pre>
      ) : (
        <pre
          style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            padding: '1rem',
            borderRadius: 8,
            overflow: 'auto',
            fontSize: '0.85rem',
          }}
        >
          {text}
        </pre>
      )}
    </section>
  );
}
