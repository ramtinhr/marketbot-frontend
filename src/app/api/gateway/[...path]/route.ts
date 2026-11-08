import { isIP } from 'node:net';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { allowedRoute } from '@/lib/gateway-policy';
const cookieName = 'marketbot_customer_session';
export const dynamic = 'force-dynamic';
async function handle(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const path = (await context.params).path.join('/');
  if (!allowedRoute(request.method, path))
    return NextResponse.json({ code: 'not_found' }, { status: 404 });
  if (
    request.method !== 'GET' &&
    request.headers.get('origin') !== (process.env.MARKETBOT_APP_ORIGIN || request.nextUrl.origin)
  )
    return NextResponse.json({ code: 'forbidden' }, { status: 403 });
  if (process.env.MARKETBOT_DEMO_MODE === 'true')
    return NextResponse.json({ code: 'demo_readonly' }, { status: 403 });
  if (!process.env.MARKETBOT_API_URL)
    return NextResponse.json({ code: 'api_unavailable' }, { status: 503 });
  const jar = await cookies();
  const token = jar.get(cookieName)?.value;
  if (!path.startsWith('auth/web/') && !path.startsWith('market/') && !token)
    return NextResponse.json({ code: 'unauthorized' }, { status: 401 });
  const upstream = new URL(`/v1/${path}`, process.env.MARKETBOT_API_URL);
  upstream.search = request.nextUrl.search;
  const clientIp =
    process.env.MARKETBOT_TRUST_INGRESS === 'true' ? request.headers.get('x-real-ip') : null;
  try {
    const requestBody = request.method === 'GET' ? undefined : (await request.text()) || undefined;
    const response = await fetch(upstream, {
      method: request.method,
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(
        path.startsWith('crypto/') || path.startsWith('payments') ? 40000 : 15000,
      ),
      headers: {
        ...(requestBody ? { 'Content-Type': 'application/json' } : {}),
        ...(clientIp && isIP(clientIp) ? { 'X-Forwarded-For': clientIp } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...((path.startsWith('crypto/') || path.startsWith('p2p/') || path === 'payments') &&
        request.headers.get('idempotency-key')
          ? { 'Idempotency-Key': request.headers.get('idempotency-key')! }
          : {}),
      },
      body: requestBody,
    });
    const routeMissing = response.status === 404 && path.startsWith('auth/web/');
    const invalidResponseCode = routeMissing ? 'api_route_missing' : 'api_unavailable';
    const body = response.status === 204 ? null : await response.json().catch(() => null);
    // Reverse proxies can return HTML. Preserve their failure status rather
    // than turning a JSON parse failure into an unrelated gateway error.
    if (response.status !== 204 && (!body || typeof body !== 'object' || Array.isArray(body))) {
      console.error('[customer-api] invalid upstream response', { path, status: response.status });
      return NextResponse.json(
        { code: invalidResponseCode },
        {
          status: response.ok ? 502 : response.status,
          headers: { 'Cache-Control': 'no-store' },
        },
      );
    }
    if (routeMissing) {
      console.error('[customer-api] browser authentication route missing', {
        path,
        status: response.status,
      });
      return NextResponse.json(
        { code: 'api_route_missing' },
        {
          status: 404,
          headers: { 'Cache-Control': 'no-store' },
        },
      );
    }
    if (path === 'auth/web/verify' && response.ok && body?.token) {
      jar.set(cookieName, body.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      });
      delete body.token;
    }
    if (path === 'auth/logout' || response.status === 401) jar.delete(cookieName);
    return new NextResponse(body ? JSON.stringify(body) : null, {
      status: response.status,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  } catch {
    return NextResponse.json({ code: 'api_unavailable' }, { status: 502 });
  }
}
export { handle as GET, handle as POST, handle as DELETE };
