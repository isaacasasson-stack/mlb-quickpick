import { useState, useEffect, useRef, useCallback } from 'react';
import { MAX_TIME_MS } from '../utils/scoring';

export function useTimer(active: boolean, onExpire: () => void) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const onExpireRef = useRef(onExpire);

  // Keep callback ref fresh without re-triggering the effect
  useEffect(() => {
    onExpireRef.current = onExpire;
  });

  useEffect(() => {
    if (!active) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    startTimeRef.current = Date.now();
    setElapsedMs(0);

    const tick = () => {
      if (!startTimeRef.current) return;
      const elapsed = Date.now() - startTimeRef.current;
      if (elapsed >= MAX_TIME_MS) {
        setElapsedMs(MAX_TIME_MS);
        onExpireRef.current();
      } else {
        setElapsedMs(elapsed);
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [active]);

  // Read the true elapsed time at the moment of submission (not stale state)
  const getElapsed = useCallback((): number => {
    if (!startTimeRef.current) return 0;
    return Math.min(Date.now() - startTimeRef.current, MAX_TIME_MS);
  }, []);

  const remainingPct = Math.max(0, 1 - elapsedMs / MAX_TIME_MS);
  const remainingSecs = Math.ceil((MAX_TIME_MS - elapsedMs) / 1000);

  return { elapsedMs, remainingPct, remainingSecs, getElapsed };
}
