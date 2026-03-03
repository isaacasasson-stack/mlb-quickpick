import type { MLBPlayer } from '../types';

interface Props {
  suggestions: MLBPlayer[];
  onSelect: (player: MLBPlayer) => void;
  highlightIndex: number;
}

export default function AutocompleteDropdown({ suggestions, onSelect, highlightIndex }: Props) {
  if (suggestions.length === 0) return null;

  return (
    <ul
      className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-xl overflow-y-auto z-50 shadow-xl animate-fade-in max-h-60"
      role="listbox"
    >
      {suggestions.map((player, i) => {
        const years = player.seasons.map(s => s.year);
        const minYear = Math.min(...years);
        const maxYear = Math.max(...years);
        const yearRange = minYear === maxYear ? `${minYear}` : `${minYear}–${maxYear}`;
        return (
          <li
            key={player.id}
            role="option"
            aria-selected={i === highlightIndex}
            className={`px-4 py-3 cursor-pointer flex items-center justify-between transition-colors ${
              i === highlightIndex ? 'bg-blue-600 text-white' : 'hover:bg-gray-700 text-gray-100'
            }`}
            onMouseDown={(e) => {
              // Use mousedown (not click) to fire before onBlur on the input
              e.preventDefault();
              onSelect(player);
            }}
            onTouchEnd={(e) => {
              // Use touchend so scroll gestures don't accidentally select
              e.preventDefault();
              onSelect(player);
            }}
          >
            <span className="font-medium">{player.name}</span>
            <span className={`text-xs tabular-nums ${i === highlightIndex ? 'text-blue-200' : 'text-gray-500'}`}>{yearRange}</span>
          </li>
        );
      })}
    </ul>
  );
}
