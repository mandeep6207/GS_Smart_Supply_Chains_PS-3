'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { EnrichedShipment, Alert, DashboardKPIs } from '@/lib/types';
import { calculateKPIs } from '@/lib/riskEngine';
import DashboardCards from '@/components/DashboardCards';
import ShipmentTable from '@/components/ShipmentTable';
import AlertsPanel from '@/components/AlertsPanel';

// Dynamic import for Leaflet (SSR incompatible)
const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

interface DashboardData {
  shipments: EnrichedShipment[];
  alerts: Alert[];
  kpis: DashboardKPIs | null;
}

const REFRESH_INTERVAL = 30000; // 30 seconds

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>({
    shipments: [],
    alerts: [],
    kpis: null,
  });
  const [loading, setLoading] = useState(true);
  const [selectedShipment, setSelectedShipment] = useState<EnrichedShipment | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      const [shipmentsRes, alertsRes] = await Promise.all([
        fetch('/api/shipments'),
        fetch('/api/alerts'),
      ]);
      const shipmentsData = await shipmentsRes.json();
      const alertsData = await alertsRes.json();

      const shipments: EnrichedShipment[] = shipmentsData.data ?? [];
      const alerts: Alert[] = alertsData.data ?? [];
      const kpis = calculateKPIs(shipments);

      setData({ shipments, alerts, kpis });
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
    fetchData();
    const interval = setInterval(() => fetchData(true), REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div>
      {/* Top Bar */}
      <div className="topbar">
        <div>
          <div className="topbar-title">Control Tower Dashboard</div>
          <div className="topbar-subtitle">
            Real-time logistics intelligence · AI-powered risk detection
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {lastRefresh && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Updated {lastRefresh.toLocaleTimeString()}
            </div>
          )}
          <button
            id="refresh-dashboard"
            className="btn btn-ghost"
            onClick={() => fetchData(true)}
            disabled={refreshing}
            style={{ fontSize: 12 }}
          >
            {refreshing ? '⟳ Refreshing...' : '⟳ Refresh'}
          </button>
          <div className="live-indicator">
            <span className="live-dot" />
            <span>LIVE</span>
          </div>
        </div>
      </div>

      <div className="page-content">

        {/* KPI Cards */}
        <DashboardCards kpis={data.kpis} loading={loading} />

        {/* Map + Alerts Row */}
        <div className="grid-sidebar" style={{ marginBottom: 24 }}>
          {/* Map */}
          <div>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{
                padding: '14px 18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid var(--border-primary)',
              }}>
                <div className="section-title">
                  🗺️ Live Route Map
                  {selectedShipment && (
                    <span style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: 'var(--accent-blue)',
                      marginLeft: 8,
                    }}>
                      · Tracking {selectedShipment.id}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {data.shipments.length} active routes
                  </span>
                  {selectedShipment && (
                    <button
                      className="btn btn-ghost"
                      onClick={() => setSelectedShipment(null)}
                      style={{ fontSize: 11, padding: '3px 8px' }}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
              <MapView
                shipments={data.shipments}
                selectedShipment={selectedShipment}
                height={420}
              />
            </div>

            {/* Selected Shipment Details */}
            {selectedShipment && (
              <div className="card" style={{ marginTop: 16 }}>
                <div className="section-header">
                  <div>
                    <div className="section-title">
                      📋 Shipment Details — {selectedShipment.id}
                    </div>
                    <div className="section-subtitle">
                      {selectedShipment.origin} → {selectedShipment.destination}
                    </div>
                  </div>
                  <span className={`risk-badge risk-${selectedShipment.prediction.riskLevel.toLowerCase()}`}>
                    {selectedShipment.prediction.riskLevel} Risk
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Delay Probability</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: selectedShipment.prediction.riskLevel === 'High' ? 'var(--risk-high)' : selectedShipment.prediction.riskLevel === 'Medium' ? 'var(--risk-medium)' : 'var(--risk-low)' }}>
                      {selectedShipment.prediction.delayProbability}%
                    </div>
                    <div className="progress-bar" style={{ marginTop: 6 }}>
                      <div className="progress-fill" style={{
                        width: `${selectedShipment.prediction.delayProbability}%`,
                        background: selectedShipment.prediction.riskLevel === 'High' ? 'var(--risk-high)' : selectedShipment.prediction.riskLevel === 'Medium' ? 'var(--risk-medium)' : 'var(--risk-low)',
                      }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>Route Info</div>
                    <div className="metric-row" style={{ padding: '4px 0', borderBottom: 'none' }}>
                      <span className="metric-label" style={{ fontSize: 11 }}>Distance</span>
                      <span className="metric-value" style={{ fontSize: 12 }}>{selectedShipment.distance} km</span>
                    </div>
                    <div className="metric-row" style={{ padding: '4px 0', borderBottom: 'none' }}>
                      <span className="metric-label" style={{ fontSize: 11 }}>Carrier</span>
                      <span className="metric-value" style={{ fontSize: 12 }}>{selectedShipment.carrier}</span>
                    </div>
                    <div className="metric-row" style={{ padding: '4px 0', borderBottom: 'none' }}>
                      <span className="metric-label" style={{ fontSize: 11 }}>Cargo</span>
                      <span className="metric-value" style={{ fontSize: 12 }}>{selectedShipment.cargo}</span>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>Conditions</div>
                    <div className="metric-row" style={{ padding: '4px 0', borderBottom: 'none' }}>
                      <span className="metric-label" style={{ fontSize: 11 }}>Weather</span>
                      <span className="metric-value" style={{ fontSize: 12 }}>{selectedShipment.weather.condition}</span>
                    </div>
                    <div className="metric-row" style={{ padding: '4px 0', borderBottom: 'none' }}>
                      <span className="metric-label" style={{ fontSize: 11 }}>Traffic</span>
                      <span className="metric-value" style={{ fontSize: 12 }}>{selectedShipment.traffic.level}</span>
                    </div>
                    <div className="metric-row" style={{ padding: '4px 0', borderBottom: 'none' }}>
                      <span className="metric-label" style={{ fontSize: 11 }}>Confidence</span>
                      <span className="metric-value" style={{ fontSize: 12 }}>{Math.round(selectedShipment.prediction.confidence)}%</span>
                    </div>
                  </div>
                </div>

                {/* Risk Factors */}
                {selectedShipment.prediction.factors.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                      Risk Factors
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {selectedShipment.prediction.factors.map((f) => (
                        <span key={f.name} style={{
                          fontSize: 11,
                          padding: '3px 10px',
                          borderRadius: 20,
                          background: f.impact === 'high' ? 'rgba(239,68,68,0.12)' :
                            f.impact === 'medium' ? 'rgba(245,158,11,0.12)' : 'rgba(79,142,247,0.12)',
                          color: f.impact === 'high' ? 'var(--risk-high)' :
                            f.impact === 'medium' ? 'var(--risk-medium)' : 'var(--accent-blue)',
                          border: `1px solid ${f.impact === 'high' ? 'rgba(239,68,68,0.2)' :
                            f.impact === 'medium' ? 'rgba(245,158,11,0.2)' : 'rgba(79,142,247,0.2)'}`,
                        }}>
                          {f.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Optimized Route */}
                {selectedShipment.optimizedRoute && (
                  <div style={{
                    marginTop: 16,
                    padding: 14,
                    background: 'rgba(16,185,129,0.08)',
                    borderRadius: 10,
                    border: '1px solid rgba(16,185,129,0.2)',
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--risk-low)', marginBottom: 8 }}>
                      🔀 Recommended Alternate Route
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, fontSize: 12 }}>
                      <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 2 }}>Time Saved</div>
                        <div style={{ fontWeight: 700, color: 'var(--risk-low)', fontSize: 16 }}>
                          {selectedShipment.optimizedRoute.timeSaved} min
                        </div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 2 }}>New ETA</div>
                        <div style={{ fontWeight: 600 }}>
                          {new Date(selectedShipment.optimizedRoute.newETA).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 2 }}>Reason</div>
                        <div style={{ fontWeight: 600, fontSize: 11 }}>
                          {selectedShipment.optimizedRoute.reason}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Alerts Panel */}
          <div className="card" style={{ overflow: 'hidden', maxHeight: 'fit-content' }}>
            <div className="section-header">
              <div className="section-title">
                🔔 Active Alerts
              </div>
              <span style={{
                fontSize: 11, padding: '2px 8px', borderRadius: 20,
                background: 'rgba(239,68,68,0.15)', color: 'var(--risk-high)',
                fontWeight: 700,
              }}>
                {data.alerts.filter((a) => a.severity === 'critical').length} Critical
              </span>
            </div>
            <div style={{ maxHeight: 520, overflowY: 'auto' }}>
              <AlertsPanel
                alerts={data.alerts}
                loading={loading}
                maxItems={8}
              />
            </div>
          </div>
        </div>

        {/* Shipment Table */}
        <div className="card">
          <div className="section-header">
            <div>
              <div className="section-title">📋 Live Shipment Monitor</div>
              <div className="section-subtitle">
                Click a row to select shipment on map
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {['All', 'High Risk', 'Delayed'].map((filter) => (
                <button key={filter} className="btn btn-ghost" style={{ fontSize: 11, padding: '4px 10px' }}>
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <ShipmentTable
            shipments={data.shipments}
            loading={loading}
            onSelect={setSelectedShipment}
            selectedId={selectedShipment?.id}
          />
        </div>

      </div>
    </div>
  );
}
