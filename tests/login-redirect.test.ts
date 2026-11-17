import assert from 'node:assert/strict';
import test from 'node:test';
import { safeNext } from '../src/lib/validation.ts';

test('login returns to the requested internal page, defaulting to the dashboard', () => {
  assert.equal(safeNext(null), '/dashboard');
  assert.equal(safeNext('/wallet?asset=USDT#history'), '/wallet?asset=USDT#history');
});

test('login redirects reject external destinations, malformed paths, and login loops', () => {
  for (const value of [
    'https://example.com',
    '//example.com',
    '/\\example.com',
    '/\n/example.com',
    '/login',
    '/login?next=/wallet',
    '/login/',
    '/wallet/../login',
    '/%6cogin',
    '/..//example.com',
    '/%2fexample.com',
    '/%5cexample.com',
    '/%ZZ',
  ])
    assert.equal(safeNext(value), '/dashboard', value);
});
