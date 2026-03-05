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

/** Levenshtein edit distance between two strings (for fuzzy matching) */
function editDistance(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[] = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    let prev = i;
    for (let j = 1; j <= n; j++) {
      const val = a[i - 1] === b[j - 1] ? dp[j - 1] : 1 + Math.min(dp[j - 1], dp[j], prev);
      dp[j - 1] = prev;
      prev = val;
    }
    dp[n] = prev;
  }
  return dp[n];
}

/** Career length = number of distinct seasons (used for sorting) */
function careerLength(p: MLBPlayer): number {
  return new Set(p.seasons.map(s => s.year)).size;
}

// Returns players matching the query, sorted by:
//   1. Active in clueYear (if provided) — most relevant to the current question
//   2. Career length descending — more recognisable players surface first
// Exact substring matches always precede fuzzy (1-2 char typo) matches.
export function searchPlayers(query: string, allPlayers: MLBPlayer[], clueYear?: number): MLBPlayer[] {
  if (query.length < 2) return [];
  const q = normalizeSearch(query);
  if (!q) return [];

  const exact: MLBPlayer[] = [];
  const fuzzy: MLBPlayer[] = [];

  // Allow 1 edit for queries ≤6 chars, 2 edits for longer queries
  const tolerance = q.length <= 6 ? 1 : 2;

  for (const p of allPlayers) {
    const name = normalizeSearch(p.name);
    if (name.includes(q)) {
      exact.push(p);
    } else {
      const nameWords = name.split(' ');
      const queryWords = q.split(' ');
      const isFuzzy = queryWords.every(qw =>
        nameWords.some(nw => {
          if (nw.includes(qw)) return true;
          if (Math.abs(nw.length - qw.length) > tolerance) return false;
          return editDistance(nw, qw) <= tolerance;
        })
      );
      if (isFuzzy) fuzzy.push(p);
    }
  }

  const activeInYear = (p: MLBPlayer) =>
    clueYear !== undefined && p.seasons.some(s => s.year === clueYear) ? 1 : 0;

  const byRelevance = (a: MLBPlayer, b: MLBPlayer) => {
    const yearDiff = activeInYear(b) - activeInYear(a);
    if (yearDiff !== 0) return yearDiff;
    return careerLength(b) - careerLength(a);
  };

  exact.sort(byRelevance);
  fuzzy.sort(byRelevance);

  return [...exact, ...fuzzy].slice(0, 8);
}
