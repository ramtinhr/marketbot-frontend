import type { User, Wallet, Market, Order, BankAccount, Entry, Auction } from './types';
export const demoUser: User = {
  id: 1,
  phone: '+989121234567',
  first_name: 'آرمان',
  last_name: 'احمدی',
  username: 'arman',
  telegram_id: null,
  created_at: '2025-08-12T10:00:00Z',
};
export const demoWallet: Wallet = {
  assets: ['IRT', 'USDT', 'BTC', 'ETH', 'TON'],
  prices: { USDT: 108450, BTC: 7568230000, ETH: 287540000, TON: 324800 },
  balances: [
    { asset: 'IRT', available: '48250000', frozen: '5000000', locked: '0', status: 'active' },
    { asset: 'USDT', available: '825.5', frozen: '100', locked: '0', status: 'active' },
    { asset: 'BTC', available: '0.00842', frozen: '0', locked: '0', status: 'active' },
    { asset: 'ETH', available: '0.124', frozen: '0', locked: '0', status: 'active' },
    { asset: 'TON', available: '24.8', frozen: '0', locked: '0', status: 'active' },
  ],
};
export const demoSymbols = ['USDT_IRT', 'BTC_IRT', 'ETH_IRT', 'TON_IRT'];
const changes: Record<string, number> = { USDT: 1.24, BTC: 2.86, ETH: -0.72, TON: 3.15 };
export function demoMarket(symbol: string): Market {
  const base = symbol.split('_')[0];
  const price = demoWallet.prices[base] ?? 108450;
  const seed = [...base].reduce((sum, s) => sum + s.charCodeAt(0), 0);
  return {
    symbol,
    summary: {
      open: price * 0.98,
      high: price * 1.03,
      low: price * 0.97,
      close: price,
      change_pct: changes[base] ?? 1.24,
      volume: 12542.8,
      quote_volume: price * 12542.8,
    },
    depth: {
      last_price: String(price),
      bids: Array.from({ length: 8 }, (_, i) => ({
        price: String(Math.round(price * (1 - 0.0005 * (i + 1)))),
        quantity: String(40 + ((seed * (i + 3)) % 240)),
      })),
      asks: Array.from({ length: 8 }, (_, i) => ({
        price: String(Math.round(price * (1 + 0.0005 * (i + 1)))),
        quantity: String(35 + ((seed * (i + 2)) % 210)),
      })),
    },
    trades: Array.from({ length: 40 }, (_, i) => ({
      id: `fill-${i}`,
      symbol,
      price: String(Math.round(price * (0.975 + i / 1600 + Math.sin(i * 0.8 + seed) * 0.004))),
      quantity: String((i % 8) + 0.5),
      taker_side: i % 3 ? 'buy' : 'sell',
      executed_at: new Date(Date.UTC(2026, 10, 4, 10, i)).toISOString(),
    })),
  };
}
export const demoOrders: Order[] = [
  {
    id: 'order-1',
    symbol: 'USDT_IRT',
    side: 'buy',
    price: '107900',
    quantity: '100',
    filled_quantity: '0',
    status: 'open',
    created_at: '2026-11-04T09:42:00Z',
  },
  {
    id: 'order-2',
    symbol: 'BTC_IRT',
    side: 'sell',
    price: '7650000000',
    quantity: '0.00065',
    filled_quantity: '0',
    status: 'open',
    created_at: '2026-11-04T08:25:00Z',
  },
  {
    id: 'order-3',
    symbol: 'USDT_IRT',
    side: 'buy',
    price: '106850',
    quantity: '250',
    filled_quantity: '250',
    status: 'filled',
    created_at: '2026-11-03T13:12:00Z',
  },
  {
    id: 'order-4',
    symbol: 'ETH_IRT',
    side: 'buy',
    price: '286100000',
    quantity: '0.124',
    filled_quantity: '0.124',
    status: 'filled',
    created_at: '2026-11-02T11:30:00Z',
  },
];
export const demoBanks: BankAccount[] = [
  {
    id: 'bank-1',
    label: 'حساب شخصی',
    holder_name: 'آرمان احمدی',
    iban: 'IR820540102680020817909002',
  },
];
export const demoEntries: Entry[] = [
  { id: 1, asset: 'IRT', kind: 'charge', amount: '25000000', created_at: '2026-11-04T09:10:00Z' },
  { id: 2, asset: 'USDT', kind: 'trade', amount: '250', created_at: '2026-11-03T13:12:00Z' },
  { id: 3, asset: 'ETH', kind: 'trade', amount: '0.124', created_at: '2026-11-02T11:30:00Z' },
];
export function demoAuction(symbol: string): Auction {
  const m = demoMarket(symbol);
  return {
    symbol,
    book: { bids: m.depth!.bids, asks: m.depth!.asks, last_price: m.depth!.last_price! },
    offers: [],
    trades: [],
  };
}
