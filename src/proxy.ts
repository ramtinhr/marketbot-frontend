import { NextRequest, NextResponse } from 'next/server';
import { safeNext } from './lib/validation';

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === '/login') {
    const token = request.cookies.get('marketbot_customer_session')?.value;
    const apiOrigin = process.env.MARKETBOT_API_URL;
    const response = NextResponse.next();
    response.headers.set('Cache-Control', 'private, no-store');
    if (!token || !apiOrigin || process.env.MARKETBOT_DEMO_MODE === 'true') return response;
    try {
      const session = await fetch(new URL('/v1/me', apiOrigin), {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
        redirect: 'error',
        signal: AbortSignal.timeout(5000),
      });
      if (session.status === 401) response.cookies.delete('marketbot_customer_session');
      if (session.ok && (await session.json()).verified === true) {
        const redirect = NextResponse.redirect(
          new URL(safeNext(request.nextUrl.searchParams.get('next')), request.nextUrl.origin),
        );
        redirect.headers.set('Cache-Control', 'private, no-store');
        return redirect;
      }
    } catch {
      // An unavailable API must not trap the user in a redirect loop.
    }
    return response;
  }
  if (request.nextUrl.pathname === '/') {
    const hostname = request.headers.get('host')?.split(':')[0].toLowerCase();
    const portalOrigin = process.env.MARKETBOT_APP_ORIGIN;
    if (
      portalOrigin &&
      hostname === new URL(portalOrigin).hostname &&
      hostname !== 'parscryptoexchange.com'
    )
      return NextResponse.redirect(new URL('/dashboard', portalOrigin));
    return NextResponse.next();
  }
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
export const config = { matcher: ['/', '/login', '/api/live'] };
