'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Icon } from '@/components/design-system/Icon';
import { Text } from '@/components/design-system/Text';
import { adminNav, primaryNav } from '@/lib/navigation';
import { cx } from '@/lib/format';
import styles from './AppShell.module.css';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const nav = (
    <>
      <div className={styles.brandBlock}>
        <Link href="/dashboard" className={styles.brand}>
          <span className={styles.brandMark} aria-hidden />
          <span className={styles.brandText}>
            <span className={styles.brandName}>Lineage</span>
            <span className={styles.brandTag}>Equipment History</span>
          </span>
        </Link>
      </div>

      <nav className={styles.nav} aria-label="Primary">
        {primaryNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cx(styles.navItem, isActive(item.href) && styles.navItemActive)}
            aria-current={isActive(item.href) ? 'page' : undefined}
          >
            <Icon name={item.icon} />
            <span className={styles.navLabel}>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className={styles.navFooter}>
        {adminNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cx(styles.navItem, isActive(item.href) && styles.navItemActive)}
          >
            <Icon name={item.icon} />
            <span className={styles.navLabel}>{item.label}</span>
          </Link>
        ))}
        <div className={styles.userChip}>
          <span className={styles.avatar} aria-hidden>
            SK
          </span>
          <div className={styles.userMeta}>
            <Text size="sm" weight="semibold" tone="inverse">
              Superv. Khan
            </Text>
            <Text size="xs" className={styles.userRole}>
              Area A01
            </Text>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar} aria-label="Application sidebar">
        {nav}
      </aside>

      {mobileOpen ? (
        <div className={styles.drawerRoot}>
          <button
            type="button"
            className={styles.backdrop}
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          />
          <aside className={styles.drawer} role="dialog" aria-modal="true" aria-label="Menu">
            <button
              type="button"
              className={styles.drawerClose}
              onClick={() => setMobileOpen(false)}
              aria-label="Close"
            >
              <Icon name="close" />
            </button>
            {nav}
          </aside>
        </div>
      ) : null}

      <div className={styles.mainColumn}>
        <header className={styles.topbar}>
          <button
            type="button"
            className={styles.menuBtn}
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Icon name="menu" />
          </button>
          <div className={styles.topbarBrand}>
            <span className={styles.brandMarkSmall} aria-hidden />
            <Text as="span" display size="lg" weight="bold">
              Lineage
            </Text>
          </div>
          <div className={styles.searchWrap}>
            <Icon name="search" size={18} className={styles.searchIcon} />
            <input
              className={styles.search}
              type="search"
              placeholder="Search tag, activity, unit…"
              aria-label="Search"
            />
          </div>
          <div className={styles.topbarActions}>
            <span className={styles.contextChip}>Plant · Live</span>
          </div>
        </header>

        <main className={styles.content}>
          <div className={cx(styles.contentInner, 'atmosphere-grid')}>{children}</div>
        </main>
      </div>

      <nav className={styles.bottomNav} aria-label="Mobile primary">
        {primaryNav.slice(0, 4).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cx(styles.bottomItem, isActive(item.href) && styles.bottomItemActive)}
          >
            <Icon name={item.icon} size={22} />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
