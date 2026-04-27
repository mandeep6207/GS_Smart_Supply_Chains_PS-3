'use client';

import type { Alert } from '@/lib/types';

interface AlertsPanelProps {
  alerts: Alert[];
  loading?: boolean;
  compact?: boolean;
  maxItems?: number;
}

const SEVERITY_CONFIG = {
  critical: {
    icon: '🚨',
    bgClass: 'critical',
    color: 'var(--risk-high)',
    label: 'CRITICAL',
  },
  warning: {
    icon: '⚠️',
    bgClass: 'warning',
    color: 'var(--risk-medium)',
    label: 'WARNING',
  },
  info: {
    icon: 'ℹ️',
    bgClass: 'info',
    color: 'var(--accent-blue)',
    label: 'INFO',
  },
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

export default function AlertsPanel({ alerts, loading, compact = false, maxItems }: AlertsPanelProps) {
  const displayed = maxItems ? alerts.slice(0, maxItems) : alerts;

  if (loading) {
    return (
      <div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="alert-card critical" style={{ opacity: 0.4 }}>
            <div className="skeleton" style={{ width: 24, height: 24, borderRadius: '50%' }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton" style={{ height: 14, width: '70%', marginBottom: 6, borderRadius: 4 }} />
              <div className="skeleton" style={{ height: 12, width: '100%', borderRadius: 4 }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!alerts.length) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '40px 20px',
        color: 'var(--text-muted)',
      }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>All clear!</div>
        <div style={{ fontSize: 12 }}>No active alerts at this time</div>
      </div>
    );
  }

  return (
    <div id="alerts-panel">
      {displayed.map((alert, idx) => {
        const config = SEVERITY_CONFIG[alert.severity] ?? SEVERITY_CONFIG.info;
        return (
          <div
            key={alert.id}
            id={`alert-${alert.id}`}
            className={`alert-card ${config.bgClass} fade-in`}
            style={{ animationDelay: `${idx * 0.05}s` }}
            role="alert"
            aria-label={alert.title}
          >
            <div className="alert-icon">{config.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    letterSpacing: '0.1em',
                    color: config.color,
                    background: `${config.color}15`,
                    padding: '1px 5px',
                    borderRadius: 3,
                  }}
                >
                  {config.label}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontFamily: 'JetBrains Mono, monospace',
                    color: 'var(--accent-blue)',
                    fontWeight: 600,
                  }}
                >
                  {alert.shipmentId}
                </span>
              </div>
              <div className="alert-title">{alert.title}</div>
              {!compact && (
                <div className="alert-message">{alert.message}</div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                <span className="alert-recommendation">
                  💡 {alert.recommendation}
                </span>
                <span className="alert-time">{timeAgo(alert.timestamp)}</span>
              </div>
            </div>
          </div>
        );
      })}

      {maxItems && alerts.length > maxItems && (
        <div style={{ textAlign: 'center', padding: '8px 0', fontSize: 12, color: 'var(--text-muted)' }}>
          +{alerts.length - maxItems} more alerts
        </div>
      )}
    </div>
  );
}
