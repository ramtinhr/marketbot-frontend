import assert from 'node:assert/strict';
import { test } from 'node:test';
import { allowedRoute } from '../src/lib/gateway-policy.ts';
import { safeNext, validIban } from '../src/lib/validation.ts';
test('customer gateway allows documented operations and excludes admin and arbitrary paths', () => {
  for (const [method, path] of [
    ['GET', 'wallet'],
    ['POST', 'auth/web/send'],
    ['POST', 'auth/web/verify'],
    ['GET', 'market/USDT_IRT'],
    ['POST', 'orders/0a0b-1/cancel'],
    ['DELETE', 'bank-accounts/123'],
  ])
    assert.equal(allowedRoute(method, path), true, `${method} ${path}`);
  for (const [method, path] of [
    ['GET', '../admin'],
    ['GET', 'https://example.com'],
    ['POST', 'users/1'],
    ['GET', 'admin'],
    ['POST', 'market/USDT_IRT'],
    ['PUT', 'wallet'],
    ['GET', 'market/%2e%2e'],
    ['GET', 'auth/web/verify'],
    ['POST', 'auth/telegram'],
  ])
    assert.equal(allowedRoute(method, path), false, `${method} ${path}`);
});
test('post-login redirect remains on this application', () => {
  assert.equal(safeNext('/wallet?action=deposit'), '/wallet?action=deposit');
  for (const url of ['https://evil.example', '//evil.example', '/\\evil.example', null])
    assert.equal(safeNext(url), '/');
});
test('Iranian IBAN validation checks the country, length, and checksum', () => {
  assert.equal(validIban('IR820540102680020817909002'), true);
  assert.equal(validIban('IR82 0540 1026 8002 0817 9090 02'), true);
  assert.equal(validIban('IR820540102680020817909003'), false);
  assert.equal(validIban('DE820540102680020817909002'), false);
});
