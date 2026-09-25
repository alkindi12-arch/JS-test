import type { ReactNode } from 'react';
import { cx } from '@/lib/format';
import styles from './Badge.module.css';

type Tone = 'neutral' | 'accent' | 'signal' | 'danger' | 'ok';

export function Badge({
  children,
  tone = 'neutral',
  dot,
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span className={cx(styles.badge, styles[tone], className)}>
      {dot ? <span className={styles.dot} aria-hidden /> : null}
      {children}
    </span>
  );
}
