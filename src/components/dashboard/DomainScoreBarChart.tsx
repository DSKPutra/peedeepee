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
          tick={{ fill: '#666880', fontSize: 10, fontFamily: '"IBM Plex Mono"' }}
          stroke="#2A2D3E"
        />
        <YAxis
          type="category"
          dataKey="name"
          width={120}
          tick={{ fill: '#F0F1FA', fontSize: 11, fontFamily: '"Plus Jakarta Sans"' }}
          stroke="#2A2D3E"
        />
        <RechartsTooltip
          cursor={{ fill: 'rgba(74, 81, 224, 0.12)' }}
          contentStyle={{
            backgroundColor: '#1E2030',
            border: '1px solid #2A2D3E',
            borderRadius: 8,
            color: '#F0F1FA',
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
            style={{ fill: '#F0F1FA', fontSize: 11, fontFamily: '"IBM Plex Mono"' }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
