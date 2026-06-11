import type { Gap } from '@/types';
import { RISK_LEVEL_META } from '@/types';
import { getDomain } from '@/core/constants/domains';
import { Badge } from '@/components/ui/Badge';

interface FindingsSummaryTableProps {
  gaps: Gap[];
  limit?: number;
}

const impactVariant: Record<string, 'danger' | 'warning' | 'info' | 'success'> = {
  CRITICAL: 'danger',
  HIGH: 'warning',
  MEDIUM: 'warning',
  LOW: 'info',
};

export function FindingsSummaryTable({ gaps, limit = 8 }: FindingsSummaryTableProps) {
  const rows = gaps.slice(0, limit);

  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-text-muted">
        Tidak ada temuan kritis. Postur kepatuhan dalam kondisi baik.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border font-mono text-[11px] uppercase tracking-wider text-text-muted">
            <th className="pb-2 pr-3 font-medium">Domain</th>
            <th className="pb-2 pr-3 font-medium">Pasal</th>
            <th className="pb-2 pr-3 font-medium">Gap</th>
            <th className="pb-2 pr-3 font-medium">Risiko</th>
            <th className="pb-2 font-medium">Prioritas</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((gap) => (
            <tr key={gap.questionId} className="border-b border-border/50 align-top">
              <td className="py-2.5 pr-3 text-text-primary whitespace-nowrap">
                {getDomain(gap.domainId).shortName}
              </td>
              <td className="py-2.5 pr-3 font-mono text-xs text-accent whitespace-nowrap">{gap.pasalRef}</td>
              <td className="py-2.5 pr-3 font-mono text-xs text-text-muted whitespace-nowrap">
                {gap.currentScore}/{gap.maxScore}
              </td>
              <td className="py-2.5 pr-3">
                <Badge variant={impactVariant[gap.riskImpact]} dot>
                  {RISK_LEVEL_META[gap.riskImpact].label}
                </Badge>
              </td>
              <td className="py-2.5 font-mono text-xs font-semibold text-text-primary">P{gap.priority}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
