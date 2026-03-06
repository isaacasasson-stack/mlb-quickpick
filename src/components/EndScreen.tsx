import { useEffect, useState } from 'react';
import type { RoundResult, PlayerStats, PuzzleRound, MLBPlayer, GameMode, GameDifficulty } from '../types';
import { GAME_MODES, GAME_DIFFICULTIES } from '../types';
import { getSpeedTier } from '../utils/scoring';
import { buildShareText } from '../utils/share';
import ShareButton from './ShareButton';
import { getCanonicalPlayer } from '../utils/puzzle';

const EMOJI: Record<ReturnType<typeof getSpeedTier>, string> = {
  fast: '🟩', mid: '🟨', slow: '🟧', wrong: '🟥', timeout: '⬛',
};

interface Props {
  results: RoundResult[];
  rounds: PuzzleRound[];
  totalScore: number;
  stats: PlayerStats;
  todayKey: string;
  players: MLBPlayer[];
  mode: GameMode;
  difficulty: GameDifficulty;
  onPlayOtherModes: () => void;
}

export default function EndScreen({ results, rounds, totalScore, stats, todayKey, players, mode, difficulty, onPlayOtherModes }: Props) {
  const [countdown, setCountdown] = useState('');
  const isSurvival = difficulty === 'survival';
  const survivalStreak = results.filter(r => r.correct).length;

  // Countdown to midnight (next puzzle)
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const maxScore = results.length * 1000;
  const pct = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  const difficultyIcon = difficulty === 'timed' ? '⏱️' : difficulty === 'relaxed' ? '😌' : '❤️';

  // Estimated percentile based on a realistic timed-mode score distribution.
  // Breakpoints derived from expected scoring curve: most players score 1000–3000.
  function estimatePercentile(score: number): number {
    const breakpoints: [number, number][] = [
      [0, 1], [500, 5], [1000, 12], [1500, 25], [2000, 42],
      [2500, 58], [3000, 72], [3500, 83], [4000, 91], [4500, 96], [5000, 99],
    ];
    for (let i = breakpoints.length - 1; i >= 0; i--) {
      if (score >= breakpoints[i][0]) {
        if (i === breakpoints.length - 1) return breakpoints[i][1];
        const [s0, p0] = breakpoints[i];
        const [s1, p1] = breakpoints[i + 1];
        return Math.round(p0 + (p1 - p0) * ((score - s0) / (s1 - s0)));
      }
    }
    return 1;
  }
  const scorePercentile = estimatePercentile(totalScore);
  const shareText = buildShareText(results, todayKey, totalScore, mode, difficulty, isSurvival ? undefined : scorePercentile);

  return (
    <div className="flex flex-col gap-6 w-full animate-scale-in">
      {/* Score hero */}
      <div className="text-center py-6 bg-gray-900 rounded-2xl border border-gray-800">
        {isSurvival ? (
          <>
            <p className="text-sm text-gray-500 uppercase tracking-widest mb-1">Survival Streak</p>
            <p className="text-5xl font-black text-red-400">{survivalStreak}</p>
            <p className="text-gray-500 text-sm mt-1">
              {survivalStreak === 0 ? 'Better luck next time!' : `${survivalStreak} in a row`}
            </p>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-500 uppercase tracking-widest mb-1">Final Score</p>
            <p className="text-5xl font-black text-yellow-400">{totalScore.toLocaleString()}</p>
            <p className="text-gray-500 text-sm mt-1">out of 5,000 · {pct}%</p>
            <p className="text-blue-400 text-sm mt-1 font-semibold">Better than ~{scorePercentile}% of players</p>
          </>
        )}

        {/* Mode + difficulty badge */}
        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-800 border border-gray-700 text-xs text-gray-400">
          <span>{mode === 'modern' ? '🆕' : '📜'}</span>
          <span>{GAME_MODES[mode].label}</span>
          <span className="text-gray-600">·</span>
          <span>{difficultyIcon}</span>
          <span>{GAME_DIFFICULTIES[difficulty].label}</span>
        </div>

        {/* Emoji row */}
        <div className="flex justify-center gap-1 mt-4 text-2xl">
          {results.map(r => (
            <span key={r.roundIndex}>{EMOJI[getSpeedTier(r.correct, r.timeMs)]}</span>
          ))}
        </div>

        {/* Streak */}
        {stats.streak > 0 && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="text-2xl">🔥</span>
            <span className="font-bold text-orange-400">{stats.streak}-day streak</span>
          </div>
        )}
      </div>

      {/* Round breakdown — survival shows all answered rounds, timed/relaxed shows fixed 5 */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <p className="px-4 py-3 text-xs text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-800">
          {isSurvival ? 'Answered Rounds' : 'Round Breakdown'}
        </p>
        {results.map((r, i) => {
          const canon = getCanonicalPlayer(rounds[i]?.answerId ?? '', players);
          const tier = getSpeedTier(r.correct, r.timeMs);
          return (
            <div
              key={r.roundIndex}
              className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 last:border-0"
            >
              <span className="text-xl">{EMOJI[tier]}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">
                  {r.correct
                    ? r.answeredName
                    : r.answeredName
                      ? <span className="text-red-400 line-through">{r.answeredName}</span>
                      : canon?.name ?? 'Unknown'}
                </p>
                <p className="text-xs text-gray-500">
                  {rounds[i]?.clue.team} · {rounds[i]?.clue.position} · {rounds[i]?.clue.season}
                </p>
              </div>
              <div className="text-right shrink-0">
                {isSurvival ? (
                  <p className={`text-sm font-bold ${r.correct ? 'text-green-400' : 'text-red-400'}`}>
                    {r.correct ? '✓' : '✗'}
                  </p>
                ) : (
                  <>
                    <p className={`text-sm font-bold ${r.correct ? 'text-yellow-400' : 'text-gray-600'}`}>
                      {r.correct ? `+${r.points.toLocaleString()}` : '0'} pts
                    </p>
                    {r.correct && (
                      <p className="text-xs text-gray-500">{(r.timeMs / 1000).toFixed(1)}s</p>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Share */}
      <ShareButton shareText={shareText} />

      {/* Play other modes */}
      <button
        onClick={onPlayOtherModes}
        className="w-full py-3 rounded-xl font-bold text-base border border-gray-700 text-gray-300 hover:border-gray-500 hover:text-white transition-all duration-150 active:scale-95"
      >
        Play Other Modes
      </button>

      {/* Follow + Tip jar */}
      <div className="grid grid-cols-2 gap-3">
        <a
          href="https://x.com/QuickPick_Game"
          target="_blank"
          rel="noopener noreferrer"
          className="py-3 rounded-xl font-bold text-base flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 active:scale-95 text-white border border-gray-700 transition-all duration-150"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
          Follow
        </a>
        <a
          href="https://buymeacoffee.com/mlbquickpick"
          target="_blank"
          rel="noopener noreferrer"
          className="py-3 rounded-xl font-bold text-base flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-400 active:scale-95 text-gray-900 transition-all duration-150"
        >
          <span>☕</span> Support
        </a>
      </div>

      {/* Next puzzle */}
      <div className="text-center text-sm text-gray-600">
        <p>Next puzzle in</p>
        <p className="font-mono text-white font-bold text-lg">{countdown}</p>
      </div>
    </div>
  );
}
