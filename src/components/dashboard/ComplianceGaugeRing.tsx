import { useEffect, useRef, useState } from 'react';
import type { RiskLevel } from '@/types';
import { RISK_LEVEL_META } from '@/types';

interface ComplianceGaugeRingProps {
  /** Nilai 0-100. */
  value: number;
  riskLevel: RiskLevel;
  size?: number;
  strokeWidth?: number;
  showRiskLabel?: boolean;
}

/**
 * Signature element: SVG arc yang terisi smooth saat mount dengan
 * counter animasi 0 → skor aktual di tengah ring.
 */
export function ComplianceGaugeRing({
  value,
  riskLevel,
  size = 220,
  strokeWidth = 16,
  showRiskLabel = true,
}: ComplianceGaugeRingProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [arcProgress, setArcProgress] = useState(0);
  const rafRef = useRef<number>();

  const meta = RISK_LEVEL_META[riskLevel];
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, value));

  useEffect(() => {
    const duration = 1400;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayValue(clamped * eased);
      setArcProgress(eased);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [clamped]);

  const dashOffset = circumference * (1 - (clamped / 100) * arcProgress);

  return (
    <div className="relative inline-flex flex-col items-center" style={{ width: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#0F3460"
          strokeOpacity={0.35}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={meta.color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ filter: `drop-shadow(0 0 8px ${meta.color}66)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-display font-bold tabular-nums text-text-primary"
          style={{ fontSize: size / 5 }}
        >
          {displayValue.toFixed(1)}
          <span className="text-text-muted" style={{ fontSize: size / 10 }}>
            %
          </span>
        </span>
        {showRiskLabel && (
          <span
            className="mt-1 rounded-full border px-3 py-0.5 font-mono text-xs font-semibold uppercase tracking-wider"
            style={{ color: meta.color, borderColor: `${meta.color}66`, backgroundColor: `${meta.color}1a` }}
          >
            {meta.label}
          </span>
        )}
      </div>
    </div>
  );
}
