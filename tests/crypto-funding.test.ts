import assert from 'node:assert/strict';
import { test } from 'node:test';
import { exactUnits, fundingRequest, sumDecimals } from '../src/lib/crypto-funding.ts';

test('crypto amounts retain all 18 decimals and reject excess precision', () => {
  assert.equal(exactUnits('1.000000000000000001', 18), 1000000000000000001n);
  assert.equal(exactUnits('0.000001', 6), 1n);
  assert.equal(exactUnits('0.0000001', 6), null);
  assert.equal(exactUnits('1e10', 18), null);
  assert.equal(exactUnits('-1', 18), null);
  assert.equal(sumDecimals('0.1', '0.2'), '0.3');
  assert.equal(sumDecimals('1', '0.000000000000000001'), '1.000000000000000001');
});
test('a funding retry keeps its idempotency key across failures and scopes it to the customer', async (t) => {
  const slots = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => slots.get(key) ?? null,
      setItem: (key: string, value: string) => {
        slots.set(key, value);
      },
      removeItem: (key: string) => {
        slots.delete(key);
      },
      get length() {
        return slots.size;
      },
      clear: () => slots.clear(),
      key: (index: number) => [...slots.keys()][index] ?? null,
    },
  });
  t.after(() => Reflect.deleteProperty(globalThis, 'localStorage'));
  const keys: string[] = [];
  let fail = true;
  t.mock.method(
    globalThis,
    'fetch',
    async (_url: string | URL | Request, options?: RequestInit) => {
      keys.push((options?.headers as Record<string, string>)['Idempotency-Key']);
      return new Response(
        JSON.stringify(fail ? { code: 'api_unavailable' } : { withdrawal: { id: 'one' } }),
        { status: fail ? 502 : 200 },
      );
    },
  );
  const body = { asset: 'USDT', network: 'BEP20', amount: '1', destination: 'recipient' };
  await assert.rejects(fundingRequest('alice', '/crypto/withdrawals', body));
  await assert.rejects(fundingRequest('alice', '/crypto/withdrawals', body));
  assert.equal(keys[0], keys[1]);
  await assert.rejects(fundingRequest('bob', '/crypto/withdrawals', body));
  assert.notEqual(keys[0], keys[2]);
  fail = false;
  await fundingRequest('alice', '/crypto/withdrawals', body);
  assert.equal(keys[0], keys[3]);
  assert.equal(slots.size, 1, 'only Bob’s unresolved request remains');
});

test('disabled deposits distinguish wallet-service readiness from network configuration', async () => {
  const { depositDisabledText } = await import('../src/lib/crypto-funding.ts');
  assert.match(depositDisabledText('wallet_process_not_configured'), /سرویس ایجاد آدرس/);
  assert.match(depositDisabledText('wallet_not_enabled'), /کیف پول واریز/);
  assert.match(depositDisabledText('network_not_configured'), /اتصال این شبکه/);
});
