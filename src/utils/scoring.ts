export const MAX_TIME_MS = 20_000;
export const MAX_POINTS_PER_ROUND = 1000;
// Score doesn't decay until this many ms have elapsed (grace period to read + type)
const SCORE_GRACE_MS = 5_000;

// Linear decay: 1000 pts for answers within grace period, then decays to 0 at MAX_TIME_MS
export function calculatePoints(elapsedMs: number): number {
  if (elapsedMs >= MAX_TIME_MS) return 0;
  const decayMs = Math.max(0, elapsedMs - SCORE_GRACE_MS);
  const decayWindow = MAX_TIME_MS - SCORE_GRACE_MS;
  return Math.round(MAX_POINTS_PER_ROUND * (1 - decayMs / decayWindow));
}

export type SpeedTier = 'fast' | 'mid' | 'slow' | 'wrong' | 'timeout';

export function getSpeedTier(correct: boolean, timeMs: number): SpeedTier {
  if (!correct && timeMs >= MAX_TIME_MS) return 'timeout';
  if (!correct) return 'wrong';
  if (timeMs < 7_000) return 'fast';
  if (timeMs < 13_000) return 'mid';
  return 'slow';
}
