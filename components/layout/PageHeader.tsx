import Link from 'next/link';
import type { ReactNode } from 'react';
import { Text } from '@/components/design-system/Text';
import styles from './PageHeader.module.css';

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  breadcrumbs,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}) {
  return (
    <header className={`${styles.header} animate-fade-up`}>
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <nav className={styles.crumbs} aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, i) => (
            <span key={`${crumb.label}-${i}`} style={{ display: 'contents' }}>
              {i > 0 ? <span className={styles.sep}>/</span> : null}
              {crumb.href ? (
                <Link href={crumb.href} className={styles.crumbLink}>
                  {crumb.label}
                </Link>
              ) : (
                <span aria-current="page">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      ) : null}
      <div className={styles.row}>
        <div className={styles.titles}>
          {eyebrow ? (
            <Text eyebrow as="p">
              {eyebrow}
            </Text>
          ) : null}
          <Text as="h1" display size="hero">
            {title}
          </Text>
          {description ? (
            <Text tone="mute" size="md">
              {description}
            </Text>
          ) : null}
        </div>
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </div>
    </header>
  );
}
