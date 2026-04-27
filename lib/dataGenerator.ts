// ============================================================
// DATA GENERATOR — Simulates real-time weather, traffic,
// and enriches shipments with live-ish data
// Smart Supply Chain Control Tower
// ============================================================

import type {
  Shipment,
  WeatherData,
  TrafficData,
  WeatherCondition,
  TrafficLevel,
  EnrichedShipment,
} from './types';
import sampleShipments from '../data/sampleShipments.json';
import { predictDelay } from './mlModel';
import { optimizeRoute } from './routing';
import { generateAlert } from './riskEngine';

// ─── Seed-based deterministic random ────────────────────────
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// ─── Weather Simulation ──────────────────────────────────────
const WEATHER_CONDITIONS: WeatherCondition[] = [
  'Clear', 'Cloudy', 'Rain', 'Heavy Rain', 'Storm', 'Fog',
];
const WEATHER_SEVERITY_MAP: Record<WeatherCondition, number> = {
  Clear: 0.05,
  Cloudy: 0.15,
  Rain: 0.40,
  'Heavy Rain': 0.70,
  Storm: 0.95,
  Fog: 0.55,
};

export function simulateWeather(location: string, seed: number): WeatherData {
  const idx = Math.floor(seededRandom(seed) * WEATHER_CONDITIONS.length);
  const condition = WEATHER_CONDITIONS[idx];
  const severity = WEATHER_SEVERITY_MAP[condition];
  return {
    location,
    condition,
    windSpeed: Math.round(seededRandom(seed + 1) * 80 + 5),
    visibility: Math.round((1 - severity) * 10 * 10) / 10,
    severity,
  };
}

// ─── Traffic Simulation ──────────────────────────────────────
const TRAFFIC_LEVELS: TrafficLevel[] = ['Low', 'Moderate', 'Heavy', 'Severe'];
const TRAFFIC_SEVERITY_MAP: Record<TrafficLevel, number> = {
  Low: 0.10,
  Moderate: 0.35,
  Heavy: 0.65,
  Severe: 0.90,
};
const TRAFFIC_DELAY_MAP: Record<TrafficLevel, number> = {
  Low: 10,
  Moderate: 40,
  Heavy: 90,
  Severe: 180,
};

export function simulateTraffic(routeId: string, seed: number): TrafficData {
  const hourOfDay = new Date().getHours();
  // Heavier traffic during rush hours
  const rushBonus = (hourOfDay >= 8 && hourOfDay <= 10) || (hourOfDay >= 17 && hourOfDay <= 19) ? 1 : 0;
  const raw = seededRandom(seed) * 3 + rushBonus;
  const idx = Math.min(Math.floor(raw), 3);
  const level = TRAFFIC_LEVELS[idx];
  return {
    routeId,
    level,
    delay: TRAFFIC_DELAY_MAP[level] + Math.round(seededRandom(seed + 2) * 20),
    severity: TRAFFIC_SEVERITY_MAP[level],
  };
}

// ─── Full Data Enrichment Pipeline ──────────────────────────
export function getEnrichedShipments(): EnrichedShipment[] {
  const shipments = sampleShipments as Shipment[];
  const now = Date.now();

  return shipments.map((shipment, i) => {
    const seed = now / 1000 / 60 / 30; // changes every 30 min for "live" feel
    const weather = simulateWeather(shipment.origin, seed + i * 17);
    const traffic = simulateTraffic(shipment.id, seed + i * 31);

    const prediction = predictDelay({
      distance: shipment.distance,
      weatherSeverity: weather.severity,
      trafficSeverity: traffic.severity,
      historicalDelayRate: shipment.historicalDelayRate,
      cargoType: shipment.cargo,
      weight: shipment.weight,
    }, shipment.id);

    const enriched: EnrichedShipment = {
      ...shipment,
      weather,
      traffic,
      prediction,
    };

    // Route optimization and alerts for high-risk shipments
    if (prediction.riskLevel === 'High' || prediction.riskLevel === 'Medium') {
      enriched.optimizedRoute = optimizeRoute(shipment, prediction);
    }

    if (prediction.riskLevel !== 'Low') {
      enriched.alert = generateAlert(enriched, prediction);
    }

    return enriched;
  });
}

// ─── Historical Analytics Data ───────────────────────────────
export function generateDelayTrends() {
  const days = 14;
  const now = new Date();
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (days - 1 - i));
    const seed = i * 7;
    const total = 20 + Math.floor(seededRandom(seed) * 10);
    const delayed = Math.floor(seededRandom(seed + 1) * total * 0.4);
    const highRisk = Math.floor(seededRandom(seed + 2) * delayed * 0.5);
    return {
      date: d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      total,
      onTime: total - delayed,
      delayed,
      highRisk,
      avgDelay: Math.round(seededRandom(seed + 3) * 120 + 10),
    };
  });
}

export function generateCarrierPerformance() {
  const carriers = [
    { carrier: 'BlueDart Express', deliveries: 142, seed: 10 },
    { carrier: 'DTDC Logistics', deliveries: 98, seed: 20 },
    { carrier: 'Gati Express', deliveries: 75, seed: 30 },
    { carrier: 'Ecom Express', deliveries: 110, seed: 40 },
    { carrier: 'Delhivery', deliveries: 186, seed: 50 },
  ];
  return carriers.map(({ carrier, deliveries, seed }) => {
    const delayRate = seededRandom(seed) * 0.3 + 0.05;
    const delayed = Math.floor(deliveries * delayRate);
    return {
      carrier,
      deliveries,
      onTime: deliveries - delayed,
      delayed,
      avgRisk: Math.round(delayRate * 100),
    };
  });
}
