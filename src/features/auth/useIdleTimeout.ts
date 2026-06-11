import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Auto-logout-on-inactivity timer. Watches user activity (pointer, keyboard,
 * scroll, touch) and, after `idleMs` of silence, fires `onTimeout`. The final
 * `warnMs` of that window are surfaced via `warning`/`remainingMs` so the UI can
 * show a "you're about to be signed out" countdown the user can cancel.
 *
 * Intended for staff/admin sessions only — customer storefront login stays
 * persistent on purpose.
 */
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'wheel'] as const;

export interface IdleTimeoutState {
  /** True once we're inside the final warning window before logout. */
  warning: boolean;
  /** Milliseconds left until automatic logout (only meaningful while `warning`). */
  remainingMs: number;
  /** Dismiss the warning and restart the idle clock. */
  stayActive: () => void;
}

interface Options {
  /** Total inactivity before logout fires. */
  idleMs: number;
  /** How long before logout to start showing the warning. */
  warnMs: number;
  onTimeout: () => void;
}

export function useIdleTimeout({ idleMs, warnMs, onTimeout }: Options): IdleTimeoutState {
  const [warning, setWarning] = useState(false);
  const [remainingMs, setRemainingMs] = useState(warnMs);

  const warnTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const logoutTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const ticker = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const lastActivity = useRef(0);
  // Keep the latest callback without re-subscribing listeners on every render.
  const onTimeoutRef = useRef(onTimeout);
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  const clearTimers = useCallback(() => {
    clearTimeout(warnTimer.current);
    clearTimeout(logoutTimer.current);
    clearInterval(ticker.current);
  }, []);

  const logout = useCallback(() => {
    clearTimers();
    setWarning(false);
    onTimeoutRef.current();
  }, [clearTimers]);

  const beginWarning = useCallback(() => {
    setWarning(true);
    setRemainingMs(warnMs);
    const deadline = Date.now() + warnMs;
    logoutTimer.current = setTimeout(logout, warnMs);
    ticker.current = setInterval(() => {
      setRemainingMs(Math.max(0, deadline - Date.now()));
    }, 1000);
  }, [warnMs, logout]);

  // Reschedule the idle clock without touching React state — safe to call
  // synchronously from the effect body.
  const arm = useCallback(() => {
    clearTimers();
    lastActivity.current = Date.now();
    warnTimer.current = setTimeout(beginWarning, Math.max(0, idleMs - warnMs));
  }, [clearTimers, beginWarning, idleMs, warnMs]);

  const restart = useCallback(() => {
    setWarning(false);
    arm();
  }, [arm]);

  useEffect(() => {
    arm();

    let throttle = 0;
    const onActivity = () => {
      const now = Date.now();
      if (now - throttle < 1000) return; // mousemove fires constantly — sample at most 1/s
      throttle = now;
      restart();
    };
    // Background tabs throttle timers; re-check the real elapsed time on return.
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      if (Date.now() - lastActivity.current >= idleMs) logout();
      else restart();
    };

    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearTimers();
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, onActivity));
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [arm, restart, clearTimers, logout, idleMs]);

  return { warning, remainingMs, stayActive: restart };
}
