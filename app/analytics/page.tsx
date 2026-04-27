/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import {
  DelayTrendsChart,
  RiskDistributionChart,
  CarrierPerformanceChart,
  CargoRiskChart,
  ModelPerformanceChart,
  AvgDelayChart,
} from '@/components/Charts';
import type { DashboardKPIs, RiskDistribution, CarrierPerformance } from '@/lib/types';

interface AnalyticsData {
  kpis: DashboardKPIs | null;
  riskDistribution: RiskDistribution[];
  delayTrends: any[];
  carrierPerformance: CarrierPerformance[];
  cargoRisk: Array<{ cargo: string; avgRisk: number; shipments: number }>;
  modelMetadata: {
    name: string;
    type: string;
    features: string[];
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    trainedOn: string;
    lastUpdated: string;
  } | null;
}

const ChartCard = ({
    title,
    subtitle,
    children,
    id,
    loading,
  }: {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    id: string;
    loading: boolean;
  }) => (
    <div className="card" id={id}>
      <div className="section-header" style={{ marginBottom: 20 }}>
        <div>
          <div className="section-title">{title}</div>
          {subtitle && <div className="section-subtitle">{subtitle}</div>}
        </div>
      </div>
      {loading ? (
        <div className="skeleton" style={{ height: 220, borderRadius: 8 }} />
      ) : (
        children
      )}
    </div>
  );

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData>({
    kpis: null,
    riskDistribution: [],
    delayTrends: [],
    carrierPerformance: [],
    cargoRisk: [],
    modelMetadata: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setData(d.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  

  return (
    <div>
      <div className="topbar">
        <div>
          <div className="topbar-title">Analytics & Insights</div>
          <div className="topbar-subtitle">
            Performance metrics · model analysis · trend detection
          </div>
        </div>
        <div className="live-indicator">
          <span className="live-dot" />
          <span>Auto-updating</span>
        </div>
      </div>

      <div className="page-content">

        {/* Key Metrics Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Fleet On-Time Rate', value: data.kpis ? `${data.kpis.onTimePercentage}%` : '—', icon: '📈', color: 'var(--risk-low)' },
            { label: 'Avg Risk Score', value: data.kpis ? `${data.kpis.averageDelayProbability}%` : '—', icon: '🎯', color: data.kpis?.averageDelayProbability && data.kpis.averageDelayProbability > 50 ? 'var(--risk-high)' : 'var(--risk-medium)' },
            { label: 'High Risk Count', value: data.kpis?.highRiskCount ?? '—', icon: '🚨', color: 'var(--risk-high)' },
            { label: 'Active Alerts', value: data.kpis?.totalAlerts ?? '—', icon: '🔔', color: 'var(--accent-blue)' },
            { label: 'Model Accuracy', value: data.modelMetadata ? `${data.modelMetadata.accuracy}%` : '—', icon: '🤖', color: 'var(--accent-purple)' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="kpi-card kpi-info" style={{ padding: '16px 18px' }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1 }}>{loading ? '...' : value}</div>
              <div className="kpi-label" style={{ marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Charts Row 1 */}
        <div className="grid-2" style={{ marginBottom: 20 }}>
          <ChartCard loading={loading}
            id="delay-trends-chart"
            title="📊 Delay Trends"
            subtitle="14-day shipment performance history"
          >
            <DelayTrendsChart data={data.delayTrends} />
          </ChartCard>

          <ChartCard loading={loading}
            id="avg-delay-chart"
            title="⏱️ Average Delay"
            subtitle="Estimated delay in minutes over time"
          >
            <AvgDelayChart data={data.delayTrends} />
          </ChartCard>
        </div>

        {/* Charts Row 2 */}
        <div className="grid-3" style={{ marginBottom: 20 }}>
          <ChartCard loading={loading}
            id="risk-distribution-chart"
            title="🎯 Risk Distribution"
            subtitle="Current fleet risk breakdown"
          >
            <RiskDistributionChart data={data.riskDistribution} />
            <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 8 }}>
              {data.riskDistribution.map((d) => (
                <div key={d.level} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: d.level === 'High' ? 'var(--risk-high)' : d.level === 'Medium' ? 'var(--risk-medium)' : 'var(--risk-low)' }}>
                    {d.count}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{d.level}</div>
                </div>
              ))}
            </div>
          </ChartCard>

          <ChartCard loading={loading}
            id="cargo-risk-chart"
            title="📦 Cargo Risk Analysis"
            subtitle="Risk by cargo type"
          >
            <CargoRiskChart data={data.cargoRisk} />
          </ChartCard>

          <ChartCard loading={loading}
            id="model-performance-chart"
            title="🤖 AI Model Performance"
            subtitle="Prediction model metrics"
          >
            <ModelPerformanceChart
              metadata={data.modelMetadata ?? { accuracy: 0, precision: 0, recall: 0, f1Score: 0 }}
            />
          </ChartCard>
        </div>

        {/* Carrier Performance */}
        <div className="grid-sidebar" style={{ marginBottom: 20 }}>
          <ChartCard loading={loading}
            id="carrier-performance-chart"
            title="🚚 Carrier Performance"
            subtitle="On-time vs delayed deliveries by carrier"
          >
            <CarrierPerformanceChart data={data.carrierPerformance} />
          </ChartCard>

          {/* Carrier Table */}
          <div className="card">
            <div className="section-header">
              <div className="section-title">🏆 Carrier Ranking</div>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Carrier</th>
                    <th>Deliveries</th>
                    <th>On-Time %</th>
                    <th>Avg Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 4 }).map((_, j) => (
                          <td key={j}><div className="skeleton" style={{ height: 14, borderRadius: 4 }} /></td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    data.carrierPerformance
                      .sort((a, b) => (b.onTime / b.deliveries) - (a.onTime / a.deliveries))
                      .map((c, i) => {
                        const onTimePct = Math.round((c.onTime / c.deliveries) * 100);
                        return (
                          <tr key={c.carrier}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 14 }}>
                                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '📦'}
                                </span>
                                <span style={{ fontSize: 12, fontWeight: 600 }}>{c.carrier}</span>
                              </div>
                            </td>
                            <td style={{ fontSize: 12 }}>{c.deliveries}</td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div className="progress-bar" style={{ width: 60 }}>
                                  <div className="progress-fill" style={{
                                    width: `${onTimePct}%`,
                                    background: onTimePct >= 80 ? 'var(--risk-low)' : onTimePct >= 65 ? 'var(--risk-medium)' : 'var(--risk-high)',
                                  }} />
                                </div>
                                <span style={{ fontSize: 11, fontWeight: 600 }}>{onTimePct}%</span>
                              </div>
                            </td>
                            <td>
                              <span style={{
                                fontSize: 11, fontWeight: 700,
                                color: c.avgRisk >= 50 ? 'var(--risk-high)' : c.avgRisk >= 30 ? 'var(--risk-medium)' : 'var(--risk-low)',
                              }}>
                                {c.avgRisk}%
                              </span>
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Model Details */}
        {data.modelMetadata && (
          <div className="card" id="model-details">
            <div className="section-header">
              <div className="section-title">🧠 AI Model Details</div>
              <span style={{
                fontSize: 11, padding: '3px 10px', borderRadius: 20,
                background: 'rgba(16,185,129,0.1)', color: 'var(--risk-low)',
                fontWeight: 700,
              }}>
                ACTIVE
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
              <div>
                <div className="metric-row">
                  <span className="metric-label">Model Name</span>
                  <span className="metric-value" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{data.modelMetadata.name}</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">Algorithm</span>
                  <span className="metric-value">{data.modelMetadata.type}</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">Trained On</span>
                  <span className="metric-value">{data.modelMetadata.trainedOn}</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">Last Updated</span>
                  <span className="metric-value">{data.modelMetadata.lastUpdated}</span>
                </div>
              </div>
              <div>
                {[
                  { label: 'Accuracy', value: data.modelMetadata.accuracy },
                  { label: 'Precision', value: data.modelMetadata.precision },
                  { label: 'Recall', value: data.modelMetadata.recall },
                  { label: 'F1 Score', value: data.modelMetadata.f1Score },
                ].map(({ label, value }) => (
                  <div key={label} className="metric-row">
                    <span className="metric-label">{label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="progress-bar" style={{ width: 80 }}>
                        <div className="progress-fill" style={{
                          width: `${value}%`,
                          background: value >= 85 ? 'var(--risk-low)' : value >= 70 ? 'var(--risk-medium)' : 'var(--risk-high)',
                        }} />
                      </div>
                      <span className="metric-value">{value}%</span>
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>
                  Input Features
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {data.modelMetadata.features.map((f) => (
                    <span key={f} className="chip">{f}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
