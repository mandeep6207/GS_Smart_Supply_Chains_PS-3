/* eslint-disable @typescript-eslint/no-unused-vars */
// ============================================================
// ROUTING ENGINE — Dijkstra-based route optimization
// Generates alternate routes when risk is high
// Smart Supply Chain Control Tower
// ============================================================

import type { Shipment, OptimizedRoute, PredictionResult } from './types';

// ─── Haversine distance between two lat/lng points ───────────
function haversine(
  [lat1, lng1]: [number, number],
  [lat2, lng2]: [number, number]
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Graph Node ───────────────────────────────────────────────
interface Node {
  id: string;
  coord: [number, number];
}

interface Edge {
  from: string;
  to: string;
  weight: number;
}

interface Graph {
  nodes: Map<string, Node>;
  edges: Map<string, Edge[]>;
}

// ─── Build routing graph from waypoints ──────────────────────
function buildGraph(waypoints: [number, number][], penalty: number): Graph {
  const nodes = new Map<string, Node>();
  const edges = new Map<string, Edge[]>();

  waypoints.forEach((coord, i) => {
    const id = `node-${i}`;
    nodes.set(id, { id, coord });
    edges.set(id, []);
  });

  // Connect each consecutive pair with weighted edges
  for (let i = 0; i < waypoints.length - 1; i++) {
    const fromId = `node-${i}`;
    const toId = `node-${i + 1}`;
    const dist = haversine(waypoints[i], waypoints[i + 1]);
    const weight = dist * (1 + penalty); // apply congestion penalty

    edges.get(fromId)!.push({ from: fromId, to: toId, weight });
    edges.get(toId)!.push({ from: toId, to: fromId, weight }); // bidirectional
  }

  return { nodes, edges };
}

// ─── Dijkstra Algorithm ───────────────────────────────────────
function dijkstra(
  graph: Graph,
  startId: string,
  endId: string
): { path: string[]; cost: number } {
  const dist = new Map<string, number>();
  const prev = new Map<string, string | null>();
  const visited = new Set<string>();
  const queue: Array<{ id: string; cost: number }> = [];

  graph.nodes.forEach((_, id) => {
    dist.set(id, Infinity);
    prev.set(id, null);
  });

  dist.set(startId, 0);
  queue.push({ id: startId, cost: 0 });

  while (queue.length > 0) {
    queue.sort((a, b) => a.cost - b.cost);
    const { id: current } = queue.shift()!;

    if (visited.has(current)) continue;
    visited.add(current);

    if (current === endId) break;

    const neighbors = graph.edges.get(current) ?? [];
    for (const edge of neighbors) {
      if (visited.has(edge.to)) continue;
      const newDist = dist.get(current)! + edge.weight;
      if (newDist < dist.get(edge.to)!) {
        dist.set(edge.to, newDist);
        prev.set(edge.to, current);
        queue.push({ id: edge.to, cost: newDist });
      }
    }
  }

  // Reconstruct path
  const path: string[] = [];
  let cur: string | null = endId;
  while (cur !== null) {
    path.unshift(cur);
    cur = prev.get(cur) ?? null;
  }

  return { path, cost: dist.get(endId) ?? Infinity };
}

// ─── Alternate Route Generator ────────────────────────────────
function generateAlternateWaypoints(
  origin: [number, number],
  destination: [number, number],
  shipmentId: string
): [number, number][] {
  // Generate a slightly offset alternate route using midpoint deviation
  const midLat = (origin[0] + destination[0]) / 2;
  const midLng = (origin[1] + destination[1]) / 2;

  // Deterministic offset based on shipment ID
  const hash = shipmentId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const latOffset = ((hash % 7) - 3) * 0.8;
  const lngOffset = ((hash % 5) - 2) * 0.9;

  const via1: [number, number] = [
    (origin[0] + midLat) / 2 + latOffset * 0.3,
    (origin[1] + midLng) / 2 + lngOffset * 0.3,
  ];
  const via2: [number, number] = [
    midLat + latOffset,
    midLng + lngOffset,
  ];
  const via3: [number, number] = [
    (midLat + destination[0]) / 2 + latOffset * 0.3,
    (midLng + destination[1]) / 2 + lngOffset * 0.3,
  ];

  return [origin, via1, via2, via3, destination];
}

// ─── Main Route Optimizer ─────────────────────────────────────
export function optimizeRoute(
  shipment: Shipment,
  prediction: PredictionResult
): OptimizedRoute {
  const origin = shipment.originCoords;
  const destination = shipment.destinationCoords;
  const originalRoute = shipment.routeCoords;

  // Calculate original route penalty from risk
  const congestionPenalty = prediction.delayProbability / 100 * 0.5;

  // Original route cost with penalty
  const originalGraph = buildGraph(originalRoute, congestionPenalty);
  const startId = 'node-0';
  const endId = `node-${originalRoute.length - 1}`;
  const { cost: originalCost } = dijkstra(originalGraph, startId, endId);

  // Alternate route (lower penalty — avoids congestion)
  const alternateWaypoints = generateAlternateWaypoints(origin, destination, shipment.id);
  const alternatePenalty = congestionPenalty * 0.25; // 75% reduction in congestion
  const alternateGraph = buildGraph(alternateWaypoints, alternatePenalty);
  const altEndId = `node-${alternateWaypoints.length - 1}`;
  const { cost: alternateCost } = dijkstra(alternateGraph, 'node-0', altEndId);

  // Calculate time savings (assuming average speed of 60 km/h)
  const distanceDiff = alternateWaypoints.reduce((sum, coord, i) => {
    if (i === 0) return sum;
    return sum + haversine(alternateWaypoints[i - 1], coord);
  }, 0) - shipment.distance;

  const congestionDelay = prediction.estimatedDelay * 0.7;
  const routingOverhead = Math.abs(distanceDiff) / 60 * 60; // extra travel min
  const timeSaved = Math.max(0, Math.round(congestionDelay - routingOverhead));

  // New ETA based on time saved
  const originalETA = new Date(shipment.eta);
  const newETA = new Date(originalETA.getTime() - timeSaved * 60 * 1000);

  const reasons = [];
  if (prediction.factors.some((f) => f.name.includes('Traffic')))
    reasons.push('heavy traffic congestion');
  if (prediction.factors.some((f) => f.name.includes('Weather')))
    reasons.push('adverse weather conditions');
  if (reasons.length === 0) reasons.push('elevated risk factors');

  return {
    shipmentId: shipment.id,
    originalRoute,
    alternateRoute: alternateWaypoints,
    originalETA: originalETA.toISOString(),
    newETA: newETA.toISOString(),
    timeSaved,
    distanceDiff: Math.round(distanceDiff),
    reason: `Rerouted to avoid ${reasons.join(' and ')}`,
  };
}

// ─── Route Statistics ─────────────────────────────────────────
export function calculateRouteStats(route: [number, number][]) {
  let totalDistance = 0;
  for (let i = 1; i < route.length; i++) {
    totalDistance += haversine(route[i - 1], route[i]);
  }
  return {
    totalDistance: Math.round(totalDistance),
    estimatedHours: Math.round((totalDistance / 60) * 10) / 10,
    waypoints: route.length,
  };
}
