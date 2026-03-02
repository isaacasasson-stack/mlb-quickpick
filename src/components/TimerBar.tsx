import type { RefObject } from 'react';

interface Props {
  barRef: RefObject<HTMLDivElement | null>;
  remainingSecs: number;
}

export default function TimerBar({ barRef, remainingSecs }: Props) {
  const isUrgent = remainingSecs <= 5;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Time</span>
        <span
          className={`text-sm font-bold tabular-nums ${
            isUrgent ? 'text-red-400 animate-pulse-urgent' : 'text-white'
          }`}
        >
          {remainingSecs}s
        </span>
      </div>
      <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
        <div
          ref={barRef}
          className="h-full w-full origin-left"
          style={{
            backgroundColor: 'rgb(34 197 94)',
            transform: 'scaleX(1)',
          }}
        />
      </div>
    </div>
  );
}
