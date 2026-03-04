import { useReducer, useEffect, useCallback, useState } from 'react';
import { generateDailyPuzzle, generateSurvivalRound, getCanonicalPlayer } from '../utils/puzzle';
import { calculatePoints, MAX_TIME_MS } from '../utils/scoring';
import { resolveAnswer } from '../utils/validation';
import { getTodayKey } from '../utils/seed';
import { useLocalStorage } from './useLocalStorage';
import type { GameState, RoundResult, PlayerStats, DayRecord, ComboRecord, MLBPlayer, GameMode, GameDifficulty } from '../types';

const DEFAULT_STATS: PlayerStats = {
  lastPlayed: '',
  streak: 0,
  maxStreak: 0,
  totalGamesPlayed: 0,
  history: {},
};

type Action =
  | { type: 'INIT' }
  | { type: 'GO_TO_INTRO' }
  | { type: 'START_GAME'; mode: GameMode; difficulty: GameDifficulty; players: MLBPlayer[] }
  | { type: 'SUBMIT_ANSWER'; input: string; elapsedMs: number; players: MLBPlayer[] }
  | { type: 'SKIP_ROUND' }
  | { type: 'TIMER_EXPIRED' }
  | { type: 'ADVANCE_ROUND'; players: MLBPlayer[] };

function buildInitialState(): GameState {
  const todayKey = getTodayKey();
  return {
    phase: 'loading',
    todayKey,
    mode: 'modern',
    difficulty: 'timed',
    rounds: [],
    currentRoundIndex: 0,
    results: [],
    totalScore: 0,
    survivalStreak: 0,
  };
}

function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'INIT':
    case 'GO_TO_INTRO':
      return { ...state, phase: 'intro' };

    case 'START_GAME': {
      const isSurvival = action.difficulty === 'survival';
      // Survival: generate only the first round up front; more generated on demand
      const rounds = isSurvival
        ? [generateSurvivalRound(state.todayKey, action.players, action.mode, 0)]
        : generateDailyPuzzle(state.todayKey, action.players, action.mode);
      return {
        ...state,
        rounds,
        mode: action.mode,
        difficulty: action.difficulty,
        phase: 'round_active',
        currentRoundIndex: 0,
        results: [],
        totalScore: 0,
        survivalStreak: 0,
      };
    }

    case 'SUBMIT_ANSWER': {
      if (state.phase !== 'round_active') return state;
      const round = state.rounds[state.currentRoundIndex];
      const { correct, matchedId } = resolveAnswer(
        action.input,
        round.acceptedIds,
        action.players
      );
      // Relaxed/survival mode: correct = full 1000 pts regardless of speed
      const elapsedForScore = state.difficulty === 'timed' ? action.elapsedMs : 0;
      const points = correct ? calculatePoints(elapsedForScore) : 0;
      const result: RoundResult = {
        roundIndex: state.currentRoundIndex,
        answeredId: matchedId,
        answeredName: action.input,
        correct,
        timeMs: action.elapsedMs,
        points,
      };

      return {
        ...state,
        phase: 'round_feedback',
        results: [...state.results, result],
        totalScore: state.totalScore + points,
        survivalStreak: state.difficulty === 'survival' && correct
          ? state.survivalStreak + 1
          : state.survivalStreak,
      };
    }

    case 'SKIP_ROUND': {
      if (state.phase !== 'round_active') return state;
      const result: RoundResult = {
        roundIndex: state.currentRoundIndex,
        answeredId: null,
        answeredName: null,
        correct: false,
        timeMs: 0,
        points: 0,
      };
      return {
        ...state,
        phase: 'round_feedback',
        results: [...state.results, result],
      };
    }

    case 'TIMER_EXPIRED': {
      if (state.phase !== 'round_active') return state;
      const result: RoundResult = {
        roundIndex: state.currentRoundIndex,
        answeredId: null,
        answeredName: null,
        correct: false,
        timeMs: MAX_TIME_MS,
        points: 0,
      };
      return {
        ...state,
        phase: 'round_feedback',
        results: [...state.results, result],
      };
    }

    case 'ADVANCE_ROUND': {
      if (state.phase !== 'round_feedback') return state;
      const nextIndex = state.currentRoundIndex + 1;

      if (state.difficulty === 'survival') {
        // If the last result was wrong, the game is over
        const lastResult = state.results[state.results.length - 1];
        if (lastResult && !lastResult.correct) {
          return { ...state, phase: 'game_over' };
        }
        // Generate the next survival round on the fly
        const nextRound = generateSurvivalRound(
          state.todayKey,
          action.players,
          state.mode,
          nextIndex
        );
        return {
          ...state,
          phase: 'round_active',
          currentRoundIndex: nextIndex,
          rounds: [...state.rounds, nextRound],
        };
      }

      if (nextIndex >= state.rounds.length) {
        return { ...state, phase: 'game_over' };
      }
      return {
        ...state,
        phase: 'round_active',
        currentRoundIndex: nextIndex,
      };
    }

    default:
      return state;
  }
}

