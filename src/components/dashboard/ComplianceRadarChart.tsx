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
import { RISK_LEVEL_META } from '@/types';
import { DOMAINS } from '@/core/constants/domains';

interface ComplianceRadarChartProps {
  domainScores: Record<DomainId, number>;
  riskLevel: RiskLevel;
}

export function ComplianceRadarChart({ domainScores, riskLevel }: ComplianceRadarChartProps) {
  const color = RISK_LEVEL_META[riskLevel].color;
  const data = DOMAINS.map((d) => ({
    domain: d.shortName,
    skor: Math.round((domainScores[d.id] ?? 0) * 10) / 10,
    fullMark: 100,
  }));

  return (
    <ResponsiveContainer width="100%" height={340}>
      <RadarChart data={data} margin={{ top: 16, right: 32, bottom: 8, left: 32 }}>
        <defs>
          <linearGradient id="radarFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00D4FF" stopOpacity={0.45} />
            <stop offset="100%" stopColor={color} stopOpacity={0.15} />
          </linearGradient>
        </defs>
        <PolarGrid stroke="#1E3A5F" />
        <PolarAngleAxis
          dataKey="domain"
          tick={{ fill: '#7B9EC5', fontSize: 11, fontFamily: 'Inter' }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tick={{ fill: '#7B9EC5', fontSize: 9, fontFamily: 'JetBrains Mono' }}
          stroke="#1E3A5F"
        />
        <Radar
          name="Skor Domain"
          dataKey="skor"
          stroke={color}
          strokeWidth={2}
          fill="url(#radarFill)"
          isAnimationActive
          animationDuration={1200}
          dot={{ r: 3.5, fill: color, strokeWidth: 0 }}
          label={{ fill: '#E8F4FD', fontSize: 10, fontFamily: 'JetBrains Mono', position: 'outside' }}
        />
        <RechartsTooltip
          contentStyle={{
            backgroundColor: '#0D1B2E',
            border: '1px solid #1E3A5F',
            borderRadius: 8,
            color: '#E8F4FD',
            fontSize: 12,
          }}
          formatter={(value: number) => [`${value}%`, 'Skor']}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
