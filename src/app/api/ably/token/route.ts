import Ably from 'ably/promises';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const client = new Ably.Rest(process.env.ABLY_API_KEY!);
  const tokenRequestData = await client.auth.createTokenRequest({
    clientId: 'user-' + Math.random().toString(36).substr(2, 9),
    capability: {
      'room:*': ['publish', 'subscribe', 'presence'],
    },
    ttl: 30 * 60 * 1000, // 30 minutes
  });

  return new NextResponse(JSON.stringify(tokenRequestData), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}