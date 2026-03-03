import type { MLBPlayer } from '../types';

// For search/autocomplete: strip punctuation, collapse spaces, lowercase
// "C. J. Wilson" → "c j wilson", "Mike Trout" → "mike trout"
function normalizeSearch(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

// For exact answer matching: strip punctuation AND spaces
// so "CJ Wilson", "C.J. Wilson", "C. J. Wilson" all → "cjwilson"
function normalizeExact(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function resolveAnswer(
  input: string,
  acceptedIds: string[],
  allPlayers: MLBPlayer[]
): { correct: boolean; matchedId: string | null } {
  const normalInput = normalizeExact(input);
  for (const player of allPlayers) {
    if (
      normalizeExact(player.name) === normalInput &&
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
  const q = normalizeSearch(query);
  if (!q) return [];
  return allPlayers
    .filter(p => normalizeSearch(p.name).includes(q))
    .slice(0, 8);
}
