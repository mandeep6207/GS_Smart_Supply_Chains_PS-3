// ============================================================
// API ROUTE: /api/optimize
// Returns optimized routes for high-risk shipments
// Smart Supply Chain Control Tower
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getEnrichedShipments } from '@/lib/dataGenerator';
import { optimizeRoute } from '@/lib/routing';
import { predictDelay } from '@/lib/mlModel';
import type { PredictionInput, Shipment } from '@/lib/types';
import sampleShipments from '@/data/sampleShipments.json';

export const dynamic = 'force-dynamic';

// GET /api/optimize — returns all optimized routes for risky shipments
export async function GET() {
  try {
    const enriched = getEnrichedShipments();
    const optimizedRoutes = enriched
      .filter((s) => s.optimizedRoute)
      .map((s) => ({
        shipmentId: s.id,
        origin: s.origin,
        destination: s.destination,
        riskLevel: s.prediction.riskLevel,
        delayProbability: s.prediction.delayProbability,
        optimizedRoute: s.optimizedRoute,
      }));

    return NextResponse.json({
      success: true,
      count: optimizedRoutes.length,
      data: optimizedRoutes,
    });
  } catch (error) {
    console.error('[/api/optimize] GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Route optimization failed' },
      { status: 500 }
    );
  }
}

// POST /api/optimize — optimize route for a specific shipment ID
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shipmentId } = body;

    if (!shipmentId) {
      return NextResponse.json(
        { success: false, error: 'Missing shipmentId' },
        { status: 400 }
      );
    }

    const shipments = sampleShipments as Shipment[];
    const shipment = shipments.find((s) => s.id === shipmentId);

    if (!shipment) {
      return NextResponse.json(
        { success: false, error: `Shipment ${shipmentId} not found` },
        { status: 404 }
      );
    }

    // Use provided feature values or defaults
    const input: PredictionInput = {
      distance: shipment.distance,
      weatherSeverity: Number(body.weatherSeverity ?? 0.5),
      trafficSeverity: Number(body.trafficSeverity ?? 0.5),
      historicalDelayRate: shipment.historicalDelayRate,
      cargoType: shipment.cargo,
      weight: shipment.weight,
    };

    const prediction = predictDelay(input, shipmentId);
    const optimized = optimizeRoute(shipment, prediction);

    return NextResponse.json({
      success: true,
      data: {
        shipmentId,
        prediction,
        optimizedRoute: optimized,
      },
    });
  } catch (error) {
    console.error('[/api/optimize] POST Error:', error);
    return NextResponse.json(
      { success: false, error: 'Route optimization failed' },
      { status: 500 }
    );
  }
}
