import { cx } from '@/lib/format';
import styles from './KpiMetric.module.css';

type Tone = 'default' | 'danger' | 'signal' | 'accent' | 'ok';

export function KpiMetric({
  label,
  value,
  hint,
  tone = 'default',
  className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: Tone;
  className?: string;
}) {
  return (
    <div className={cx(styles.metric, tone !== 'default' && styles[tone], className)}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{value}</span>
      {hint ? <span className={styles.hint}>{hint}</span> : null}
    </div>
  );
}
