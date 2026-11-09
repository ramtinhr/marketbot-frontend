import assert from 'node:assert/strict';
import { test } from 'node:test';
import { QueryClient } from '@tanstack/react-query';
import { requestTradingSnapshot, subscribeTradingLive } from '../src/lib/trading-stream.ts';

test('market views share sockets, apply streamed data and recover after reconnect', async (t) => {
  const sockets: Socket[] = [];
  class Socket {
    static OPEN = 1;
    readyState = 1;
    onopen: (() => void) | null = null;
    onclose: (() => void) | null = null;
    onerror: (() => void) | null = null;
    onmessage: ((event: { data: string }) => void) | null = null;
    closed = false;
    sent: string[] = [];
    url: string;
    constructor(url: string) {
      this.url = url;
      sockets.push(this);
    }
    send(data: string) {
      this.sent.push(data);
    }
    close() {
      this.closed = true;
      this.onclose?.();
    }
    message(data: unknown) {
      this.onmessage?.({ data: JSON.stringify(data) });
    }
  }
  t.mock.method(globalThis, 'setTimeout', ((fn: () => void) => {
    reconnect = fn;
    return 1;
  }) as typeof setTimeout);
  t.mock.method(globalThis, 'clearTimeout', () => {});
  const originalSocket = Object.getOwnPropertyDescriptor(globalThis, 'WebSocket');
  const originalLocation = Object.getOwnPropertyDescriptor(globalThis, 'location');
  Object.defineProperty(globalThis, 'WebSocket', { configurable: true, value: Socket });
  Object.defineProperty(globalThis, 'location', {
    configurable: true,
    value: { protocol: 'https:', host: 'portal.test' },
  });
  t.after(() => {
    for (const [name, descriptor] of [
      ['WebSocket', originalSocket],
      ['location', originalLocation],
    ] as const) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else Reflect.deleteProperty(globalThis, name);
    }
  });
  let reconnect: (() => void) | undefined;
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } });
  t.after(() => client.clear());
  const first = subscribeTradingLive(client, 'BTC_IRT');
  const second = subscribeTradingLive(client, 'BTC_IRT');
  assert.equal(sockets.length, 1);
  assert.equal(sockets[0].url, 'wss://portal.test/api/live');
  sockets[0].onopen?.();
  assert.deepEqual(JSON.parse(sockets[0].sent[0]), { type: 'subscribe', symbol: 'BTC_IRT' });
  const marketSnapshot = { symbol: 'BTC_IRT', depth: null, summary: { close: 100 }, trades: [] };
  const auctionSnapshot = {
    symbol: 'BTC_IRT',
    book: { bids: [], asks: [] },
    offers: [],
    trades: [],
  };
  const pending = client.fetchQuery({
    queryKey: ['market-BTC_IRT'],
    queryFn: ({ signal }) => requestTradingSnapshot(client, 'BTC_IRT', 'market-BTC_IRT', signal),
  });
  sockets[0].message({
    type: 'snapshot',
    symbol: 'BTC_IRT',
    market: marketSnapshot,
    auction: auctionSnapshot,
  });
  assert.deepEqual(await pending, marketSnapshot);
  assert.deepEqual(client.getQueryData(['auction-BTC_IRT']), auctionSnapshot);
  sockets[0].message({ type: 'summary', symbol: 'ETH_IRT', summary: { close: 9 } });
  assert.equal(client.getQueryData<any>(['market-BTC_IRT']).summary.close, 100);
  sockets[0].message({ type: 'summary', symbol: 'BTC_IRT', summary: { close: 123 } });
  sockets[0].message({ type: 'depth', depth: { symbol: 'BTC_IRT', bids: [], asks: [] } });
  sockets[0].message({ type: 'auction_book', book: { bids: [{ price: '10' }], asks: [] } });
  assert.equal(client.getQueryData<any>(['market-BTC_IRT']).summary.close, 123);
  assert.equal(client.getQueryData<any>(['market-BTC_IRT']).depth.symbol, 'BTC_IRT');
  assert.equal(client.getQueryData<any>(['auction-BTC_IRT']).book.bids[0].price, '10');
  first();
  assert.equal(sockets[0].closed, false);
  sockets[0].close();
  reconnect?.();
  assert.equal(sockets.length, 2);
  sockets[1].onopen?.();
  sockets[1].message({
    type: 'snapshot',
    symbol: 'BTC_IRT',
    market: marketSnapshot,
    auction: auctionSnapshot,
  });
  assert.deepEqual(client.getQueryData(['market-BTC_IRT']), marketSnapshot);
  assert.equal(client.getQueryState(['market-BTC_IRT'])?.isInvalidated, false);
  second();
  assert.equal(sockets[1].closed, true);
  assert.equal(sockets[1].onclose, null);
});

test('WebSocket snapshot requests report timeout and abort without using REST', async (t) => {
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } });
  t.after(() => client.clear());
  let expire: (() => void) | undefined;
  t.mock.method(globalThis, 'setTimeout', ((fn: () => void) => {
    expire = fn;
    return 1;
  }) as typeof setTimeout);
  t.mock.method(globalThis, 'clearTimeout', () => {});
  const controller = new AbortController();
  const timed = requestTradingSnapshot(client, 'BTC_IRT', 'market-BTC_IRT', controller.signal);
  const timedCheck = assert.rejects(timed, /connection unavailable/);
  expire?.();
  await timedCheck;
  const aborted = requestTradingSnapshot(client, 'BTC_IRT', 'market-BTC_IRT', controller.signal);
  const abortCheck = assert.rejects(aborted, /cancelled/);
  controller.abort();
  await abortCheck;
  assert.equal(client.getQueryCache().getAll().length, 0);
});
