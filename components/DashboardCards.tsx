'use client';

import type { DashboardKPIs } from '@/lib/types';

interface DashboardCardsProps {
  kpis: DashboardKPIs | null;
  loading?: boolean;
}

interface KPIConfig {
  id: string;
  label: string;
  getValue: (k: DashboardKPIs) => string | number;
  icon: string;
  colorClass: string;
  iconBg: string;
  change?: (k: DashboardKPIs) => string;
  changeColor?: (k: DashboardKPIs) => string;
}

const KPI_CONFIGS: KPIConfig[] = [
  {
    id: 'total-shipments',
    label: 'Total Shipments',
    getValue: (k) => k.totalShipments,
    icon: '📦',
    colorClass: 'kpi-info',
    iconBg: 'rgba(79,142,247,0.15)',
    change: (k) => `${k.onTimePercentage}% on track`,
    changeColor: () => 'var(--risk-low)',
  },
  {
    id: 'on-time-deliveries',
    label: 'On-Time',
    getValue: (k) => `${k.onTimePercentage}%`,
    icon: '✅',
    colorClass: 'kpi-success',
    iconBg: 'rgba(16,185,129,0.15)',
    change: (k) => `${k.onTimeCount} shipments`,
    changeColor: () => 'var(--risk-low)',
  },
  {
    id: 'high-risk-shipments',
    label: 'High Risk',
    getValue: (k) => k.highRiskCount,
    icon: '🚨',
    colorClass: 'kpi-danger',
    iconBg: 'rgba(239,68,68,0.15)',
    change: (k) => `${Math.round((k.highRiskCount / k.totalShipments) * 100)}% of fleet`,
    changeColor: (k) => k.highRiskCount > 3 ? 'var(--risk-high)' : 'var(--risk-medium)',
  },
  {
    id: 'delayed-shipments',
    label: 'Delayed',
    getValue: (k) => k.delayedCount,
    icon: '⏱️',
    colorClass: 'kpi-warning',
    iconBg: 'rgba(245,158,11,0.15)',
    change: (k) => `${k.delayPercentage}% delay rate`,
    changeColor: (k) => k.delayPercentage > 30 ? 'var(--risk-high)' : 'var(--risk-medium)',
  },
  {
    id: 'active-alerts',
    label: 'Active Alerts',
    getValue: (k) => k.totalAlerts,
    icon: '🔔',
    colorClass: 'kpi-danger',
    iconBg: 'rgba(239,68,68,0.12)',
    change: (k) => `${k.criticalAlerts} critical`,
    changeColor: (k) => k.criticalAlerts > 0 ? 'var(--risk-high)' : 'var(--text-muted)',
  },
  {
    id: 'avg-delay-probability',
    label: 'Avg Risk Score',
    getValue: (k) => `${k.averageDelayProbability}%`,
    icon: '🎯',
    colorClass: 'kpi-warning',
    iconBg: 'rgba(167,139,250,0.15)',
    change: (k) => k.averageDelayProbability > 50 ? '↑ Above threshold' : '↓ Within tolerance',
    changeColor: (k) => k.averageDelayProbability > 50 ? 'var(--risk-high)' : 'var(--risk-low)',
  },
];

export default function DashboardCards({ kpis, loading }: DashboardCardsProps) {
  if (loading || !kpis) {
    return (
      <div className="kpi-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="kpi-card" style={{ minHeight: 130 }}>
            <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 10, marginBottom: 14 }} />
            <div className="skeleton" style={{ width: '60%', height: 32, marginBottom: 8 }} />
            <div className="skeleton" style={{ width: '80%', height: 12 }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="kpi-grid">
      {KPI_CONFIGS.map((config) => {
        const colorClass = config.colorClass;

        return (
          <div
            key={config.id}
            id={config.id}
            className={`kpi-card ${colorClass} fade-in`}
            role="region"
            aria-label={config.label}
          >
            <div className="kpi-icon" style={{ background: config.iconBg }}>
              {config.icon}
            </div>
            <div className="kpi-value">{config.getValue(kpis)}</div>
            <div className="kpi-label">{config.label}</div>
            {config.change && (
              <div
                className="kpi-change"
                style={{ color: config.changeColor?.(kpis) ?? 'var(--text-muted)' }}
              >
                {config.change(kpis)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
