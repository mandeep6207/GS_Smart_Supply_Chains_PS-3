/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  XAxis, YAxis, CartesianGrid, Legend, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, AreaChart, Area,
} from 'recharts';
import type { RiskDistribution, CarrierPerformance } from '@/lib/types';

// ─── Colors ─────────────────────────────────────────────────
const COLORS = {
  blue: '#4f8ef7',
  purple: '#a78bfa',
  cyan: '#22d3ee',
  green: '#10b981',
  amber: '#f59e0b',
  red: '#ef4444',
  muted: '#8b9dc3',
};

const RISK_COLORS: Record<string, string> = {
  High: '#ef4444',
  Medium: '#f59e0b',
  Low: '#10b981',
};

// ─── Custom Tooltip ──────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#111827',
      border: '1px solid rgba(99,120,180,0.25)',
      borderRadius: 8,
      padding: '10px 14px',
      fontSize: 12,
    }}>
      {label && <div style={{ color: '#8b9dc3', marginBottom: 6, fontWeight: 600 }}>{label}</div>}
      {payload.map((entry: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: entry.color }} />
          <span style={{ color: '#8b9dc3' }}>{entry.name}: </span>
          <span style={{ color: '#f0f4fc', fontWeight: 600 }}>{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Delay Trends Chart ──────────────────────────────────────
export function DelayTrendsChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="onTimeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.green} stopOpacity={0.3} />
            <stop offset="95%" stopColor={COLORS.green} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="delayGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.red} stopOpacity={0.3} />
            <stop offset="95%" stopColor={COLORS.red} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="highRiskGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.amber} stopOpacity={0.3} />
            <stop offset="95%" stopColor={COLORS.amber} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,120,180,0.1)" />
        <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="transparent" />
        <YAxis tick={{ fontSize: 10 }} stroke="transparent" />
        <Tooltip content={<CustomTooltip />} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
        <Area type="monotone" dataKey="onTime" name="On Time" stroke={COLORS.green} fill="url(#onTimeGrad)" strokeWidth={2} dot={false} />
        <Area type="monotone" dataKey="delayed" name="Delayed" stroke={COLORS.amber} fill="url(#delayGrad)" strokeWidth={2} dot={false} />
        <Area type="monotone" dataKey="highRisk" name="High Risk" stroke={COLORS.red} fill="url(#highRiskGrad)" strokeWidth={2} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Risk Distribution Pie ───────────────────────────────────
export function RiskDistributionChart({ data }: { data: RiskDistribution[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={3}
          dataKey="count"
          nameKey="level"
          label={({ name, value }: { name?: string; value?: number; cx?: number; cy?: number; midAngle?: number; innerRadius?: number; outerRadius?: number; percent?: number; index?: number }) => name ? `${name}` : ''}
          labelLine={false}
        >
          {data.map((entry) => (
            <Cell
              key={entry.level}
              fill={RISK_COLORS[entry.level]}
              stroke="transparent"
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ─── Carrier Performance Chart ───────────────────────────────
export function CarrierPerformanceChart({ data }: { data: CarrierPerformance[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,120,180,0.1)" />
        <XAxis dataKey="carrier" tick={{ fontSize: 9 }} stroke="transparent" />
        <YAxis tick={{ fontSize: 10 }} stroke="transparent" />
        <Tooltip content={<CustomTooltip />} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="onTime" name="On Time" fill={COLORS.green} radius={[4, 4, 0, 0]} />
        <Bar dataKey="delayed" name="Delayed" fill={COLORS.red} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Cargo Risk Chart ─────────────────────────────────────────
export function CargoRiskChart({ data }: { data: Array<{ cargo: string; avgRisk: number; shipments: number }> }) {
  const colored = data.map((d) => ({
    ...d,
    color: d.avgRisk >= 65 ? COLORS.red : d.avgRisk >= 35 ? COLORS.amber : COLORS.green,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={colored} layout="vertical" margin={{ top: 0, right: 30, left: 80, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,120,180,0.1)" horizontal={false} />
        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} stroke="transparent" />
        <YAxis type="category" dataKey="cargo" tick={{ fontSize: 10 }} stroke="transparent" width={80} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="avgRisk" name="Avg Risk %" radius={[0, 4, 4, 0]}>
          {colored.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Model Performance Radar ─────────────────────────────────
export function ModelPerformanceChart({ metadata }: {
  metadata: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
  }
}) {
  const data = [
    { metric: 'Accuracy', value: metadata.accuracy },
    { metric: 'Precision', value: metadata.precision },
    { metric: 'Recall', value: metadata.recall },
    { metric: 'F1 Score', value: metadata.f1Score },
    { metric: 'Coverage', value: 92.3 },
  ];

  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadarChart data={data}>
        <PolarGrid stroke="rgba(99,120,180,0.15)" />
        <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10 }} />
        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
        <Radar
          name="Model"
          dataKey="value"
          stroke={COLORS.blue}
          fill={COLORS.blue}
          fillOpacity={0.25}
          strokeWidth={2}
        />
        <Tooltip content={<CustomTooltip />} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

// ─── Mini Sparkline ───────────────────────────────────────────
export function MiniSparkline({ data, color = COLORS.blue }: { data: number[]; color?: string }) {
  const chartData = data.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height={50}>
      <LineChart data={chartData}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── Average Delay Line Chart ────────────────────────────────
export function AvgDelayChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,120,180,0.1)" />
        <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="transparent" />
        <YAxis tick={{ fontSize: 10 }} stroke="transparent" unit="m" />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="avgDelay"
          name="Avg Delay (min)"
          stroke={COLORS.purple}
          strokeWidth={2.5}
          dot={{ r: 3, fill: COLORS.purple }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
