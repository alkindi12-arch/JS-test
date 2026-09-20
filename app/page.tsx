import Link from 'next/link';
import { Badge, Grid, Stack, Surface, Text } from '@/components/design-system';
import { hostedApps, portalConfig } from '@/lib/apps/registry';
import styles from './page.module.css';

function statusTone(status: string) {
  if (status === 'live') return 'ok' as const;
  if (status === 'draft') return 'accent' as const;
  return 'neutral' as const;
}

export default function PortalHomePage() {
  return (
    <div className={`atmosphere-grid ${styles.portal}`}>
      <header className={`${styles.hero} animate-fade-up`}>
        <Text eyebrow as="p">
          {portalConfig.domainHint}
        </Text>
        <Text as="h1" display size="hero">
          {portalConfig.name}
        </Text>
        <Text tone="mute" size="lg" className={styles.lede}>
          One Hostinger domain. Multiple apps. Open Lineage or add the next tool without
          redeploying a separate site.
        </Text>
      </header>

      <section className="animate-fade-up stagger-2" aria-label="Hosted applications">
        <Stack gap={4}>
          <Text as="h2" display size="xl">
            Applications
          </Text>
          <Grid columns={3} gap={4}>
            {hostedApps.map((app) => {
              const card = (
                <Surface
                  key={app.id}
                  pad={5}
                  href={app.status === 'planned' ? undefined : app.href}
                  className={styles.appCard}
                >
                  <Stack gap={3}>
                    <div
                      className={styles.accentBar}
                      style={{ background: app.accent }}
                      aria-hidden
                    />
                    <Stack direction="horizontal" justify="between" align="center" wrap gap={2}>
                      <Text as="h3" display size="lg">
                        {app.name}
                      </Text>
                      <Badge tone={statusTone(app.status)}>{app.status}</Badge>
                    </Stack>
                    <Text size="sm" tone="mute">
                      {app.tagline}
                    </Text>
                    {app.status !== 'planned' ? (
                      <Text size="sm" weight="semibold" tone="accent">
                        Open app →
                      </Text>
                    ) : (
                      <Text size="sm" tone="faint">
                        Coming soon
                      </Text>
                    )}
                  </Stack>
                </Surface>
              );

              return app.status === 'planned' ? (
                <div key={app.id} className={styles.planned}>
                  {card}
                </div>
              ) : (
                card
              );
            })}
          </Grid>
        </Stack>
      </section>

      <footer className={`${styles.footer} animate-fade-in stagger-3`}>
        <Text size="sm" tone="mute">
          Hosted on Hostinger Node.js · MySQL ready ·{' '}
          <Link href="/api/health" className={styles.health}>
            Health check
          </Link>
        </Text>
      </footer>
    </div>
  );
}
