import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DomainId } from '@/types';
import { DOMAINS } from '@/core/constants/domains';
import { classifyRiskLevel } from '@/core/utils/riskClassifier';
import { RISK_LEVEL_META } from '@/types';

interface DomainScoreBarChartProps {
  domainScores: Record<DomainId, number>;
  onBarClick?: (domainId: DomainId) => void;
}

export function DomainScoreBarChart({ domainScores, onBarClick }: DomainScoreBarChartProps) {
  const data = DOMAINS.map((d) => {
    const score = Math.round((domainScores[d.id] ?? 0) * 10) / 10;
    return {
      id: d.id,
      name: d.shortName,
      pasal: d.pasalRange,
      skor: score,
      color: RISK_LEVEL_META[classifyRiskLevel(score)].color,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 56, bottom: 4, left: 8 }}>
        <XAxis
          type="number"
          domain={[0, 100]}
          tick={{ fill: '#7B9EC5', fontSize: 10, fontFamily: 'JetBrains Mono' }}
          stroke="#1E3A5F"
        />
        <YAxis
          type="category"
          dataKey="name"
          width={120}
          tick={{ fill: '#E8F4FD', fontSize: 11, fontFamily: 'Inter' }}
          stroke="#1E3A5F"
        />
        <RechartsTooltip
          cursor={{ fill: 'rgba(15, 52, 96, 0.25)' }}
          contentStyle={{
            backgroundColor: '#0D1B2E',
            border: '1px solid #1E3A5F',
            borderRadius: 8,
            color: '#E8F4FD',
            fontSize: 12,
          }}
          formatter={(value: number, _name, item) => [
            `${value}% — ${item.payload.pasal}`,
            'Skor',
          ]}
        />
        <Bar
          dataKey="skor"
          radius={[0, 6, 6, 0]}
          barSize={20}
          isAnimationActive
          animationDuration={1000}
          onClick={(entry) => onBarClick?.(entry.id as DomainId)}
          className={onBarClick ? 'cursor-pointer' : ''}
        >
          {data.map((entry) => (
            <Cell key={entry.id} fill={entry.color} fillOpacity={0.85} />
          ))}
          <LabelList
            dataKey="skor"
            position="right"
            formatter={(v: number) => `${v}%`}
            style={{ fill: '#E8F4FD', fontSize: 11, fontFamily: 'JetBrains Mono' }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
