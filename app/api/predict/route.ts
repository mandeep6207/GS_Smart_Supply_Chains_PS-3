// ============================================================
// API ROUTE: /api/predict
// Runs ML prediction for a single or batch of shipments
// Smart Supply Chain Control Tower
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { predictDelay, MODEL_METADATA } from '@/lib/mlModel';
import type { PredictionInput } from '@/lib/types';

export const dynamic = 'force-dynamic';

// POST /api/predict — predict delay for a single shipment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const required = [
      'shipmentId', 'distance', 'weatherSeverity',
      'trafficSeverity', 'historicalDelayRate',
    ];
    for (const field of required) {
      if (body[field] === undefined || body[field] === null) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    const input: PredictionInput = {
      distance: Number(body.distance),
      weatherSeverity: Number(body.weatherSeverity),
      trafficSeverity: Number(body.trafficSeverity),
      historicalDelayRate: Number(body.historicalDelayRate),
      cargoType: body.cargoType ?? 'General',
      weight: Number(body.weight ?? 1000),
    };

    const prediction = predictDelay(input, body.shipmentId);

    return NextResponse.json({
      success: true,
      model: MODEL_METADATA.name,
      data: prediction,
    });
  } catch (error) {
    console.error('[/api/predict] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Prediction failed' },
      { status: 500 }
    );
  }
}

// GET /api/predict — return model metadata
export async function GET() {
  return NextResponse.json({
    success: true,
    model: MODEL_METADATA,
  });
}
