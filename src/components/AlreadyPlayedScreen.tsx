import { useEffect, useState } from 'react';
import type { PlayerStats, RoundResult, PuzzleRound } from '../types';
import { getSpeedTier } from '../utils/scoring';
import { buildShareText } from '../utils/share';
import ShareButton from './ShareButton';

const EMOJI: Record<ReturnType<typeof getSpeedTier>, string> = {
  fast: '🟩', mid: '🟨', slow: '🟧', wrong: '🟥', timeout: '⬛',
};

interface Props {
  stats: PlayerStats;
  todayKey: string;
  rounds: PuzzleRound[];
}

export default function AlreadyPlayedScreen({ stats, todayKey }: Props) {
  const [countdown, setCountdown] = useState('');
  const todayRecord = stats.history[todayKey];

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

  if (!todayRecord) {
    return (
      <div className="flex flex-col items-center gap-4 text-center py-12">
        <span className="text-5xl">⚾</span>
        <p className="text-gray-400">You've already played today!</p>
        <p className="text-sm text-gray-600">Come back tomorrow for a new challenge.</p>
        <p className="font-mono text-white font-bold text-lg">{countdown}</p>
      </div>
    );
  }

  // Build full RoundResult-like objects from stored data
  const fakeResults: RoundResult[] = todayRecord.results.map((r, i) => ({
    roundIndex: i,
    answeredId: null,
    answeredName: null,
    correct: r.correct,
    timeMs: r.timeMs,
    points: r.points,
  }));

  const shareText = buildShareText(fakeResults, todayKey, todayRecord.totalScore, 'modern');

  return (
    <div className="flex flex-col gap-6 w-full animate-scale-in">
      <div className="text-center py-6 bg-gray-900 rounded-2xl border border-gray-800">
        <p className="text-sm text-gray-500 uppercase tracking-widest mb-1">Today's Score</p>
        <p className="text-5xl font-black text-yellow-400">{todayRecord.totalScore.toLocaleString()}</p>
        <div className="flex justify-center gap-1 mt-4 text-2xl">
          {fakeResults.map(r => (
            <span key={r.roundIndex}>{EMOJI[getSpeedTier(r.correct, r.timeMs)]}</span>
          ))}
        </div>
        {stats.streak > 0 && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="text-2xl">🔥</span>
            <span className="font-bold text-orange-400">{stats.streak}-day streak</span>
          </div>
        )}
      </div>

      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4 text-center">
        <p className="text-sm text-gray-400">You've already played today.</p>
        <p className="text-sm text-gray-600 mt-1">Next puzzle in</p>
        <p className="font-mono text-white font-bold text-xl mt-1">{countdown}</p>
      </div>

      <ShareButton shareText={shareText} />
    </div>
  );
}
