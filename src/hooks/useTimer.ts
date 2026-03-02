import { useState, useEffect, useRef, useCallback } from 'react';
import { MAX_TIME_MS } from '../utils/scoring';

export function useTimer(active: boolean, onExpire: () => void) {
  // Only use React state for the coarse 1-second display (low frequency)
  const [remainingSecs, setRemainingSecs] = useState(Math.ceil(MAX_TIME_MS / 1000));
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const onExpireRef = useRef(onExpire);
  // Refs for direct DOM mutation — bypasses React render cycle for smooth animation
  const barRef = useRef<HTMLDivElement | null>(null);
  const elapsedMsRef = useRef(0);

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
    elapsedMsRef.current = 0;
    setRemainingSecs(Math.ceil(MAX_TIME_MS / 1000));

    // Reset bar to full immediately
    if (barRef.current) {
      barRef.current.style.transform = 'scaleX(1)';
      barRef.current.style.backgroundColor = 'rgb(34 197 94)'; // green-500
    }

    const tick = () => {
      if (!startTimeRef.current) return;
      const elapsed = Date.now() - startTimeRef.current;
      elapsedMsRef.current = elapsed;

      if (elapsed >= MAX_TIME_MS) {
        elapsedMsRef.current = MAX_TIME_MS;
        // Update bar to zero directly
        if (barRef.current) {
          barRef.current.style.transform = 'scaleX(0)';
        }
        setRemainingSecs(0);
        onExpireRef.current();
      } else {
        const pct = 1 - elapsed / MAX_TIME_MS;
        const secs = Math.ceil((MAX_TIME_MS - elapsed) / 1000);

        // Mutate DOM directly — no React re-render needed for the bar
        if (barRef.current) {
          barRef.current.style.transform = `scaleX(${pct})`;
          // Update color based on thresholds
          if (pct < 0.33) {
            barRef.current.style.backgroundColor = 'rgb(239 68 68)'; // red-500
          } else if (pct < 0.66) {
            barRef.current.style.backgroundColor = 'rgb(250 204 21)'; // yellow-400
          } else {
            barRef.current.style.backgroundColor = 'rgb(34 197 94)'; // green-500
          }
        }

        // Only trigger a React re-render when the integer second changes
        setRemainingSecs(prev => prev !== secs ? secs : prev);

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

  // Read the true elapsed time at the moment of submission
  const getElapsed = useCallback((): number => {
    if (!startTimeRef.current) return 0;
    return Math.min(Date.now() - startTimeRef.current, MAX_TIME_MS);
  }, []);

  return { remainingSecs, barRef, getElapsed };
}
