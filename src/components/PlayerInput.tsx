import { useRef, useEffect, useState } from 'react';
import type { MLBPlayer } from '../types';
import { usePlayerSearch } from '../hooks/usePlayerSearch';
import AutocompleteDropdown from './AutocompleteDropdown';

interface Props {
  onSubmit: (player: MLBPlayer) => void;
  onSkip: () => void;
  disabled: boolean;
  players: MLBPlayer[];
  showSkip: boolean;
}

export default function PlayerInput({ onSubmit, onSkip, disabled, players, showSkip }: Props) {
  const { query, setQuery, suggestions, selectedPlayer, selectPlayer, reset, clearSelection } =
    usePlayerSearch(players);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus when enabled
  useEffect(() => {
    if (!disabled) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [disabled]);

  // Reset on each new round (when disabled flips to false)
  useEffect(() => {
    if (!disabled) {
      reset();
      setHighlightIndex(0);
      setIsOpen(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions.length > 0 && isOpen) {
        handleSelect(suggestions[highlightIndex]);
      } else if (selectedPlayer) {
        onSubmit(selectedPlayer);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelect = (player: MLBPlayer) => {
    selectPlayer(player);
    setIsOpen(false);
    setHighlightIndex(0);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setHighlightIndex(0);
    setIsOpen(true);
    // If user edits after selecting, clear the selection so Submit stays disabled
    if (selectedPlayer && val !== selectedPlayer.name) {
      clearSelection();
    }
  };

  const canSubmit = selectedPlayer !== null && !disabled;

  return (
    <div className="w-full flex flex-col gap-3">
      <div className="relative">
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
          placeholder="Type a player name..."
          disabled={disabled}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          className="w-full px-4 py-3 text-base rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Player name"
          aria-autocomplete="list"
        />
        {isOpen && !disabled && (
          <AutocompleteDropdown
            suggestions={suggestions}
            onSelect={handleSelect}
            highlightIndex={highlightIndex}
          />
        )}
      </div>

      <div className={showSkip ? 'grid grid-cols-2 gap-3' : ''}>
        <button
          onClick={() => selectedPlayer && onSubmit(selectedPlayer)}
          disabled={!canSubmit}
          className={`py-3 rounded-xl font-bold text-base transition-all duration-150
            bg-blue-600 hover:bg-blue-500 active:scale-95 text-white
            disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-blue-600 disabled:active:scale-100
            ${showSkip ? '' : 'w-full'}`}
        >
          Submit Answer
        </button>
        {showSkip && (
          <button
            onClick={onSkip}
            disabled={disabled}
            className="py-3 rounded-xl font-bold text-base transition-all duration-150
              bg-gray-700 hover:bg-gray-600 active:scale-95 text-gray-300
              disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Skip
          </button>
        )}
      </div>
    </div>
  );
}
