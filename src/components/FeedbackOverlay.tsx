import { useState } from 'react';
import type { RoundResult, MLBPlayer } from '../types';

interface Props {
  result: RoundResult;
  canonicalPlayer: MLBPlayer | null;
  acceptedPlayers: MLBPlayer[];
  onContinue: () => void;
  isLastRound: boolean;
}

export default function FeedbackOverlay({ result, canonicalPlayer, acceptedPlayers, onContinue, isLastRound }: Props) {
  const correct = result.correct;
  const skipped = !result.correct && result.timeMs === 0 && result.answeredName === null;
  const timedOut = !result.correct && result.timeMs >= 15000;
  const [expanded, setExpanded] = useState(false);

  // Sort alphabetically, canonical player pinned first
  const sortedPlayers = (() => {
    if (correct || acceptedPlayers.length === 0) return [];
    const sorted = [...acceptedPlayers].sort((a, b) => a.name.localeCompare(b.name));
    const canonIdx = canonicalPlayer ? sorted.findIndex(p => p.id === canonicalPlayer.id) : -1;
    if (canonIdx > 0) {
      const [canon] = sorted.splice(canonIdx, 1);
      sorted.unshift(canon);
    }
    return sorted;
  })();

  const displayPlayers = expanded ? sortedPlayers : sortedPlayers.slice(0, 10);
  const hasMore = sortedPlayers.length > 10;

  return (
    <div
      className={`fixed inset-0 z-40 flex flex-col items-center justify-center p-6 animate-fade-in cursor-pointer overflow-y-auto ${
        correct ? 'bg-green-950' : (timedOut || skipped) ? 'bg-gray-950' : 'bg-red-950'
      }`}
      onClick={onContinue}
    >
      <div className="max-w-sm w-full flex flex-col items-center gap-6 text-center animate-bounce-in py-6">
        {/* Icon */}
        <div className="text-7xl">
          {correct ? '✅' : skipped ? '⏭️' : timedOut ? '⏱️' : '❌'}
        </div>

        {/* Status */}
        <div>
          <p
            className={`text-3xl font-black mb-1 ${
              correct ? 'text-green-400' : (timedOut || skipped) ? 'text-gray-400' : 'text-red-400'
            }`}
          >
            {correct ? 'Correct!' : skipped ? 'Skipped' : timedOut ? "Time's Up!" : 'Wrong!'}
          </p>
          {correct ? (
            <p className="text-green-300 font-semibold text-lg">
              +{result.points.toLocaleString()} pts
            </p>
          ) : (
            <p className="text-gray-400 text-sm">0 pts</p>
          )}
        </div>

        {/* Accepted answers list (wrong/timeout only) */}
        {!correct && displayPlayers.length > 0 && (
          <div
            className="bg-gray-800 border border-gray-700 rounded-2xl px-5 py-4 w-full text-left"
            onClick={e => e.stopPropagation()}
          >
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
              Valid answers ({acceptedPlayers.length} total)
            </p>
            <ul className="flex flex-col gap-1">
              {displayPlayers.map((p, i) => (
                <li key={p.id} className="flex items-center gap-2">
                  <span className="text-gray-600 text-xs w-5 shrink-0">{i + 1}.</span>
                  <span className={`text-sm font-semibold ${i === 0 && !expanded ? 'text-white' : 'text-gray-300'}`}>
                    {p.name}
                  </span>
                </li>
              ))}
            </ul>
            {hasMore && (
              <button
                className="mt-3 text-xs text-blue-400 hover:text-blue-300 font-semibold w-full text-center"
                onClick={e => { e.stopPropagation(); setExpanded(v => !v); }}
              >
                {expanded
                  ? 'Show less ▲'
                  : `Show all ${sortedPlayers.length} players ▼`}
              </button>
            )}
          </div>
        )}

        {/* Player's answer if wrong but gave one */}
        {!correct && result.answeredName && !timedOut && (
          <p className="text-sm text-gray-500">
            You said: <span className="text-gray-300">{result.answeredName}</span>
          </p>
        )}

        {/* Time taken */}
        {correct && (
          <p className="text-sm text-gray-500">
            Answered in{' '}
            <span className="text-white font-semibold">
              {(result.timeMs / 1000).toFixed(1)}s
            </span>
          </p>
        )}

        <p className="text-xs text-gray-600 animate-pulse-urgent">
          {isLastRound ? 'Tap to see results' : 'Tap to continue'}
        </p>
      </div>
    </div>
  );
}
