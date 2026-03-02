interface Props {
  streak: number;
  totalScore: number;
  roundIndex: number;
  totalRounds: number;
  phase: string;
  onHistory?: () => void;
}

export default function Header({ streak, totalScore, roundIndex, totalRounds, phase, onHistory }: Props) {
  const showScore = phase === 'round_active' || phase === 'round_feedback';
  const showRound = phase === 'round_active' || phase === 'round_feedback';
  const showHistory = phase === 'intro' || phase === 'game_over';

  return (
    <header className="w-full flex items-center justify-between px-4 py-3 border-b border-gray-800">
      <div className="flex items-center gap-2">
        <span className="text-2xl">⚾</span>
        <div>
          <h1 className="text-lg font-bold leading-tight tracking-tight">MLB QuickPick</h1>
          <p className="text-xs text-gray-500 leading-none">Daily Challenge</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {streak > 0 && (
          <div className="flex items-center gap-1 bg-orange-500/20 border border-orange-500/30 rounded-full px-3 py-1">
            <span className="text-sm">🔥</span>
            <span className="text-sm font-semibold text-orange-400">{streak}</span>
          </div>
        )}
        {showRound && (
          <div className="text-sm text-gray-400">
            <span className="font-semibold text-white">{roundIndex + 1}</span>
            <span>/</span>
            <span>{totalRounds}</span>
          </div>
        )}
        {showScore && (
          <div className="text-sm font-bold text-yellow-400">
            {totalScore.toLocaleString()} pts
          </div>
        )}
        {showHistory && onHistory && (
          <button
            onClick={onHistory}
            className="text-gray-400 hover:text-white transition-colors p-1"
            aria-label="View history"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v5h5" />
              <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
              <path d="M12 7v5l4 2" />
            </svg>
          </button>
        )}
      </div>
    </header>
  );
}
