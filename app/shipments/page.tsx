'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { EnrichedShipment } from '@/lib/types';
import ShipmentTable from '@/components/ShipmentTable';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

type RiskFilter = 'All' | 'High' | 'Medium' | 'Low';

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<EnrichedShipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<EnrichedShipment | null>(null);
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('All');

  useEffect(() => {
    fetch('/api/shipments')
      .then((r) => r.json())
      .then((d) => {
        setShipments(d.data ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered =
    riskFilter === 'All'
      ? shipments
      : shipments.filter((s) => s.prediction.riskLevel === riskFilter);

  const counts = {
    All: shipments.length,
    High: shipments.filter((s) => s.prediction.riskLevel === 'High').length,
    Medium: shipments.filter((s) => s.prediction.riskLevel === 'Medium').length,
    Low: shipments.filter((s) => s.prediction.riskLevel === 'Low').length,
  };

  return (
    <div>
      <div className="topbar">
        <div>
          <div className="topbar-title">Shipment Monitor</div>
          <div className="topbar-subtitle">
            All active shipments · AI risk scoring enabled
          </div>
        </div>
        <div className="live-indicator">
          <span className="live-dot" />
          <span>{shipments.length} Active</span>
        </div>
      </div>

      <div className="page-content">

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {(['All', 'High', 'Medium', 'Low'] as RiskFilter[]).map((filter) => {
            const colors: Record<RiskFilter, string> = {
              All: 'var(--accent-blue)',
              High: 'var(--risk-high)',
              Medium: 'var(--risk-medium)',
              Low: 'var(--risk-low)',
            };
            const isActive = riskFilter === filter;
            return (
              <button
                key={filter}
                id={`filter-${filter.toLowerCase()}`}
                onClick={() => setRiskFilter(filter)}
                className="btn"
                style={{
                  background: isActive ? `${colors[filter]}20` : 'var(--bg-card)',
                  color: isActive ? colors[filter] : 'var(--text-secondary)',
                  border: `1px solid ${isActive ? `${colors[filter]}40` : 'var(--border-primary)'}`,
                  fontWeight: isActive ? 700 : 500,
                }}
              >
                {filter === 'All' ? '📦' : filter === 'High' ? '🚨' : filter === 'Medium' ? '⚠️' : '✅'}
                {' '}{filter} Risk
                <span style={{
                  marginLeft: 4,
                  fontSize: 11,
                  background: `${colors[filter]}20`,
                  color: colors[filter],
                  padding: '1px 6px',
                  borderRadius: 10,
                }}>
                  {counts[filter]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Map + Detail Panel */}
        {selected && (
          <div style={{ marginBottom: 20 }}>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="section-title">🗺️ Route: {selected.id}</div>
                  <span className={`status-badge status-${selected.status.toLowerCase().replace(' ', '-')}`}>
                    {selected.status}
                  </span>
                  <span className={`risk-badge risk-${selected.prediction.riskLevel.toLowerCase()}`}>
                    {selected.prediction.riskLevel} Risk · {selected.prediction.delayProbability}%
                  </span>
                  {selected.optimizedRoute && (
                    <span style={{
                      fontSize: 11, color: 'var(--risk-low)',
                      background: 'rgba(16,185,129,0.1)',
                      padding: '2px 8px', borderRadius: 6,
                      fontWeight: 600,
                    }}>
                      ✅ Alt route saves {selected.optimizedRoute.timeSaved} min
                    </span>
                  )}
                </div>
                <button className="btn btn-ghost" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => setSelected(null)}>
                  ✕ Close
                </button>
              </div>
              <MapView shipments={shipments} selectedShipment={selected} height={340} />
            </div>
          </div>
        )}

        {/* Shipment Table */}
        <div className="card">
          <div className="section-header">
            <div>
              <div className="section-title">📦 Shipment List</div>
              <div className="section-subtitle">
                {filtered.length} shipments · click to view on map
              </div>
            </div>
          </div>
          <ShipmentTable
            shipments={filtered}
            loading={loading}
            onSelect={setSelected}
            selectedId={selected?.id}
          />
        </div>

        {/* Shipment Cards Grid */}
        {!loading && filtered.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <div className="section-header">
              <div className="section-title">📬 Shipment Cards</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {filtered.map((s) => (
                <div
                  key={s.id}
                  className="card"
                  id={`card-${s.id}`}
                  onClick={() => setSelected(s)}
                  style={{
                    cursor: 'pointer',
                    borderColor: selected?.id === s.id ? 'var(--accent-blue)' : undefined,
                    background: selected?.id === s.id ? 'rgba(79,142,247,0.05)' : undefined,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Risk indicator bar */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                    background: s.prediction.riskLevel === 'High' ? 'var(--risk-high)' :
                      s.prediction.riskLevel === 'Medium' ? 'var(--risk-medium)' : 'var(--risk-low)',
                  }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: 'var(--accent-blue)' }}>
                      {s.id}
                    </span>
                    <span className={`risk-badge risk-${s.prediction.riskLevel.toLowerCase()}`}>
                      {s.prediction.riskLevel}
                    </span>
                  </div>

                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                    {s.origin} → {s.destination}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
                    {s.cargo} · {s.carrier}
                  </div>

                  <div className="progress-bar" style={{ marginBottom: 6 }}>
                    <div className="progress-fill" style={{
                      width: `${s.prediction.delayProbability}%`,
                      background: s.prediction.riskLevel === 'High' ? 'var(--risk-high)' :
                        s.prediction.riskLevel === 'Medium' ? 'var(--risk-medium)' : 'var(--risk-low)',
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
                    <span>Delay risk</span>
                    <span style={{ fontWeight: 600 }}>{s.prediction.delayProbability}%</span>
                  </div>

                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border-primary)', display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      ETA: {new Date(s.eta).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {s.weather.condition} · {s.traffic.level}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
