import { NextRequest, NextResponse } from 'next/server';
import { sendChat } from '../../lib/gateway-client';

export async function POST(req: NextRequest) {
  try {
    const { text, sessionKey } = await req.json();
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Invalid text' }, { status: 400 });
    }
    const key = typeof sessionKey === 'string' && sessionKey.trim() ? sessionKey.trim() : 'agent:main:web';
    const reply = await sendChat(text, key);
    return NextResponse.json({ reply: reply ?? "" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
