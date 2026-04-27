// ============================================================
// API ROUTE: /api/alerts
// Returns all active alerts sorted by severity
// Smart Supply Chain Control Tower
// ============================================================

import { NextResponse } from 'next/server';
import { getEnrichedShipments } from '@/lib/dataGenerator';
import type { Alert } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const shipments = getEnrichedShipments();

    // Collect all alerts
    const alerts: Alert[] = shipments
      .filter((s) => s.alert)
      .map((s) => s.alert!)
      .sort((a, b) => {
        // Sort: critical first, then by timestamp desc
        if (a.severity === 'critical' && b.severity !== 'critical') return -1;
        if (b.severity === 'critical' && a.severity !== 'critical') return 1;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });

    const summary = {
      total: alerts.length,
      critical: alerts.filter((a) => a.severity === 'critical').length,
      warning: alerts.filter((a) => a.severity === 'warning').length,
      info: alerts.filter((a) => a.severity === 'info').length,
      unread: alerts.filter((a) => !a.read).length,
    };

    return NextResponse.json({
      success: true,
      summary,
      data: alerts,
    });
  } catch (error) {
    console.error('[/api/alerts] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}
