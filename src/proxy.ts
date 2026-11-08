import { NextRequest, NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
  const expectedOrigin = process.env.MARKETBOT_APP_ORIGIN || request.nextUrl.origin;
  if (request.headers.get('origin') !== expectedOrigin)
    return NextResponse.json({ code: 'forbidden' }, { status: 403 });
  if (!request.cookies.get('marketbot_customer_session'))
    return NextResponse.json({ code: 'unauthorized' }, { status: 401 });
  if (process.env.MARKETBOT_DEMO_MODE === 'true' || !process.env.MARKETBOT_API_URL)
    return NextResponse.json({ code: 'api_unavailable' }, { status: 503 });
  // Runtime configuration also works in the standalone Docker image.
  return NextResponse.rewrite(new URL('/v1/market/ws', process.env.MARKETBOT_API_URL));
}
export const config = { matcher: '/api/live' };
