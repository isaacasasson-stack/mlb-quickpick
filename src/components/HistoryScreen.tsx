import type { PlayerStats } from '../types';
import { GAME_MODES, GAME_DIFFICULTIES } from '../types';

interface Props {
  stats: PlayerStats;
  onClose: () => void;
}

const COMBO_EMOJI: Record<string, string> = {
  'modern-timed': '🆕⏱️',
  'modern-relaxed': '🆕😌',
  'alltime-timed': '📜⏱️',
  'alltime-relaxed': '📜😌',
};

function getResultEmojis(results: { correct: boolean; timeMs: number; points: number }[]): string {
  return results.map(r => {
    if (!r.correct) return r.timeMs >= 15000 ? '⬛' : '🟥';
    if (r.timeMs < 5000) return '🟩';
    if (r.timeMs < 10000) return '🟨';
    return '🟧';
  }).join('');
}

export default function HistoryScreen({ stats, onClose }: Props) {
  const sortedDays = Object.entries(stats.history).sort((a, b) => b[0].localeCompare(a[0]));

  return (
    <div className="fixed inset-0 z-50 bg-gray-950/95 flex flex-col animate-fade-in">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <h2 className="text-lg font-bold">Your History</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors p-1 text-2xl leading-none"
          aria-label="Close history"
        >
          ×
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 max-w-lg mx-auto w-full">
        {/* Stats summary */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-orange-400">{stats.streak}</p>
            <p className="text-xs text-gray-500 mt-0.5">Current Streak</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-yellow-400">{stats.maxStreak}</p>
            <p className="text-xs text-gray-500 mt-0.5">Best Streak</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-blue-400">{stats.totalGamesPlayed}</p>
            <p className="text-xs text-gray-500 mt-0.5">Games Played</p>
          </div>
        </div>

        {sortedDays.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <p className="text-4xl mb-3">⚾</p>
            <p>No history yet. Play a game to get started!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {sortedDays.map(([dateKey, dayRecord]) => (
              <div key={dateKey} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                <p className="px-4 py-2.5 text-xs text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-800">
                  {dateKey}
                </p>
                {Object.entries(dayRecord.combos).map(([comboKey, comboRecord]) => {
                  const [mode, difficulty] = comboKey.split('-') as [keyof typeof GAME_MODES, keyof typeof GAME_DIFFICULTIES];
                  const modeLabel = GAME_MODES[mode]?.label ?? mode;
                  const diffLabel = GAME_DIFFICULTIES[difficulty]?.label ?? difficulty;
                  const correct = comboRecord.results.filter(r => r.correct).length;
                  return (
                    <div key={comboKey} className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 last:border-0">
                      <span className="text-lg shrink-0">{COMBO_EMOJI[comboKey] ?? '⚾'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{modeLabel} · {diffLabel}</p>
                        <p className="text-xs font-mono text-gray-400 mt-0.5">
                          {getResultEmojis(comboRecord.results)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-yellow-400">{comboRecord.totalScore.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">{correct}/5 correct</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
