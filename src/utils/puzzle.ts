import type { MLBPlayer, PuzzleRound, GameMode } from '../types';
import { GAME_MODES } from '../types';
import { mulberry32, dateToSeed } from './seed';

const ROUNDS_PER_DAY = 5;
const MAX_RP_ROUNDS = 0; // avoid RP clues entirely unless no non-RP option exists

/** Pick a position, deprioritising RP when non-RP options exist */
function pickPosition(positions: string[], rng: () => number): string {
  const nonRP = positions.filter(p => p !== 'RP');
  const pool = nonRP.length > 0 ? nonRP : positions;
  return pool[Math.floor(rng() * pool.length)];
}

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
  let rpCount = 0;

  for (let i = 0; i < ROUNDS_PER_DAY; i++) {
    const player = shuffled[i];

    // Only pick from seasons within the mode range
    const validSeasons = player.seasons.filter(s => s.year >= minYear && s.year <= maxYear);
    const seasonRecord = validSeasons[Math.floor(rng() * validSeasons.length)];

    const year = seasonRecord.year;
    const team = seasonRecord.team;

    // Deprioritise RP; if cap already hit, force a non-RP season if possible
    let position: string;
    if (rpCount >= MAX_RP_ROUNDS) {
      const nonRPSeasons = validSeasons.filter(s => s.positions.some(p => p !== 'RP'));
      if (nonRPSeasons.length > 0) {
        const altSeason = nonRPSeasons[Math.floor(rng() * nonRPSeasons.length)];
        const nonRPPositions = altSeason.positions.filter(p => p !== 'RP');
        position = nonRPPositions[Math.floor(rng() * nonRPPositions.length)];
      } else {
        position = pickPosition(seasonRecord.positions, rng);
      }
    } else {
      position = pickPosition(seasonRecord.positions, rng);
    }
    if (position === 'RP') rpCount++;

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

/** Generate one more survival round at a given index, using a seeded RNG offset by index */
export function generateSurvivalRound(dateKey: string, allPlayers: MLBPlayer[], mode: GameMode, roundIndex: number): PuzzleRound {
  const { minYear, maxYear, seedOffset } = GAME_MODES[mode];
  const pool = allPlayers.filter(p =>
    p.seasons.some(s => s.year >= minYear && s.year <= maxYear)
  );

  // Use a unique seed per round index so each question is deterministic but different
  const seed = dateToSeed(dateKey) + seedOffset + 1_000_000 + roundIndex * 7919;
  const rng = mulberry32(seed);

  const shuffled = [...pool].sort(() => rng() - 0.5);

  // Skip players whose in-range seasons all have empty team/position data
  const player = shuffled.find(p =>
    p.seasons.some(s => s.year >= minYear && s.year <= maxYear && s.team && s.positions.length > 0)
  ) ?? shuffled[0];

  const validSeasons = player.seasons.filter(s =>
    s.year >= minYear && s.year <= maxYear && s.team && s.positions.length > 0
  );
  const seasonRecord = validSeasons[Math.floor(rng() * validSeasons.length)];

  const year = seasonRecord.year;
  const team = seasonRecord.team;
  const position = pickPosition(seasonRecord.positions, rng);

  const acceptedIds = pool
    .filter(p => playerMatchesClue(p, team, position, year))
    .map(p => p.id);

  return {
    roundIndex,
    clue: { team, position, season: year },
    answerId: player.id,
    acceptedIds,
  };
}

export function getCanonicalPlayer(playerId: string, players: MLBPlayer[]): MLBPlayer | undefined {
  return players.find(p => p.id === playerId);
}
