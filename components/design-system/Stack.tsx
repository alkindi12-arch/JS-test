import type { CSSProperties, ReactNode } from 'react';
import { cx } from '@/lib/format';
import styles from './Stack.module.css';

type Gap = 1 | 2 | 3 | 4 | 6 | 8;
type Align = 'start' | 'center' | 'end' | 'stretch';

export function Stack({
  children,
  direction = 'vertical',
  gap = 4,
  align,
  justify,
  wrap,
  className,
  style,
  as: Tag = 'div',
}: {
  children: ReactNode;
  direction?: 'vertical' | 'horizontal';
  gap?: Gap;
  align?: Align;
  justify?: 'between' | 'center';
  wrap?: boolean;
  className?: string;
  style?: CSSProperties;
  as?: 'div' | 'section' | 'ul' | 'nav' | 'header' | 'footer';
}) {
  return (
    <Tag
      className={cx(
        styles.stack,
        direction === 'vertical' ? styles.vertical : styles.horizontal,
        styles[`gap${gap}`],
        align === 'start' && styles.alignStart,
        align === 'center' && styles.alignCenter,
        align === 'end' && styles.alignEnd,
        align === 'stretch' && styles.alignStretch,
        justify === 'between' && styles.justifyBetween,
        justify === 'center' && styles.justifyCenter,
        wrap && styles.wrap,
        className,
      )}
      style={style}
    >
      {children}
    </Tag>
  );
}
