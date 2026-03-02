interface Props {
  remainingPct: number;   // 0.0 to 1.0
  remainingSecs: number;
}

export default function TimerBar({ remainingPct, remainingSecs }: Props) {
  const isUrgent = remainingPct < 0.33;
  const isMid = remainingPct >= 0.33 && remainingPct < 0.66;

  const barColor = isUrgent
    ? 'bg-red-500'
    : isMid
    ? 'bg-yellow-400'
    : 'bg-green-500';

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
          className={`h-full rounded-full transition-[width] duration-100 ease-linear ${barColor}`}
          style={{ width: `${remainingPct * 100}%` }}
        />
      </div>
    </div>
  );
}
