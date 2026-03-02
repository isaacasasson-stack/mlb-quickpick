import { useState, useMemo } from 'react';
import { searchPlayers } from '../utils/validation';
import type { MLBPlayer } from '../types';

export function usePlayerSearch(allPlayers: MLBPlayer[]) {
  const [query, setQuery] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<MLBPlayer | null>(null);

  const suggestions = useMemo(() => searchPlayers(query, allPlayers), [query, allPlayers]);

  const selectPlayer = (player: MLBPlayer) => {
    setSelectedPlayer(player);
    setQuery(player.name);
  };

  const reset = () => {
    setQuery('');
    setSelectedPlayer(null);
  };

  const clearSelection = () => setSelectedPlayer(null);

  return { query, setQuery, suggestions, selectedPlayer, selectPlayer, reset, clearSelection };
}
