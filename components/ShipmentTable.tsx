'use client';

import { useState } from 'react';
import type { EnrichedShipment } from '@/lib/types';
import { getRiskBadgeClass, getStatusClass, formatETA, formatDelay } from '@/lib/riskEngine';

interface ShipmentTableProps {
  shipments: EnrichedShipment[];
  loading?: boolean;
  onSelect?: (shipment: EnrichedShipment) => void;
  selectedId?: string;
  compact?: boolean;
}

type SortKey = 'id' | 'origin' | 'destination' | 'delayProbability' | 'eta' | 'status';
type SortDir = 'asc' | 'desc';

const SortIcon = ({ col, sortKey, sortDir }: { col: SortKey, sortKey: SortKey | null, sortDir: 'asc' | 'desc' }) => (
    <span style={{ opacity: sortKey === col ? 1 : 0.3, fontSize: 10 }}>
      {sortKey === col ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  );

export default function ShipmentTable({
  shipments,
  loading,
  onSelect,
  selectedId,
  compact = false,
}: ShipmentTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('delayProbability');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [search, setSearch] = useState('');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  };

  const filtered = shipments
    .filter((s) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        s.id.toLowerCase().includes(q) ||
        s.origin.toLowerCase().includes(q) ||
        s.destination.toLowerCase().includes(q) ||
        s.cargo.toLowerCase().includes(q) ||
        s.carrier.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;
      switch (sortKey) {
        case 'delayProbability':
          aVal = a.prediction.delayProbability;
          bVal = b.prediction.delayProbability;
          break;
        case 'eta':
          aVal = new Date(a.eta).getTime();
          bVal = new Date(b.eta).getTime();
          break;
        case 'id': aVal = a.id; bVal = b.id; break;
        case 'origin': aVal = a.origin; bVal = b.origin; break;
        case 'destination': aVal = a.destination; bVal = b.destination; break;
        case 'status': aVal = a.status; bVal = b.status; break;
        default: aVal = a.id; bVal = b.id;
      }
      if (typeof aVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal);
      }
      return sortDir === 'asc' ? aVal - (bVal as number) : (bVal as number) - aVal;
    });

  

  if (loading) {
    return (
      <div className="table-container">
        <div className="skeleton" style={{ height: 40, margin: 16, borderRadius: 8 }} />
        <table className="data-table">
          <tbody>
            {Array.from({ length: 6 }).map((_, i) => (
              <tr key={i}>
                {Array.from({ length: 7 }).map((_, j) => (
                  <td key={j}>
                    <div className="skeleton" style={{ height: 16, width: '80%', borderRadius: 4 }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div>
      {!compact && (
        <div style={{ marginBottom: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <span style={{
              position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-muted)', fontSize: 14,
            }}>🔍</span>
            <input
              id="shipment-search"
              type="text"
              placeholder="Search shipments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-primary)',
                borderRadius: 8,
                padding: '8px 12px 8px 36px',
                color: 'var(--text-primary)',
                fontSize: 13,
                outline: 'none',
              }}
            />
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            {filtered.length} / {shipments.length} shipments
          </div>
        </div>
      )}

      <div className="table-container">
        <table className="data-table" id="shipment-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('id')} style={{ cursor: 'pointer' }}>
                ID <SortIcon col="id" sortKey={sortKey} sortDir={sortDir} />
              </th>
              <th onClick={() => handleSort('origin')} style={{ cursor: 'pointer' }}>
                Route <SortIcon col="origin" sortKey={sortKey} sortDir={sortDir} />
              </th>
              <th>Cargo</th>
              <th>Carrier</th>
              <th>Weather</th>
              <th>Traffic</th>
              <th onClick={() => handleSort('delayProbability')} style={{ cursor: 'pointer' }}>
                Risk Score <SortIcon col="delayProbability" sortKey={sortKey} sortDir={sortDir} />
              </th>
              <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>
                Status <SortIcon col="status" sortKey={sortKey} sortDir={sortDir} />
              </th>
              <th onClick={() => handleSort('eta')} style={{ cursor: 'pointer' }}>
                ETA <SortIcon col="eta" sortKey={sortKey} sortDir={sortDir} />
              </th>
              {!compact && <th>Delay Est.</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map((shipment) => {
              const isSelected = shipment.id === selectedId;
              const { prediction, weather, traffic } = shipment;
              const riskClass = getRiskBadgeClass(prediction.riskLevel);
              const statusClass = getStatusClass(shipment.status);

              return (
                <tr
                  key={shipment.id}
                  id={`row-${shipment.id}`}
                  onClick={() => onSelect?.(shipment)}
                  style={{
                    background: isSelected ? 'rgba(79,142,247,0.08)' : undefined,
                    borderLeft: isSelected ? '2px solid var(--accent-blue)' : '2px solid transparent',
                  }}
                >
                  <td>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 600, color: 'var(--accent-blue)' }}>
                      {shipment.id}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{shipment.origin}</span>
                      <span style={{ color: 'var(--text-muted)' }}>→</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{shipment.destination}</span>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                      {shipment.distance} km
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: 12 }}>{shipment.cargo}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{shipment.weight.toLocaleString()} kg</div>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {shipment.carrier}
                  </td>
                  <td>
                    <div style={{ fontSize: 11 }}>
                      <span style={{
                        color: weather.severity > 0.6 ? 'var(--risk-high)' : weather.severity > 0.3 ? 'var(--risk-medium)' : 'var(--risk-low)',
                      }}>
                        {getWeatherIcon(weather.condition)} {weather.condition}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span style={{
                      fontSize: 11, fontWeight: 600,
                      color: traffic.level === 'Severe' ? 'var(--risk-high)' :
                        traffic.level === 'Heavy' ? 'var(--risk-medium)' : 'var(--risk-low)',
                    }}>
                      {traffic.level}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span className={`risk-badge ${riskClass}`}>
                        {prediction.riskLevel}
                      </span>
                      <div className="progress-bar" style={{ width: 80 }}>
                        <div
                          className="progress-fill"
                          style={{
                            width: `${prediction.delayProbability}%`,
                            background: prediction.riskLevel === 'High' ? 'var(--risk-high)' :
                              prediction.riskLevel === 'Medium' ? 'var(--risk-medium)' : 'var(--risk-low)',
                          }}
                        />
                      </div>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                        {prediction.delayProbability}% risk
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${statusClass}`}>
                      {shipment.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>
                      {formatETA(shipment.eta)}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      {new Date(shipment.eta).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </div>
                  </td>
                  {!compact && (
                    <td>
                      {prediction.estimatedDelay > 0 ? (
                        <span style={{ fontSize: 12, color: prediction.estimatedDelay > 60 ? 'var(--risk-high)' : 'var(--risk-medium)' }}>
                          +{formatDelay(prediction.estimatedDelay)}
                        </span>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--risk-low)' }}>None</span>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
            <div>No shipments match your search</div>
          </div>
        )}
      </div>
    </div>
  );
}

function getWeatherIcon(condition: string): string {
  const map: Record<string, string> = {
    Clear: '☀️', Cloudy: '⛅', Rain: '🌧️',
    'Heavy Rain': '⛈️', Storm: '🌪️', Fog: '🌫️',
  };
  return map[condition] ?? '🌡️';
}
