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
      className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden z-50 shadow-xl animate-fade-in"
      role="listbox"
    >
      {suggestions.map((player, i) => (
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
        >
          <span className="font-medium">{player.name}</span>
        </li>
      ))}
    </ul>
  );
}
