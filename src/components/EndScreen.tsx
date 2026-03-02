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
}

export default function EndScreen({ results, rounds, totalScore, stats, todayKey, players, mode, difficulty }: Props) {
  const [countdown, setCountdown] = useState('');
  const shareText = buildShareText(results, todayKey, totalScore, mode, difficulty);

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

  return (
    <div className="flex flex-col gap-6 w-full animate-scale-in">
      {/* Score hero */}
      <div className="text-center py-6 bg-gray-900 rounded-2xl border border-gray-800">
        <p className="text-sm text-gray-500 uppercase tracking-widest mb-1">Final Score</p>
        <p className="text-5xl font-black text-yellow-400">{totalScore.toLocaleString()}</p>
        <p className="text-gray-500 text-sm mt-1">out of 5,000 · {pct}%</p>

        {/* Mode + difficulty badge */}
        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-800 border border-gray-700 text-xs text-gray-400">
          <span>{mode === 'modern' ? '🆕' : '📜'}</span>
          <span>{GAME_MODES[mode].label}</span>
          <span className="text-gray-600">·</span>
          <span>{difficulty === 'timed' ? '⏱️' : '😌'}</span>
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

      {/* Round breakdown */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <p className="px-4 py-3 text-xs text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-800">
          Round Breakdown
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
                    : canon?.name ?? 'Unknown'}
                </p>
                <p className="text-xs text-gray-500">
                  {rounds[i]?.clue.team} · {rounds[i]?.clue.position} · {rounds[i]?.clue.season}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-sm font-bold ${r.correct ? 'text-yellow-400' : 'text-gray-600'}`}>
                  {r.correct ? `+${r.points.toLocaleString()}` : '0'} pts
                </p>
                {r.correct && (
                  <p className="text-xs text-gray-500">{(r.timeMs / 1000).toFixed(1)}s</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Share */}
      <ShareButton shareText={shareText} />

      {/* Next puzzle */}
      <div className="text-center text-sm text-gray-600">
        <p>Next puzzle in</p>
        <p className="font-mono text-white font-bold text-lg">{countdown}</p>
      </div>
    </div>
  );
}
