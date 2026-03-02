export const MAX_TIME_MS = 15_000;
export const MAX_POINTS_PER_ROUND = 1000;

// Linear decay: 1000 at 0ms, 0 at 15000ms
export function calculatePoints(elapsedMs: number): number {
  if (elapsedMs >= MAX_TIME_MS) return 0;
  return Math.round(MAX_POINTS_PER_ROUND * (1 - elapsedMs / MAX_TIME_MS));
}

export type SpeedTier = 'fast' | 'mid' | 'slow' | 'wrong' | 'timeout';

export function getSpeedTier(correct: boolean, timeMs: number): SpeedTier {
  if (!correct && timeMs >= MAX_TIME_MS) return 'timeout';
  if (!correct) return 'wrong';
  if (timeMs < 5_000) return 'fast';
  if (timeMs < 10_000) return 'mid';
  return 'slow';
}
