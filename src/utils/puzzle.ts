import type { MLBPlayer, PuzzleRound, GameMode } from '../types';
import { GAME_MODES } from '../types';
import { mulberry32, dateToSeed } from './seed';

const ROUNDS_PER_DAY = 5;

/** A player matches a clue only if the SAME season record has all three: year, team, position */
function playerMatchesClue(player: MLBPlayer, team: string, position: string, year: number): boolean {
  return player.seasons.some(
    s => s.year === year && s.team === team && s.positions.includes(position)
  );
}

export function generateDailyPuzzle(dateKey: string, allPlayers: MLBPlayer[], mode: GameMode): PuzzleRound[] {
  const { minYear, maxYear, seedOffset } = GAME_MODES[mode];

  // Filter to players who have at least one season in the mode's year range
  const pool = allPlayers.filter(p =>
    p.seasons.some(s => s.year >= minYear && s.year <= maxYear)
  );

  const seed = dateToSeed(dateKey) + seedOffset;
  const rng = mulberry32(seed);

  // Seeded shuffle
  const shuffled = [...pool].sort(() => rng() - 0.5);

  const rounds: PuzzleRound[] = [];

  for (let i = 0; i < ROUNDS_PER_DAY; i++) {
    const player = shuffled[i];

    // Only pick from seasons within the mode range
    const validSeasons = player.seasons.filter(s => s.year >= minYear && s.year <= maxYear);
    const seasonRecord = validSeasons[Math.floor(rng() * validSeasons.length)];

    const year = seasonRecord.year;
    const team = seasonRecord.team;
    const position = seasonRecord.positions[Math.floor(rng() * seasonRecord.positions.length)];

    // All players matching ALL 3 clues against the same season record
    const acceptedIds = pool
      .filter(p => playerMatchesClue(p, team, position, year))
      .map(p => p.id);

    rounds.push({
      roundIndex: i,
      clue: { team, position, season: year },
      answerId: player.id,
      acceptedIds,
    });
  }

  return rounds;
}

export function getCanonicalPlayer(playerId: string, players: MLBPlayer[]): MLBPlayer | undefined {
  return players.find(p => p.id === playerId);
}
