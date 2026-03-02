import type { RoundResult, GameMode, GameDifficulty } from '../types';
import { GAME_MODES, GAME_DIFFICULTIES } from '../types';
import { getSpeedTier } from './scoring';

const EMOJI: Record<ReturnType<typeof getSpeedTier>, string> = {
  fast:    '🟩',
  mid:     '🟨',
  slow:    '🟧',
  wrong:   '🟥',
  timeout: '⬛',
};

export function buildShareText(
  results: RoundResult[],
  dateKey: string,
  totalScore: number,
  mode: GameMode,
  difficulty: GameDifficulty = 'timed'
): string {
  const grid = results.map(r => EMOJI[getSpeedTier(r.correct, r.timeMs)]).join('');
  const correctCount = results.filter(r => r.correct).length;
  const modeLabel = GAME_MODES[mode].label;
  const diffLabel = GAME_DIFFICULTIES[difficulty].label;

  return [
    `⚾ MLB QuickPick ${dateKey}`,
    `${modeLabel} · ${diffLabel}`,
    `${grid} ${correctCount}/5`,
    `Score: ${totalScore.toLocaleString()}/5,000`,
    `Play at: mlb-quickpick.vercel.app`,
  ].join('\n');
}

export async function shareResults(text: string): Promise<'web_share' | 'clipboard'> {
  if (navigator.share) {
    try {
      await navigator.share({ title: 'MLB QuickPick', text });
      return 'web_share';
    } catch {
      // user cancelled or browser rejected — fall through
    }
  }
  await navigator.clipboard.writeText(text);
  return 'clipboard';
}
