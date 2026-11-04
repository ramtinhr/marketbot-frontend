// Exercise the real Next.js gateway against a disposable local API, never production.
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { setTimeout } from 'node:timers/promises';
const token = 'disposable-test-session';
let receivedAuthorization;
let receivedIp;
const mock = http.createServer(async (req, res) => {
  let body = '';
  for await (const chunk of req) body += chunk;
  res.setHeader('Content-Type', 'application/json');
  if (req.url === '/v1/auth/web/send' && JSON.parse(body || '{}').phone === 'missing-route') {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'POST /v1/auth/web/send not found' }));
    return;
  }
  if (req.url === '/v1/auth/web/send' && JSON.parse(body || '{}').phone === 'proxy-failure') {
    res.writeHead(503, { 'Content-Type': 'text/html' });
    res.end('<html>Service unavailable</html>');
    return;
  }
  if (req.url === '/v1/auth/web/send') {
    res.end(JSON.stringify({ challenge_id: 'test-challenge', resend_in: 60, expires_in: 120 }));
    return;
  }
  if (req.url === '/v1/auth/web/verify') {
    res.end(
      JSON.stringify({
        status: 'ok',
        token,
        user: { id: 1, phone: '+989121234567' },
        verified: true,
      }),
    );
    return;
  }
  receivedAuthorization = req.headers.authorization;
  receivedIp = req.headers['x-forwarded-for'];
  if (req.url === '/v1/auth/logout') {
    res.writeHead(204);
    res.end();
    return;
  }
  res.end(JSON.stringify({ user: { id: 1 }, verified: true }));
});
await new Promise((resolve) => mock.listen(0, '127.0.0.1', resolve));
const backendPort = mock.address().port;
const port = 3302;
const origin = `http://127.0.0.1:${port}`;
const next = spawn(
  process.execPath,
  ['node_modules/next/dist/bin/next', 'dev', '--hostname', '127.0.0.1', '--port', String(port)],
  {
    env: {
      ...process.env,
      NEXT_BUILD_DIR: '.next-gateway-test',
      MARKETBOT_API_URL: `http://127.0.0.1:${backendPort}`,
      MARKETBOT_APP_ORIGIN: origin,
      MARKETBOT_DEMO_MODE: 'false',
      MARKETBOT_TRUST_INGRESS: 'false',
      NEXT_TELEMETRY_DISABLED: '1',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  },
);
let output = '';
next.stdout.on('data', (s) => (output += s));
next.stderr.on('data', (s) => (output += s));
try {
  let ready = false;
  for (let i = 0; i < 100; i++) {
    try {
      const r = await fetch(origin + '/api/gateway/me');
      if (r.status === 401) {
        ready = true;
        break;
      }
    } catch {}
    await setTimeout(200);
  }
  assert.ok(ready, output);
  const post = (path, body = {}, headers = {}) =>
    fetch(origin + '/api/gateway' + path, {
      method: 'POST',
      headers: { Origin: origin, 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
    });
  assert.equal(
    (await post('/auth/web/send', {}, { Origin: 'https://another.example' })).status,
    403,
  );
  assert.equal((await fetch(origin + '/api/gateway/admin')).status, 404);
  assert.equal((await post('/auth/telegram')).status, 404);
  const missing = await post('/auth/web/send', { phone: 'missing-route' });
  assert.equal(missing.status, 404);
  assert.equal((await missing.json()).code, 'api_route_missing');
  const proxy = await post('/auth/web/send', { phone: 'proxy-failure' });
  assert.equal(proxy.status, 503);
  assert.equal((await proxy.json()).code, 'api_unavailable');
  const send = await post('/auth/web/send', { phone: '09121234567' });
  assert.equal(send.status, 200);
  const verify = await post('/auth/web/verify', { challenge_id: 'test-challenge', code: '123456' });
  assert.equal(verify.status, 200);
  assert.equal(
    (await verify.json()).token,
    undefined,
    'bearer token is stripped from the browser response',
  );
  const cookie = verify.headers.get('set-cookie');
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /SameSite=lax/i);
  const cookieHeader = cookie.split(';')[0];
  const me = await fetch(origin + '/api/gateway/me', {
    headers: {
      Cookie: cookieHeader,
      'x-real-ip': '203.0.113.99',
      'x-forwarded-for': '203.0.113.99',
    },
  });
  assert.equal(me.status, 200);
  assert.equal(receivedAuthorization, `Bearer ${token}`);
  assert.equal(receivedIp, undefined, 'untrusted forwarding headers are not propagated');
  const logout = await post('/auth/logout', {}, { Cookie: cookieHeader });
  assert.equal(logout.status, 204);
  assert.match(logout.headers.get('set-cookie'), /Max-Age=0|Expires=Thu, 01 Jan 1970/i);
  console.log(
    'PASS: gateway cookies, bearer isolation, same-origin writes, route allowlist, forwarding policy, logout',
  );
} catch (error) {
  console.error(output.slice(-5000));
  throw error;
} finally {
  next.kill('SIGTERM');
  mock.close();
}
