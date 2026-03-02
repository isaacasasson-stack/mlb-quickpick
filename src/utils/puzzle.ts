import type { MLBPlayer, PuzzleRound, GameMode } from '../types';
import { GAME_MODES } from '../types';
import { mulberry32, dateToSeed } from './seed';

const ROUNDS_PER_DAY = 5;

export function generateDailyPuzzle(dateKey: string, allPlayers: MLBPlayer[], mode: GameMode): PuzzleRound[] {
  const { minYear, maxYear, seedOffset } = GAME_MODES[mode];

  // Filter to players who have at least one season in the mode's year range
  const pool = allPlayers.filter(p => p.seasons.some(s => s >= minYear && s <= maxYear));

  const seed = dateToSeed(dateKey) + seedOffset;
  const rng = mulberry32(seed);

  // Seeded shuffle
  const shuffled = [...pool].sort(() => rng() - 0.5);

  const rounds: PuzzleRound[] = [];

  for (let i = 0; i < ROUNDS_PER_DAY; i++) {
    const player = shuffled[i];

    // Only pick from seasons within the mode range
    const validSeasons = player.seasons.filter(s => s >= minYear && s <= maxYear);
    const season = validSeasons[Math.floor(rng() * validSeasons.length)];
    const team = player.teams[Math.floor(rng() * player.teams.length)];
    const position = player.positions[Math.floor(rng() * player.positions.length)];

    // All players in the pool that match ALL 3 criteria are valid answers
    const acceptedIds = pool
      .filter(p =>
        p.teams.includes(team) &&
        p.positions.includes(position) &&
        p.seasons.includes(season)
      )
      .map(p => p.id);

    rounds.push({
      roundIndex: i,
      clue: { team, position, season },
      answerId: player.id,
      acceptedIds,
    });
  }

  return rounds;
}

export function getCanonicalPlayer(playerId: string, players: MLBPlayer[]): MLBPlayer | undefined {
  return players.find(p => p.id === playerId);
}
