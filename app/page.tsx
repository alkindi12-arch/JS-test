import { HealthCheck } from './health-check';

export default function HomePage() {
  const ssrTime = new Date().toISOString();

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1rem' }}>
      <h1 style={{ fontSize: '1.75rem', margin: '0 0 0.5rem' }}>Hostinger Node Test</h1>
      <p style={{ margin: '0 0 1rem', color: '#475569' }}>
        If you see this title and the API JSON below, the Node runtime is serving Next.js correctly.
      </p>
      <p style={{ margin: '0 0 0.25rem' }}>
        <strong>SSR time (server):</strong> <code>{ssrTime}</code>
      </p>
      <p style={{ margin: 0 }}>
        <strong>Label:</strong>{' '}
        <code>{process.env.NEXT_PUBLIC_LABEL ?? '(NEXT_PUBLIC_LABEL not set)'}</code>
      </p>
      <HealthCheck />
      <section style={{ marginTop: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', margin: '0 0 0.5rem' }}>Quick links</h2>
        <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
          <li>
            <a href="/api/health">/api/health</a> (JSON)
          </li>
          <li>
            <a href="/api/ping">/api/ping</a> (plain text)
          </li>
        </ul>
      </section>
    </main>
  );
}
