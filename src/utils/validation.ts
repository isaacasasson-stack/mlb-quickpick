import type { MLBPlayer } from '../types';

export function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
}

export function resolveAnswer(
  input: string,
  acceptedIds: string[],
  allPlayers: MLBPlayer[]
): { correct: boolean; matchedId: string | null } {
  const normalInput = normalize(input);
  for (const player of allPlayers) {
    if (
      normalize(player.name) === normalInput &&
      acceptedIds.includes(player.id)
    ) {
      return { correct: true, matchedId: player.id };
    }
  }
  return { correct: false, matchedId: null };
}

// Returns players whose names contain the query substring (case-insensitive)
export function searchPlayers(query: string, allPlayers: MLBPlayer[]): MLBPlayer[] {
  if (query.length < 2) return [];
  const q = normalize(query);
  return allPlayers
    .filter(p => normalize(p.name).includes(q))
    .slice(0, 8);
}
