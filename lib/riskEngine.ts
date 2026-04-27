// ============================================================
// RISK ENGINE — Scores, classifies, and generates alerts
// Smart Supply Chain Control Tower
// ============================================================

import type {
  EnrichedShipment,
  PredictionResult,
  Alert,
  DashboardKPIs,
  RiskDistribution,
  RiskLevel,
} from './types';

// ─── Risk Level Thresholds ───────────────────────────────────
export const RISK_THRESHOLDS = {
  HIGH: 65,    // >= 65% delay probability
  MEDIUM: 35,  // >= 35% delay probability
  LOW: 0,      // < 35%
};

// ─── Alert Counter (in-memory for MVP) ───────────────────────
let alertCounter = 1;

// ─── Alert Generation ─────────────────────────────────────────
export function generateAlert(
  shipment: EnrichedShipment,
  prediction: PredictionResult
): Alert {
  const severity = prediction.riskLevel === 'High' ? 'critical' : 'warning';
  const { weather, traffic } = shipment;

  // Build reason string based on factors
  const reasons: string[] = [];
  if (weather.severity > 0.6) reasons.push(`${weather.condition.toLowerCase()} weather`);
  else if (weather.severity > 0.3) reasons.push('moderate weather conditions');

  if (traffic.severity > 0.6) reasons.push(`${traffic.level.toLowerCase()} traffic`);
  else if (traffic.severity > 0.3) reasons.push('moderate traffic delays');

  if (shipment.historicalDelayRate > 0.25)
    reasons.push(`high historical delay rate (${Math.round(shipment.historicalDelayRate * 100)}%)`);

  const reasonStr =
    reasons.length > 0 ? reasons.join(', ') : 'multiple risk factors';

  // Build recommendation
  const recommendations: string[] = [];
  if (shipment.optimizedRoute && prediction.riskLevel === 'High') {
    recommendations.push(
      `Switch to alternate route — saves ${shipment.optimizedRoute.timeSaved} min`
    );
  }
  if (weather.severity > 0.7) recommendations.push('Hold shipment until weather clears');
  if (traffic.severity > 0.7) recommendations.push('Schedule during off-peak hours');
  if (shipment.cargo === 'Perishables') recommendations.push('Expedite dispatch immediately');
  if (recommendations.length === 0) recommendations.push('Monitor shipment closely');

  const id = `ALT-${String(alertCounter++).padStart(4, '0')}`;

  return {
    id,
    shipmentId: shipment.id,
    severity,
    title:
      prediction.riskLevel === 'High'
        ? `🚨 Critical Risk: ${shipment.id}`
        : `⚠️ Warning: ${shipment.id}`,
    message: `Shipment ${shipment.id} (${shipment.origin} → ${shipment.destination}) has ${prediction.delayProbability}% delay risk due to ${reasonStr}.`,
    reason: reasonStr,
    recommendation: recommendations[0],
    timestamp: new Date().toISOString(),
    read: false,
  };
}

// ─── Risk Score Display Helpers ───────────────────────────────
export function getRiskColor(level: RiskLevel): string {
  switch (level) {
    case 'High': return '#ef4444';
    case 'Medium': return '#f59e0b';
    case 'Low': return '#10b981';
  }
}

export function getRiskBadgeClass(level: RiskLevel): string {
  switch (level) {
    case 'High': return 'risk-high';
    case 'Medium': return 'risk-medium';
    case 'Low': return 'risk-low';
  }
}

export function getRiskGradient(probability: number): string {
  if (probability >= RISK_THRESHOLDS.HIGH) return 'from-red-900/40 to-red-600/20';
  if (probability >= RISK_THRESHOLDS.MEDIUM) return 'from-amber-900/40 to-amber-600/20';
  return 'from-emerald-900/40 to-emerald-600/20';
}

// ─── KPI Calculator ───────────────────────────────────────────
export function calculateKPIs(shipments: EnrichedShipment[]): DashboardKPIs {
  const total = shipments.length;
  const highRisk = shipments.filter((s) => s.prediction.riskLevel === 'High').length;
  const mediumRisk = shipments.filter((s) => s.prediction.riskLevel === 'Medium').length;
  const lowRisk = shipments.filter((s) => s.prediction.riskLevel === 'Low').length;
  const delayed = shipments.filter((s) =>
    s.status === 'Delayed' || s.prediction.riskLevel === 'High'
  ).length;
  const alerts = shipments.filter((s) => s.alert).length;
  const criticalAlerts = shipments.filter(
    (s) => s.alert?.severity === 'critical'
  ).length;
  const avgDelay =
    shipments.reduce((sum, s) => sum + s.prediction.delayProbability, 0) / total;

  return {
    totalShipments: total,
    onTimeCount: total - delayed,
    delayedCount: delayed,
    highRiskCount: highRisk,
    mediumRiskCount: mediumRisk,
    lowRiskCount: lowRisk,
    averageDelayProbability: Math.round(avgDelay),
    totalAlerts: alerts,
    criticalAlerts,
    onTimePercentage: Math.round(((total - delayed) / total) * 100),
    delayPercentage: Math.round((delayed / total) * 100),
  };
}

// ─── Risk Distribution ────────────────────────────────────────
export function calculateRiskDistribution(
  shipments: EnrichedShipment[]
): RiskDistribution[] {
  const total = shipments.length;
  const counts: Record<RiskLevel, number> = { High: 0, Medium: 0, Low: 0 };

  shipments.forEach((s) => {
    counts[s.prediction.riskLevel]++;
  });

  return (['High', 'Medium', 'Low'] as RiskLevel[]).map((level) => ({
    level,
    count: counts[level],
    percentage: Math.round((counts[level] / total) * 100),
  }));
}

// ─── Status Badge ─────────────────────────────────────────────
export function getStatusClass(status: string): string {
  switch (status) {
    case 'On Time': return 'status-on-time';
    case 'Delayed': return 'status-delayed';
    case 'High Risk': return 'status-high-risk';
    case 'In Transit': return 'status-in-transit';
    case 'Delivered': return 'status-delivered';
    default: return 'status-in-transit';
  }
}

// ─── Format Helpers ───────────────────────────────────────────
export function formatDelay(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function formatETA(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffH = Math.floor(diffMs / 1000 / 3600);
  const diffM = Math.floor((diffMs / 1000 / 60) % 60);

  if (diffMs < 0) return 'Overdue';
  if (diffH === 0) return `${diffM}m`;
  if (diffH < 24) return `${diffH}h ${Math.abs(diffM)}m`;
  const days = Math.floor(diffH / 24);
  return `${days}d ${diffH % 24}h`;
}
