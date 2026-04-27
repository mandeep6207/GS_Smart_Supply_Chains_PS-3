/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useEffect, useRef, useState } from 'react';
import type { EnrichedShipment } from '@/lib/types';

interface MapViewProps {
  shipments: EnrichedShipment[];
  selectedShipment?: EnrichedShipment | null;
  height?: number;
}

export default function MapView({ shipments, selectedShipment, height = 480 }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layersRef = useRef<any[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setIsClient(true); }, []);

  // Initialize map
  useEffect(() => {
    if (!isClient || !mapRef.current || mapInstanceRef.current) return;

    (async () => {
      try {
        const L = (await import('leaflet')).default;
        await import('leaflet/dist/leaflet.css');

        // Fix default marker icons
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });

        const map = L.map(mapRef.current!, {
          center: [20.5937, 78.9629], // Center of India
          zoom: 5,
          zoomControl: true,
          scrollWheelZoom: true,
        });

        L.tileLayer(
          'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
          {
            attribution: '© OpenStreetMap contributors © CARTO',
            subdomains: 'abcd',
            maxZoom: 19,
          }
        ).addTo(map);

        mapInstanceRef.current = { map, L };
      } catch (err) {
        console.error('Map init error:', err);
        setMapError('Map failed to load');
      }
    })();

    return () => {
      if (mapInstanceRef.current?.map) {
        mapInstanceRef.current.map.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isClient]);

  // Draw shipment layers
  useEffect(() => {
    if (!mapInstanceRef.current || !shipments.length) return;
    const { map, L } = mapInstanceRef.current;

    // Clear previous layers
    layersRef.current.forEach((layer) => map.removeLayer(layer));
    layersRef.current = [];

    const RISK_COLORS: Record<string, string> = {
      High: '#ef4444',
      Medium: '#f59e0b',
      Low: '#10b981',
    };

    shipments.forEach((shipment) => {
      const riskColor = RISK_COLORS[shipment.prediction.riskLevel];
      const isSelected = selectedShipment?.id === shipment.id;

      // Draw original route
      const routeLine = L.polyline(shipment.routeCoords, {
        color: isSelected ? riskColor : riskColor + '80',
        weight: isSelected ? 4 : 2,
        dashArray: undefined,
        opacity: isSelected ? 1 : 0.7,
      });

      const popupContent = `
        <div style="font-family: Inter, sans-serif; min-width: 200px;">
          <div style="font-size:14px;font-weight:700;color:#f0f4fc;margin-bottom:8px;">
            🚚 ${shipment.id}
          </div>
          <div style="font-size:12px;color:#8b9dc3;margin-bottom:6px;">
            ${shipment.origin} → ${shipment.destination}
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
            <span style="background:${riskColor}20;color:${riskColor};padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;">
              ${shipment.prediction.riskLevel} Risk
            </span>
            <span style="background:rgba(79,142,247,0.15);color:#4f8ef7;padding:2px 8px;border-radius:4px;font-size:11px;">
              ${shipment.prediction.delayProbability}% delay
            </span>
          </div>
          <div style="font-size:11px;color:#8b9dc3;">
            🌦 ${shipment.weather.condition} · 🚗 ${shipment.traffic.level} Traffic<br/>
            📦 ${shipment.cargo} (${shipment.weight.toLocaleString()} kg)
          </div>
          ${shipment.optimizedRoute ? `
            <div style="margin-top:8px;padding:6px;background:rgba(16,185,129,0.1);border-radius:6px;font-size:11px;color:#10b981;">
              ✅ Alternate route saves ${shipment.optimizedRoute.timeSaved} min
            </div>` : ''}
        </div>
      `;

      routeLine.bindPopup(popupContent);
      routeLine.addTo(map);
      layersRef.current.push(routeLine);

      // Draw alternate route if available
      if (shipment.optimizedRoute && (isSelected || shipment.prediction.riskLevel === 'High')) {
        const altLine = L.polyline(shipment.optimizedRoute.alternateRoute, {
          color: '#10b981',
          weight: isSelected ? 3 : 2,
          dashArray: '8, 5',
          opacity: isSelected ? 0.9 : 0.6,
        });
        altLine.addTo(map);
        layersRef.current.push(altLine);
      }

      // Origin marker
      const originMarker = L.circleMarker(shipment.originCoords, {
        radius: isSelected ? 8 : 5,
        fillColor: riskColor,
        color: '#ffffff',
        weight: 1.5,
        opacity: 1,
        fillOpacity: 0.9,
      }).bindTooltip(`${shipment.id}: ${shipment.origin}`, { permanent: false });
      originMarker.addTo(map);
      layersRef.current.push(originMarker);

      // Destination marker
      const destMarker = L.circleMarker(shipment.destinationCoords, {
        radius: isSelected ? 8 : 5,
        fillColor: '#a78bfa',
        color: '#ffffff',
        weight: 1.5,
        opacity: 1,
        fillOpacity: 0.9,
      }).bindTooltip(`${shipment.id}: ${shipment.destination}`, { permanent: false });
      destMarker.addTo(map);
      layersRef.current.push(destMarker);
    });

    // Pan to selected shipment
    if (selectedShipment) {
      const center = [
        (selectedShipment.originCoords[0] + selectedShipment.destinationCoords[0]) / 2,
        (selectedShipment.originCoords[1] + selectedShipment.destinationCoords[1]) / 2,
      ] as [number, number];
      map.flyTo(center, 6, { duration: 1.2 });
    }
  }, [shipments, selectedShipment]);

  if (!isClient) {
    return (
      <div style={{ height, background: 'var(--bg-card)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-muted)' }}>Loading map...</div>
      </div>
    );
  }

  return (
    <div className="map-wrapper" style={{ height }}>
      {mapError ? (
        <div style={{
          height, background: 'var(--bg-card)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', flexDirection: 'column', gap: 8, color: 'var(--text-muted)',
        }}>
          <div style={{ fontSize: 40 }}>🗺️</div>
          <div>Map unavailable</div>
          <div style={{ fontSize: 12 }}>{mapError}</div>
        </div>
      ) : (
        <>
          <div ref={mapRef} style={{ height: '100%', width: '100%' }} id="supply-chain-map" />
          <div className="map-legend">
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
              Route Legend
            </div>
            {[
              { color: '#ef4444', label: 'High Risk Route' },
              { color: '#f59e0b', label: 'Medium Risk' },
              { color: '#10b981', label: 'Low Risk / Alt Route' },
              { color: '#a78bfa', label: 'Destination' },
            ].map(({ color, label }) => (
              <div key={label} className="legend-item">
                <div className="legend-line" style={{ background: color }} />
                <span>{label}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--border-primary)', marginTop: 6, paddingTop: 6, fontSize: 10, color: 'var(--text-muted)' }}>
              --- Alternate route
            </div>
          </div>
        </>
      )}
    </div>
  );
}
