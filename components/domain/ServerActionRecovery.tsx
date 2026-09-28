'use client';

import { useEffect } from 'react';

const RELOAD_KEY = 'lineage_action_mismatch_reload';

function isActionMismatch(err: unknown): boolean {
  if (!err) return false;
  const name = typeof err === 'object' && err && 'name' in err ? String((err as { name: unknown }).name) : '';
  const message =
    typeof err === 'object' && err && 'message' in err
      ? String((err as { message: unknown }).message)
      : String(err);
  return (
    name === 'UnrecognizedActionError' ||
    message.includes('UnrecognizedActionError') ||
    message.includes('was not found on the server') ||
    message.includes('Failed to find Server Action')
  );
}

/** After a Hostinger redeploy, open tabs can hold stale Server Action IDs. Reload once. */
export function ServerActionRecovery() {
  useEffect(() => {
    function maybeReload(err: unknown) {
      if (!isActionMismatch(err)) return;
      try {
        if (sessionStorage.getItem(RELOAD_KEY) === '1') return;
        sessionStorage.setItem(RELOAD_KEY, '1');
      } catch {
        /* private mode */
      }
      window.location.reload();
    }

    function onError(ev: ErrorEvent) {
      maybeReload(ev.error ?? ev.message);
    }
    function onRejection(ev: PromiseRejectionEvent) {
      maybeReload(ev.reason);
    }

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);

    // Clear the one-shot guard shortly after a successful load.
    const t = window.setTimeout(() => {
      try {
        sessionStorage.removeItem(RELOAD_KEY);
      } catch {
        /* ignore */
      }
    }, 8000);

    return () => {
      window.clearTimeout(t);
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  return null;
}
