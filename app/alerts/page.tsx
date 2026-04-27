/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import type { Alert } from '@/lib/types';
import AlertsPanel from '@/components/AlertsPanel';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning'>('all');
  const [summary, setSummary] = useState({ total: 0, critical: 0, warning: 0, unread: 0 });

  useEffect(() => {
    fetch('/api/alerts')
      .then((r) => r.json())
      .then((d) => {
        setAlerts(d.data ?? []);
        setSummary(d.summary ?? {});
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered =
    filter === 'all'
      ? alerts
      : alerts.filter((a) => a.severity === filter);

  const criticalQueue = alerts.filter((a) => a.severity === 'critical').length;
  const warningQueue = alerts.filter((a) => a.severity === 'warning').length;

  function handleMarkAllRead() {
    const nextAlerts = alerts.map((alert) => ({ ...alert, read: true }));
    setAlerts(nextAlerts);
    setSummary((current) => ({ ...current, unread: 0 }));
  }

  return (
    <div>
      <div className="topbar">
        <div>
          <div className="topbar-title">Smart Alerts Center</div>
          <div className="topbar-subtitle">
            AI-generated disruption warnings · real-time monitoring
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{
            padding: '4px 12px',
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 8,
            fontSize: 12,
            color: 'var(--risk-high)',
            fontWeight: 700,
          }}>
            🚨 {summary.critical} Critical
          </div>
          <div style={{
            padding: '4px 12px',
            background: 'rgba(245,158,11,0.12)',
            border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: 8,
            fontSize: 12,
            color: 'var(--risk-medium)',
            fontWeight: 700,
          }}>
            ⚠️ {summary.warning} Warning
          </div>
          <button className="btn btn-ghost" onClick={handleMarkAllRead} style={{ fontSize: 12 }}>
            Mark all read
          </button>
        </div>
      </div>

      <div className="page-content">

        <div className="alerts-summary-grid">
          <div className="alerts-summary-card">
            <span>Total alerts</span>
            <strong>{loading ? '...' : summary.total}</strong>
            <p>Current active queue across the fleet.</p>
          </div>
          <div className="alerts-summary-card">
            <span>Critical queue</span>
            <strong>{loading ? '...' : criticalQueue}</strong>
            <p>Immediate intervention required.</p>
          </div>
          <div className="alerts-summary-card">
            <span>Unread</span>
            <strong>{loading ? '...' : summary.unread}</strong>
            <p>Alerts not yet acknowledged in the demo session.</p>
          </div>
        </div>

        {/* Summary Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Total Alerts', value: summary.total, icon: '🔔', color: 'var(--accent-blue)' },
            { label: 'Critical', value: summary.critical, icon: '🚨', color: 'var(--risk-high)' },
            { label: 'Warnings', value: summary.warning, icon: '⚠️', color: 'var(--risk-medium)' },
            { label: 'Unread', value: summary.unread, icon: '📫', color: 'var(--accent-purple)' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="kpi-card" style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color }}>{loading ? '...' : value}</div>
              <div className="kpi-label">{label}</div>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[
            { key: 'all', label: 'All Alerts', count: summary.total },
            { key: 'critical', label: 'Critical', count: summary.critical },
            { key: 'warning', label: 'Warnings', count: summary.warning },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              id={`alert-filter-${key}`}
              onClick={() => setFilter(key as any)}
              className="btn"
              style={{
                background: filter === key ? 'rgba(79,142,247,0.15)' : 'var(--bg-card)',
                color: filter === key ? 'var(--accent-blue)' : 'var(--text-secondary)',
                border: `1px solid ${filter === key ? 'rgba(79,142,247,0.3)' : 'var(--border-primary)'}`,
                fontWeight: filter === key ? 700 : 500,
              }}
            >
              {label}
              <span style={{
                marginLeft: 6,
                fontSize: 11,
                background: 'rgba(79,142,247,0.15)',
                color: 'var(--accent-blue)',
                padding: '1px 6px',
                borderRadius: 10,
              }}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* Alerts Grid */}
        <div className="grid-sidebar">
          {/* Main Alerts List */}
          <div className="card">
            <div className="section-header">
              <div className="section-title">
                {filter === 'all' ? '🔔 All Alerts' : filter === 'critical' ? '🚨 Critical Alerts' : '⚠️ Warnings'}
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {filtered.length} alerts
              </span>
            </div>
            <div className="alerts-queue-note">
              {warningQueue} warning alerts and {criticalQueue} critical alerts are active right now.
            </div>
            <AlertsPanel alerts={filtered} loading={loading} />
          </div>

          {/* Alert Info Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* How AI Alerts Work */}
            <div className="card">
              <div className="section-title" style={{ marginBottom: 16 }}>🤖 How AI Alerts Work</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { step: '1', title: 'Data Collection', desc: 'Real-time weather, traffic, and position data gathered every 30 seconds', icon: '📡' },
                  { step: '2', title: 'ML Prediction', desc: 'Weighted logistic regression calculates delay probability from 6 key features', icon: '🧠' },
                  { step: '3', title: 'Risk Classification', desc: 'Probability mapped to Low / Medium / High using calibrated thresholds', icon: '🎯' },
                  { step: '4', title: 'Alert Generation', desc: 'Alerts generated with reason, severity, and actionable recommendations', icon: '🔔' },
                  { step: '5', title: 'Route Optimization', desc: 'Dijkstra algorithm computes alternate routes for high-risk shipments', icon: '🔀' },
                ].map(({ step, title, desc, icon }) => (
                  <div key={step} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', background: 'rgba(79,142,247,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, flexShrink: 0, color: 'var(--accent-blue)',
                    }}>
                      {icon}
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Alert Legend */}
            <div className="card">
              <div className="section-title" style={{ marginBottom: 12 }}>Alert Severity Guide</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { severity: '🚨 Critical', range: '≥ 65% risk', color: 'var(--risk-high)', desc: 'Immediate action required' },
                  { severity: '⚠️ Warning', range: '35–64% risk', color: 'var(--risk-medium)', desc: 'Monitor closely' },
                  { severity: 'ℹ️ Info', range: '< 35% risk', color: 'var(--accent-blue)', desc: 'Informational only' },
                ].map(({ severity, range, color, desc }) => (
                  <div key={severity} style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: `${color}08`,
                    border: `1px solid ${color}20`,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color }}>{severity}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{range}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
