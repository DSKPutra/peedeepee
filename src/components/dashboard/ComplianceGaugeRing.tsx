import { useEffect, useId, useRef, useState } from 'react';
import type { RiskLevel } from '@/types';
import { RISK_LEVEL_META, RISK_RING_GRADIENT } from '@/types';

interface ComplianceGaugeRingProps {
  /** Nilai 0-100. */
  value: number;
  riskLevel: RiskLevel;
  size?: number;
  strokeWidth?: number;
  showRiskLabel?: boolean;
}

const TRACK_COLOR = '#1E2030';

/**
 * Signature element: SVG arc dengan gradient per risk level yang terisi
 * smooth saat mount, plus counter animasi 0 → skor aktual di tengah ring.
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
  const gradientId = useId();

  const meta = RISK_LEVEL_META[riskLevel];
  const gradient = RISK_RING_GRADIENT[riskLevel];
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
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={gradient.from} />
            <stop offset="100%" stopColor={gradient.to} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={TRACK_COLOR}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ filter: `drop-shadow(0 0 8px ${gradient.to}55)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-mono font-medium tabular-nums"
          style={{ fontSize: size / 5, color: gradient.to }}
        >
          {displayValue.toFixed(1)}
          <span className="text-text-muted" style={{ fontSize: size / 10 }}>
            %
          </span>
        </span>
        {showRiskLabel && (
          <span
            className="mt-1 rounded-full border px-3 py-0.5 font-mono text-xs font-semibold uppercase tracking-wider"
            style={{
              color: gradient.to,
              borderColor: `${gradient.to}66`,
              backgroundColor: `${gradient.to}1a`,
            }}
          >
            {meta.label}
          </span>
        )}
      </div>
    </div>
  );
}
