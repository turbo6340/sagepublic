import { NextResponse } from 'next/server';
import { getHealth } from '../../../lib/gateway-client';

export async function GET() {
  try {
    const health = await getHealth();
    const mainSession = health.sessions?.recent?.find((s: any) => s.key === 'agent:main:main');
    const now = Date.now();
    const connected = true;
    const lastHeartbeat = health.heartbeatSeconds ? `${health.heartbeatSeconds}s interval` : 'N/A';
    const mainStatus = mainSession ? {
      ageMs: now - mainSession.updatedAt,
      ageMin: Math.round((now - mainSession.updatedAt) / 60000),
      model: mainSession.model,
      totalTokens: mainSession.totalTokens,
      percentUsed: mainSession.percentUsed,
      remainingTokens: mainSession.remainingTokens
    } : null;
    return NextResponse.json({ connected, lastHeartbeat, mainSession: mainStatus });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, connected: false }, { status: 500 });
  }
}