export function useGameState() {
  const [state, dispatch] = useReducer(gameReducer, undefined, buildInitialState);
  const [stats, setStats] = useLocalStorage<PlayerStats>('mlb-trivia-stats', DEFAULT_STATS);
  const [players, setPlayers] = useState<MLBPlayer[]>([]);

  // Fetch players.json once on mount, then move to intro
  useEffect(() => {
    fetch('/players.json')
      .then(r => r.json())
      .then((data: MLBPlayer[]) => {
        setPlayers(data);
        dispatch({ type: 'INIT' });
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When game ends, persist stats
  useEffect(() => {
    if (state.phase !== 'game_over') return;

    setStats(prev => {
      const today = state.todayKey;
      const comboKey = `${state.mode}-${state.difficulty}`;
      const yesterday = (() => {
        const d = new Date(today + 'T12:00:00');
        d.setDate(d.getDate() - 1);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      })();

      const newStreak =
        prev.lastPlayed === yesterday ? prev.streak + 1 : 1;

      const comboRecord: ComboRecord = {
        totalScore: state.totalScore,
        results: state.results.map(r => ({
          correct: r.correct,
          timeMs: r.timeMs,
          points: r.points,
        })),
      };

      // Merge into existing day record (preserve other combos played today)
      const existingDay = prev.history[today];
      const dayRecord: DayRecord = {
        combos: {
          ...(existingDay?.combos ?? {}),
          [comboKey]: comboRecord,
        },
      };

      // Prune history to last 30 days
      const allKeys = Object.keys(prev.history);
      const pruned = { ...prev.history };
      if (allKeys.length >= 30) {
        const oldest = allKeys.sort()[0];
        delete pruned[oldest];
      }

      return {
        lastPlayed: today,
        streak: newStreak,
        maxStreak: Math.max(prev.maxStreak, newStreak),
        totalGamesPlayed: prev.totalGamesPlayed + 1,
        history: { ...pruned, [today]: dayRecord },
      };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase]);

  const startGame = useCallback((mode: GameMode, difficulty: GameDifficulty) => {
    dispatch({ type: 'START_GAME', mode, difficulty, players });
  }, [players]);

  const submitAnswer = useCallback((input: string, elapsedMs: number) => {
    dispatch({ type: 'SUBMIT_ANSWER', input, elapsedMs, players });
  }, [players]);

  const skipRound = useCallback(() => {
    dispatch({ type: 'SKIP_ROUND' });
  }, []);

  const timerExpired = useCallback(() => {
    dispatch({ type: 'TIMER_EXPIRED' });
  }, []);

  const advanceRound = useCallback(() => {
    dispatch({ type: 'ADVANCE_ROUND', players });
  }, [players]);

  const goToIntro = useCallback(() => {
    dispatch({ type: 'GO_TO_INTRO' });
  }, []);

  const currentRound = state.rounds[state.currentRoundIndex] ?? null;
  const lastResult = state.results[state.results.length - 1] ?? null;
  const canonicalPlayer = lastResult
    ? getCanonicalPlayer(state.rounds[lastResult.roundIndex]?.answerId ?? '', players)
    : null;

  // Set of "mode-difficulty" combos played today e.g. {"modern-timed", "alltime-relaxed"}
  const playedCombos = new Set<string>(
    Object.keys(stats.history[state.todayKey]?.combos ?? {})
  );

  return {
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
  };
}
