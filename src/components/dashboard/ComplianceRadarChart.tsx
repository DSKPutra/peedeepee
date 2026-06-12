import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from 'recharts';
import type { DomainId, RiskLevel } from '@/types';
import { DOMAINS } from '@/core/constants/domains';

interface ComplianceRadarChartProps {
  domainScores: Record<DomainId, number>;
  riskLevel: RiskLevel;
}

export function ComplianceRadarChart({ domainScores }: ComplianceRadarChartProps) {
  const data = DOMAINS.map((d) => ({
    domain: d.shortName,
    skor: Math.round((domainScores[d.id] ?? 0) * 10) / 10,
    fullMark: 100,
  }));

  return (
    <ResponsiveContainer width="100%" height={340}>
      <RadarChart data={data} margin={{ top: 16, right: 32, bottom: 8, left: 32 }}>
        <PolarGrid stroke="#2A2D3E" />
        <PolarAngleAxis
          dataKey="domain"
          tick={{ fill: '#A8AABE', fontSize: 11, fontFamily: '"Plus Jakarta Sans"' }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tick={{ fill: '#666880', fontSize: 9, fontFamily: '"IBM Plex Mono"' }}
          stroke="#2A2D3E"
        />
        <Radar
          name="Skor Domain"
          dataKey="skor"
          stroke="#6269ED"
          strokeWidth={2}
          fill="rgba(74, 81, 224, 0.15)"
          isAnimationActive
          animationDuration={1200}
          dot={{ r: 4, fill: '#E8AC1A', strokeWidth: 0 }}
          label={{ fill: '#F0F1FA', fontSize: 10, fontFamily: '"IBM Plex Mono"', position: 'outside' }}
        />
        <RechartsTooltip
          contentStyle={{
            backgroundColor: '#1E2030',
            border: '1px solid #2A2D3E',
            borderRadius: 8,
            color: '#F0F1FA',
            fontSize: 12,
          }}
          formatter={(value: number) => [`${value}%`, 'Skor']}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
