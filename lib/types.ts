// ============================================================
// CORE TYPE DEFINITIONS
// Smart Supply Chain Control Tower
// ============================================================

export type RiskLevel = 'Low' | 'Medium' | 'High';
export type ShipmentStatus = 'On Time' | 'In Transit' | 'Delayed' | 'High Risk' | 'Delivered';
export type WeatherCondition = 'Clear' | 'Cloudy' | 'Rain' | 'Heavy Rain' | 'Storm' | 'Fog';
export type TrafficLevel = 'Low' | 'Moderate' | 'Heavy' | 'Severe';

export interface GeoCoord {
  lat: number;
  lng: number;
}

export interface Shipment {
  id: string;
  origin: string;
  destination: string;
  originCoords: [number, number];
  destinationCoords: [number, number];
  routeCoords: [number, number][];
  carrier: string;
  status: ShipmentStatus;
  startTime: string;
  eta: string;
  distance: number;
  cargo: string;
  weight: number;
  historicalDelayRate: number;
}

export interface WeatherData {
  location: string;
  condition: WeatherCondition;
  windSpeed: number;
  visibility: number;
  severity: number; // 0–1 scale
}

export interface TrafficData {
  routeId: string;
  level: TrafficLevel;
  delay: number; // minutes
  severity: number; // 0–1 scale
}

export interface PredictionInput {
  distance: number;
  weatherSeverity: number;
  trafficSeverity: number;
  historicalDelayRate: number;
  cargoType: string;
  weight: number;
}

export interface PredictionResult {
  shipmentId: string;
  delayProbability: number;        // 0–100
  riskLevel: RiskLevel;
  estimatedDelay: number;          // minutes
  confidence: number;              // 0–100
  factors: RiskFactor[];
}

export interface RiskFactor {
  name: string;
  impact: 'low' | 'medium' | 'high';
  description: string;
}

export interface OptimizedRoute {
  shipmentId: string;
  originalRoute: [number, number][];
  alternateRoute: [number, number][];
  originalETA: string;
  newETA: string;
  timeSaved: number; // minutes
  distanceDiff: number; // km
  reason: string;
}

export interface Alert {
  id: string;
  shipmentId: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  reason: string;
  recommendation: string;
  timestamp: string;
  read: boolean;
}

export interface EnrichedShipment extends Shipment {
  weather: WeatherData;
  traffic: TrafficData;
  prediction: PredictionResult;
  optimizedRoute?: OptimizedRoute;
  alert?: Alert;
}

export interface DashboardKPIs {
  totalShipments: number;
  onTimeCount: number;
  delayedCount: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  averageDelayProbability: number;
  totalAlerts: number;
  criticalAlerts: number;
  onTimePercentage: number;
  delayPercentage: number;
}

export interface DelayTrendPoint {
  date: string;
  avgDelay: number;
  onTime: number;
  delayed: number;
  highRisk: number;
}

export interface RiskDistribution {
  level: RiskLevel;
  count: number;
  percentage: number;
}

export interface CarrierPerformance {
  carrier: string;
  deliveries: number;
  onTime: number;
  delayed: number;
  avgRisk: number;
}
