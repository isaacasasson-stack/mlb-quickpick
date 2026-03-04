import { useState } from 'react';
import type { GameMode, GameDifficulty } from '../types';
import { GAME_MODES, GAME_DIFFICULTIES } from '../types';

interface Props {
  onStart: (mode: GameMode, difficulty: GameDifficulty) => void;
  todayKey: string;
  playedCombos: Set<string>;
}

export default function IntroScreen({ onStart, todayKey, playedCombos }: Props) {
  const [selectedMode, setSelectedMode] = useState<GameMode>('modern');
  const [selectedDifficulty, setSelectedDifficulty] = useState<GameDifficulty>('timed');

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-8 text-center animate-fade-in">
      <div>
        <img src="/logo.png" alt="MLB QuickPick" className="mx-auto mb-2 w-36 h-auto" />
        <h2 className="text-3xl font-black mb-2">MLB QuickPick</h2>
        <p className="text-gray-400 text-sm">{todayKey}</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 text-left max-w-xs w-full">
        <p className="font-bold text-white mb-3 text-center">How to Play</p>
        <ul className="text-sm text-gray-400 space-y-2">
          <li className="flex gap-2"><span>🏟️</span><span>You'll see a <strong className="text-white">team</strong>, <strong className="text-white">position</strong>, and <strong className="text-white">season</strong></span></li>
          <li className="flex gap-2"><span>🧠</span><span>Name any MLB player that matches all 3</span></li>
          <li className="flex gap-2"><span>⏱️</span><span>Timed: 20s clock, faster = more points</span></li>
          <li className="flex gap-2"><span>😌</span><span>Relaxed: no clock, skip freely, 1,000 pts each</span></li>
          <li className="flex gap-2"><span>❤️</span><span>Survival: one life — streak til you miss</span></li>
          <li className="flex gap-2"><span>📋</span><span>Positions require <strong className="text-white">5+ games</strong> played at that spot that season</span></li>
        </ul>
      </div>

      {/* Era picker */}
      <div className="w-full max-w-xs flex flex-col gap-3">
        <p className="text-xs font-semibold text-gray-500 text-center uppercase tracking-widest">Era</p>
        <div className="grid grid-cols-2 gap-3">
          {(Object.entries(GAME_MODES) as [GameMode, typeof GAME_MODES[GameMode]][]).map(([key, cfg]) => {
            const alreadyPlayed = playedCombos.has(`${key}-${selectedDifficulty}`);
            return (
              <button
                key={key}
                onClick={() => !alreadyPlayed && setSelectedMode(key)}
                disabled={alreadyPlayed}
                className={`relative flex flex-col items-center gap-1 py-4 px-3 rounded-2xl border-2 transition-all duration-150 ${
                  alreadyPlayed
                    ? 'border-gray-800 bg-gray-900/50 text-gray-600 cursor-not-allowed opacity-60'
                    : selectedMode === key
                    ? 'border-blue-500 bg-blue-600/20 text-white'
                    : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-500'
                }`}
              >
                {alreadyPlayed && (
                  <span className="absolute top-2 right-2 text-xs text-green-600 font-bold">✓</span>
                )}
                <span className="text-2xl">{key === 'modern' ? '🆕' : '📜'}</span>
                <span className="font-bold text-sm">{cfg.label}</span>
                <span className="text-xs opacity-70">{cfg.subtitle}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Difficulty picker */}
      <div className="w-full max-w-xs flex flex-col gap-3">
        <p className="text-xs font-semibold text-gray-500 text-center uppercase tracking-widest">Mode</p>
        <div className="grid grid-cols-3 gap-2">
          {(Object.entries(GAME_DIFFICULTIES) as [GameDifficulty, typeof GAME_DIFFICULTIES[GameDifficulty]][]).map(([key, cfg]) => {
            const alreadyPlayed = playedCombos.has(`${selectedMode}-${key}`);
            const icon = key === 'timed' ? '⏱️' : key === 'relaxed' ? '😌' : '❤️';
            return (
              <button
                key={key}
                onClick={() => !alreadyPlayed && setSelectedDifficulty(key)}
                disabled={alreadyPlayed}
                className={`relative flex flex-col items-center gap-1 py-4 px-2 rounded-2xl border-2 transition-all duration-150 ${
                  alreadyPlayed
                    ? 'border-gray-800 bg-gray-900/50 text-gray-600 cursor-not-allowed opacity-60'
                    : selectedDifficulty === key
                    ? 'border-purple-500 bg-purple-600/20 text-white'
                    : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-500'
                }`}
              >
                {alreadyPlayed && (
                  <span className="absolute top-2 right-2 text-xs text-green-600 font-bold">✓</span>
                )}
                <span className="text-2xl">{icon}</span>
                <span className="font-bold text-sm">{cfg.label}</span>
                <span className="text-xs opacity-70 text-center leading-tight">{cfg.subtitle}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="w-full max-w-xs">
        {playedCombos.has(`${selectedMode}-${selectedDifficulty}`) ? (
          <p className="text-center text-sm text-gray-500 py-3">You've already played this combo today</p>
        ) : (
          <button
            onClick={() => onStart(selectedMode, selectedDifficulty)}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 active:scale-95 rounded-xl font-bold text-lg transition-all duration-150"
          >
            Play — {GAME_MODES[selectedMode].label}
          </button>
        )}
      </div>
    </div>
  );
}
