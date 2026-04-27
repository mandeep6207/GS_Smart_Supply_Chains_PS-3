// ============================================================
// API ROUTE: /api/shipments
// Returns all enriched shipment data
// Smart Supply Chain Control Tower
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getEnrichedShipments } from '@/lib/dataGenerator';

export const dynamic = 'force-dynamic'; // no caching — always fresh data

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const riskFilter = searchParams.get('risk'); // 'High' | 'Medium' | 'Low'
    const statusFilter = searchParams.get('status');
    const carrierId = searchParams.get('carrier');

    let shipments = getEnrichedShipments();

    // Apply filters
    if (riskFilter) {
      shipments = shipments.filter(
        (s) => s.prediction.riskLevel === riskFilter
      );
    }
    if (statusFilter) {
      shipments = shipments.filter((s) => s.status === statusFilter);
    }
    if (carrierId) {
      shipments = shipments.filter((s) =>
        s.carrier.toLowerCase().includes(carrierId.toLowerCase())
      );
    }

    return NextResponse.json({
      success: true,
      count: shipments.length,
      timestamp: new Date().toISOString(),
      data: shipments,
    });
  } catch (error) {
    console.error('[/api/shipments] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch shipment data' },
      { status: 500 }
    );
  }
}
