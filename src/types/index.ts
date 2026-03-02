// ─── Raw dataset shape ────────────────────────────────────────────────
export interface PlayerSeason {
  year: number;         // 2011
  team: string;         // "MIN"
  positions: string[];  // ["RF", "LF"] — only positions with >= 5 games that season
}

export interface MLBPlayer {
  id: string;           // kebab-case slug: "mike-trout"
  name: string;         // "Mike Trout"
  seasons: PlayerSeason[];
}

// ─── A single generated puzzle round ──────────────────────────────────
export interface PuzzleRound {
  roundIndex: number;
  clue: {
    team: string;
    position: string;
    season: number;
  };
  answerId: string;       // canonical player used to generate the clue
  acceptedIds: string[];  // ALL player IDs that satisfy the 3 constraints
}

// ─── Result of one answered (or timed-out) round ──────────────────────
export interface RoundResult {
  roundIndex: number;
  answeredId: string | null;  // null if timed out
  answeredName: string | null;
  correct: boolean;
  timeMs: number;             // ms elapsed when submitted (15000 if timed out)
  points: number;
}

// ─── Game mode ────────────────────────────────────────────────────────
export type GameMode = 'modern' | 'alltime';

export const GAME_MODES: Record<GameMode, { label: string; subtitle: string; minYear: number; maxYear: number; seedOffset: number }> = {
  modern:  { label: 'Modern Era',  subtitle: '2010 – 2025', minYear: 2010, maxYear: 2025, seedOffset: 0 },
  alltime: { label: 'All Time',    subtitle: '1980 – 2025', minYear: 1980, maxYear: 2025, seedOffset: 999983 },
};

// ─── Game difficulty ──────────────────────────────────────────────────
export type GameDifficulty = 'timed' | 'relaxed';

export const GAME_DIFFICULTIES: Record<GameDifficulty, { label: string; subtitle: string }> = {
  timed:   { label: 'Timed',   subtitle: '15s clock, speed = points' },
  relaxed: { label: 'Relaxed', subtitle: 'No clock, skip freely' },
};

// ─── Game phases ──────────────────────────────────────────────────────
export type GamePhase =
  | 'loading'
  | 'already_played'
  | 'intro'
  | 'round_active'
  | 'round_feedback'
  | 'game_over';

// ─── Central game state ───────────────────────────────────────────────
export interface GameState {
  phase: GamePhase;
  todayKey: string;           // "2026-03-01"
  mode: GameMode;
  difficulty: GameDifficulty;
  rounds: PuzzleRound[];      // 5 rounds
  currentRoundIndex: number;  // 0–4
  results: RoundResult[];
  totalScore: number;
}

// ─── localStorage persistence ─────────────────────────────────────────
export interface ComboRecord {
  totalScore: number;
  results: Pick<RoundResult, 'correct' | 'timeMs' | 'points'>[];
}

export interface DayRecord {
  // Keyed by "mode-difficulty" e.g. "modern-timed", "alltime-relaxed"
  combos: Record<string, ComboRecord>;
}

export interface PlayerStats {
  lastPlayed: string;   // "2026-03-01"
  streak: number;
  maxStreak: number;
  totalGamesPlayed: number;
  history: Record<string, DayRecord>;
}
