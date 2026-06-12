interface ProgressProps {
  /** Nilai 0-100. */
  value: number;
  color?: string;
  className?: string;
  showLabel?: boolean;
}

export function Progress({ value, color = '#E8AC1A', className = '', showLabel = false }: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className="h-2 flex-1 overflow-hidden rounded-full bg-elevated"
        role="progressbar"
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${clamped}%`, backgroundColor: color }}
        />
      </div>
      {showLabel && (
        <span className="font-mono text-xs text-text-muted tabular-nums">{clamped.toFixed(0)}%</span>
      )}
    </div>
  );
}
