import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    success: true,
    status: 'healthy',
    services: {
      shipments: 'online',
      alerts: 'online',
      analytics: 'online',
    },
    checkedAt: new Date().toISOString(),
  });
}