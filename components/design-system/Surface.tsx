import Link from 'next/link';
import type { ReactNode } from 'react';
import { cx } from '@/lib/format';
import styles from './Surface.module.css';

type Pad = 0 | 3 | 4 | 5 | 6;

export function Surface({
  children,
  pad = 5,
  variant = 'default',
  href,
  className,
}: {
  children: ReactNode;
  pad?: Pad;
  variant?: 'default' | 'flat' | 'inset';
  href?: string;
  className?: string;
}) {
  const classes = cx(
    styles.surface,
    variant === 'flat' && styles.flat,
    variant === 'inset' && styles.inset,
    styles[`pad${pad}`],
    href && styles.interactive,
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return <div className={classes}>{children}</div>;
}
