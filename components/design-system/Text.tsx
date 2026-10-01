import type { ElementType, ReactNode } from 'react';
import { cx } from '@/lib/format';
import styles from './Text.module.css';

type Size = 'hero' | '3xl' | '2xl' | 'xl' | 'lg' | 'md' | 'sm' | 'xs';
type Tone = 'ink' | 'soft' | 'mute' | 'faint' | 'accent' | 'inverse';
type Weight = 'regular' | 'medium' | 'semibold' | 'bold';

const sizeClass: Record<Size, string> = {
  hero: styles.hero,
  '3xl': styles.t3xl,
  '2xl': styles.t2xl,
  xl: styles.txl,
  lg: styles.tlg,
  md: styles.tmd,
  sm: styles.tsm,
  xs: styles.txs,
};

export function Text({
  children,
  as,
  size = 'md',
  tone = 'ink',
  weight = 'regular',
  display,
  mono,
  eyebrow,
  className,
}: {
  children: ReactNode;
  as?: ElementType;
  size?: Size;
  tone?: Tone;
  weight?: Weight;
  display?: boolean;
  mono?: boolean;
  eyebrow?: boolean;
  className?: string;
}) {
  const Tag = (as ?? (display ? 'h2' : 'p')) as ElementType;
  return (
    <Tag
      className={cx(
        styles.text,
        display || eyebrow ? styles.display : styles.body,
        sizeClass[size],
        styles[tone],
        weight === 'medium' && styles.medium,
        weight === 'semibold' && styles.semibold,
        weight === 'bold' && styles.bold,
        mono && styles.mono,
        eyebrow && styles.eyebrow,
        className,
      )}
    >
      {children}
    </Tag>
  );
}
