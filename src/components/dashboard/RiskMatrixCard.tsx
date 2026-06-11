import type { Gap } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';

interface RiskMatrixCardProps {
  gaps: Gap[];
}

/**
 * Heatmap risiko 2x2: dampak (bobot domain) × kesenjangan (gap score).
 * Kuadran kanan-atas = dampak tinggi + gap besar = prioritas tertinggi.
 */
export function RiskMatrixCard({ gaps }: RiskMatrixCardProps) {
  const highImpact = (g: Gap) => g.riskImpact === 'CRITICAL' || g.riskImpact === 'HIGH';
  const bigGap = (g: Gap) => g.gapScore >= 2;

  const quadrants = [
    {
      label: 'Dampak Tinggi · Gap Besar',
      count: gaps.filter((g) => highImpact(g) && bigGap(g)).length,
      classes: 'bg-danger/20 border-danger/50 text-danger',
      action: 'Remediasi segera',
    },
    {
      label: 'Dampak Tinggi · Gap Kecil',
      count: gaps.filter((g) => highImpact(g) && !bigGap(g)).length,
      classes: 'bg-orange-400/15 border-orange-400/40 text-orange-400',
      action: 'Jadwalkan cepat',
    },
    {
      label: 'Dampak Rendah · Gap Besar',
      count: gaps.filter((g) => !highImpact(g) && bigGap(g)).length,
      classes: 'bg-warning/15 border-warning/40 text-warning',
      action: 'Rencanakan terstruktur',
    },
    {
      label: 'Dampak Rendah · Gap Kecil',
      count: gaps.filter((g) => !highImpact(g) && !bigGap(g)).length,
      classes: 'bg-info/15 border-info/40 text-info',
      action: 'Monitoring rutin',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Risk Matrix</CardTitle>
        <CardDescription>Distribusi temuan: dampak regulasi × besarnya kesenjangan</CardDescription>
      </CardHeader>
      <div className="grid grid-cols-2 gap-3">
        {quadrants.map((q) => (
          <div key={q.label} className={`rounded-md border p-4 ${q.classes}`}>
            <p className="font-display text-3xl font-bold tabular-nums">{q.count}</p>
            <p className="mt-1 text-xs font-medium leading-snug">{q.label}</p>
            <p className="mt-1.5 text-[11px] text-text-muted">{q.action}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
