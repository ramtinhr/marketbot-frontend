import assert from 'node:assert/strict';
import { test } from 'node:test';
import { tomanAmount, reservationSeconds, validReceiptFile } from '../src/lib/p2p.ts';
import { allowedRoute } from '../src/lib/gateway-policy.ts';
test('P2P amounts preserve whole Toman exactly and accept Persian digits', () => {
  assert.equal(tomanAmount('۵٬۰۰۰٬۰۰۰'), '5000000');
  assert.equal(tomanAmount('٩٩٩,٩٩٩'), '999999');
  assert.equal(tomanAmount('999999999999999'), '999999999999999');
  for (const raw of ['0', '-1', '1.5', '1e6', '1000000000000000', 'abc', ''])
    assert.equal(tomanAmount(raw), null);
});
test('reservation deadline stops at zero and receipts have bounded raster formats', () => {
  const now = Date.now();
  assert.equal(reservationSeconds(new Date(now + 120000).toISOString(), now), 120);
  assert.equal(reservationSeconds(new Date(now - 1).toISOString(), now), 0);
  assert.equal(validReceiptFile({ type: 'image/png', size: 530000 }), true);
  for (const file of [
    { type: 'image/svg+xml', size: 100 },
    { type: 'image/png', size: 530001 },
    { type: 'image/jpeg', size: 0 },
  ])
    assert.equal(validReceiptFile(file), false);
});
test('P2P gateway permits customer workflow and excludes admin review and arbitrary paths', () => {
  for (const [method, path] of [
    ['GET', 'p2p/orders'],
    ['GET', 'p2p/market'],
    ['GET', 'p2p/payments'],
    ['POST', 'p2p/orders'],
    ['POST', 'p2p/reserve'],
    ['POST', 'p2p/orders/abc-123/cancel'],
    ...['receipt', 'confirm', 'dispute'].map((action) => [
      'POST',
      `p2p/payments/abc-123/${action}`,
    ]),
  ])
    assert.equal(allowedRoute(method, path), true, `${method} ${path}`);
  for (const [method, path] of [
    ['POST', 'p2p/payments/abc/review'],
    ['GET', 'p2p/reserve'],
    ['DELETE', 'p2p/orders/abc'],
    ['POST', 'p2p/payments/../confirm'],
    ['GET', 'backoffice/v1/p2p/payments'],
  ])
    assert.equal(allowedRoute(method, path), false, `${method} ${path}`);
});
