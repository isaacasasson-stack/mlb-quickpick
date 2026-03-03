import { useState } from 'react';
import { useGameState } from './hooks/useGameState';
import { useTimer } from './hooks/useTimer';
import Header from './components/Header';
import ClueCard from './components/ClueCard';
import TimerBar from './components/TimerBar';
import PlayerInput from './components/PlayerInput';
import FeedbackOverlay from './components/FeedbackOverlay';
import EndScreen from './components/EndScreen';
import IntroScreen from './components/IntroScreen';
import HistoryScreen from './components/HistoryScreen';
import type { MLBPlayer, GameMode, GameDifficulty } from './types';

export default function App() {
  const {
    state,
    stats,
    players,
    currentRound,
    lastResult,
    canonicalPlayer,
    playedCombos,
    startGame,
    submitAnswer,
    skipRound,
    timerExpired,
    advanceRound,
    goToIntro,
  } = useGameState();

  const [showHistory, setShowHistory] = useState(false);

  const isTimed = state.difficulty === 'timed';
  const isSurvival = state.difficulty === 'survival';
  const timerActive = state.phase === 'round_active' && isTimed;
  const { remainingSecs, barRef, getElapsed } = useTimer(timerActive, timerExpired);

  const handleSubmit = (player: MLBPlayer) => {
    const elapsed = isTimed ? getElapsed() : 0;
    submitAnswer(player.name, elapsed);
  };

  const handleStart = (mode: GameMode, difficulty: GameDifficulty) => startGame(mode, difficulty);

  const { phase, rounds, currentRoundIndex, results, totalScore, todayKey, mode, difficulty } = state;

  if (phase === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-4xl animate-pulse">⚾</span>
      </div>
    );
  }

  if (phase === 'intro') {
    return (
      <div className="min-h-screen flex flex-col">
        <Header streak={stats.streak} totalScore={0} roundIndex={0} totalRounds={5} phase="intro" onHistory={() => setShowHistory(true)} />
        <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
          <IntroScreen onStart={handleStart} todayKey={todayKey} playedCombos={playedCombos} />
        </main>
        {showHistory && <HistoryScreen stats={stats} onClose={() => setShowHistory(false)} />}
      </div>
    );
  }

  if (phase === 'game_over') {
    return (
      <div className="min-h-screen flex flex-col">
        <Header streak={stats.streak} totalScore={totalScore} roundIndex={4} totalRounds={5} phase="game_over" onHistory={() => setShowHistory(true)} />
        <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
          <EndScreen
            results={results}
            rounds={rounds}
            totalScore={totalScore}
            stats={stats}
            todayKey={todayKey}
            players={players}
            mode={mode}
            difficulty={difficulty}
            onPlayOtherModes={goToIntro}
          />
        </main>
        {showHistory && <HistoryScreen stats={stats} onClose={() => setShowHistory(false)} />}
      </div>
    );
  }

  // round_active or round_feedback
  return (
    <div className="min-h-screen flex flex-col">
      <Header
        streak={stats.streak}
        totalScore={totalScore}
        roundIndex={currentRoundIndex}
        totalRounds={rounds.length}
        phase={phase}
      />

      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full flex flex-col gap-6">
        {currentRound && (
          <>
            {isTimed && (
              <TimerBar barRef={barRef} remainingSecs={remainingSecs} />
            )}
            <PlayerInput
              onSubmit={handleSubmit}
              onSkip={skipRound}
              disabled={phase !== 'round_active'}
              players={players}
              showSkip={!isTimed && !isSurvival}
            />
            <ClueCard
              team={currentRound.clue.team}
              position={currentRound.clue.position}
              season={currentRound.clue.season}
            />
          </>
        )}
      </main>

      {phase === 'round_feedback' && lastResult && (
        <FeedbackOverlay
          result={lastResult}
          canonicalPlayer={canonicalPlayer ?? null}
          acceptedPlayers={players.filter(p =>
            rounds[lastResult.roundIndex]?.acceptedIds.includes(p.id)
          )}
          onContinue={advanceRound}
          isLastRound={!isSurvival && currentRoundIndex >= rounds.length - 1}
        />
      )}
    </div>
  );
}
