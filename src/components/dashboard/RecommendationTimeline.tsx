import type { Recommendation } from '@/types';
import { TIMELINE_META } from '@/core/constants/recommendations';

interface RecommendationTimelineProps {
  recommendations: Recommendation[];
  limitPerPhase?: number;
}

export function RecommendationTimeline({ recommendations, limitPerPhase = 3 }: RecommendationTimelineProps) {
  const phases = (['IMMEDIATE', 'SHORT_TERM', 'LONG_TERM'] as const).map((phase) => ({
    ...TIMELINE_META[phase],
    items: recommendations.filter((r) => r.timeline === phase),
  }));

  return (
    <div className="relative space-y-6 pl-5">
      {/* garis vertikal timeline */}
      <div className="absolute bottom-2 left-[7px] top-2 w-px bg-border" />
      {phases.map((phase) => (
        <div key={phase.label} className="relative">
          <span
            className="absolute -left-5 top-1 h-3.5 w-3.5 rounded-full border-2 border-background"
            style={{ backgroundColor: phase.color }}
          />
          <div className="flex items-baseline gap-2">
            <h4 className="font-display text-sm font-semibold text-text-primary">{phase.label}</h4>
            <span className="font-mono text-[11px] text-text-muted">{phase.range}</span>
            <span
              className="ml-auto rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold"
              style={{ color: phase.color, backgroundColor: `${phase.color}1a` }}
            >
              {phase.items.length} aksi
            </span>
          </div>
          <ul className="mt-2 space-y-2">
            {phase.items.slice(0, limitPerPhase).map((rec) => (
              <li key={rec.gapId} className="rounded-md border border-border/60 bg-background/40 p-2.5">
                <p className="text-xs leading-relaxed text-text-primary line-clamp-2">{rec.action}</p>
                <p className="mt-1 font-mono text-[10px] text-text-muted">
                  {rec.pasalRef} · PIC: {rec.responsibleParty}
                </p>
              </li>
            ))}
            {phase.items.length === 0 && (
              <li className="text-xs text-text-muted">Tidak ada aksi pada fase ini.</li>
            )}
            {phase.items.length > limitPerPhase && (
              <li className="font-mono text-[11px] text-accent">
                +{phase.items.length - limitPerPhase} aksi lainnya di laporan lengkap
              </li>
            )}
          </ul>
        </div>
      ))}
    </div>
  );
}
