import { NextResponse } from 'next/server';
import { getHealth } from '../../../lib/gateway-client';

export async function GET() {
  try {
    const health = await getHealth();
    const mainSession = health.sessions?.recent?.find((s: any) => s.key === 'agent:main:main');
    const costs = mainSession ? {
      totalTokens: mainSession.totalTokens,
      inputTokens: mainSession.inputTokens || 0,
      outputTokens: mainSession.outputTokens || 0,
      percentUsed: mainSession.percentUsed,
      model: mainSession.model,
      contextTokens: mainSession.contextTokens
    } : { totalTokens: 0 };
    return NextResponse.json({ costs });
  } catch (e: any) {
    return NextResponse.json({ costs: { error: e.message } }, { status: 500 });
  }
}
