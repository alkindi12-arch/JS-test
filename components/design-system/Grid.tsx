import type { ReactNode } from 'react';
import { cx } from '@/lib/format';
import styles from './Grid.module.css';

export function Grid({
  children,
  columns = 2,
  gap = 4,
  className,
}: {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: 3 | 4 | 6;
  className?: string;
}) {
  return (
    <div
      className={cx(
        styles.grid,
        styles[`cols${columns}`],
        styles[`gap${gap}`],
        className,
      )}
    >
      {children}
    </div>
  );
}
