// ============================================================
// API ROUTE: /api/analytics
// Returns analytics data: trends, distributions, performance
// Smart Supply Chain Control Tower
// ============================================================

import { NextResponse } from 'next/server';
import { getEnrichedShipments, generateDelayTrends, generateCarrierPerformance } from '@/lib/dataGenerator';
import { calculateKPIs, calculateRiskDistribution } from '@/lib/riskEngine';
import { MODEL_METADATA } from '@/lib/mlModel';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const shipments = getEnrichedShipments();
    const kpis = calculateKPIs(shipments);
    const riskDistribution = calculateRiskDistribution(shipments);
    const delayTrends = generateDelayTrends();
    const carrierPerformance = generateCarrierPerformance();

    // Cargo risk analysis
    const cargoRisk = (() => {
      const map = new Map<string, { total: number; risk: number }>();
      shipments.forEach((s) => {
        const cargo = s.cargo;
        const existing = map.get(cargo) ?? { total: 0, risk: 0 };
        map.set(cargo, {
          total: existing.total + 1,
          risk: existing.risk + s.prediction.delayProbability,
        });
      });
      return Array.from(map.entries())
        .map(([cargo, { total, risk }]) => ({
          cargo,
          avgRisk: Math.round(risk / total),
          shipments: total,
        }))
        .sort((a, b) => b.avgRisk - a.avgRisk);
    })();

    return NextResponse.json({
      success: true,
      data: {
        kpis,
        riskDistribution,
        delayTrends,
        carrierPerformance,
        cargoRisk,
        modelMetadata: MODEL_METADATA,
      },
    });
  } catch (error) {
    console.error('[/api/analytics] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Analytics generation failed' },
      { status: 500 }
    );
  }
}
