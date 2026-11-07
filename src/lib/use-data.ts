'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from './api';
import { useApp } from '@/providers/app-provider';
import {
  demoWallet,
  demoOrders,
  demoBanks,
  demoSymbols,
  demoMarket,
  demoEntries,
  demoAuction,
  demoUser,
} from './demo';
import type { Wallet, Order, BankAccount, Market, Entry, Auction, User } from './types';
export function useResource<T>(key: string, path: string, fixture: T, interval = 15000) {
  const { demo } = useApp();
  return useQuery<T>({
    queryKey: [key],
    queryFn: ({ signal }) => (demo ? Promise.resolve(fixture) : api<T>(path, { signal })),
    refetchInterval: demo ? false : interval,
  });
}
export const useWallet = () => useResource<Wallet>('wallet', '/wallet', demoWallet);
export const useOrders = () =>
  useResource<{ orders: Order[] }>('orders', '/orders?scope=all', { orders: demoOrders });
export const useBanks = () =>
  useResource<{ accounts: BankAccount[] }>('banks', '/bank-accounts', { accounts: demoBanks });
export const useSymbols = () =>
  useResource<{ symbols: string[] }>('symbols', '/market/symbols', { symbols: demoSymbols }, 60000);
export const useMarket = (symbol: string) =>
  useResource<Market>(
    `market-${symbol}`,
    `/market/${encodeURIComponent(symbol)}`,
    demoMarket(symbol),
    5000,
  );
export const useEntries = () =>
  useResource<{ entries: Entry[] }>('entries', '/wallet/entries', { entries: demoEntries });
export const useAuction = (symbol: string) =>
  useResource<Auction>(
    `auction-${symbol}`,
    `/auction/${encodeURIComponent(symbol)}`,
    demoAuction(symbol),
    5000,
  );

export function useSession() {
  const { demo } = useApp();
  return useQuery<{ user: User; verified: boolean }>({
    queryKey: ['session'],
    queryFn: () => (demo ? Promise.resolve({ user: demoUser, verified: true }) : api('/me')),
    retry: false,
    refetchInterval: demo ? false : 60000,
  });
}

export const useCryptoAssets = () =>
  useResource<{ assets: import('./crypto-funding').CryptoAsset[] }>(
    'crypto-assets',
    '/crypto/assets',
    {
      assets: [
        ['USDT', 'BEP20', 18],
        ['USDT', 'TRC20', 6],
        ['BTC', 'BTC', 8],
        ['TRX', 'TRC20', 6],
        ['ETH', 'ERC20', 18],
        ['BNB', 'BEP20', 18],
        ['DOGE', 'DOGE', 8],
        ['SOL', 'SOL', 9],
        ['XRP', 'XRP', 6],
        ['ADA', 'ADA', 6],
        ['USDC', 'ERC20', 6],
        ['SHIB', 'ERC20', 18],
      ].map(([asset, network, decimals]) => ({
        asset: String(asset),
        network: String(network),
        decimals: Number(decimals),
        deposit_enabled: false,
        withdrawal_enabled: false,
        withdrawal_fee: '0',
      })),
    },
    60000,
  );
export const useCryptoDeposits = () =>
  useResource<{ deposits: import('./crypto-funding').CryptoDeposit[] }>(
    'crypto-deposits',
    '/crypto/deposits',
    { deposits: [] },
  );
export const useCryptoWithdrawals = () =>
  useResource<{ withdrawals: import('./crypto-funding').CryptoWithdrawal[] }>(
    'crypto-withdrawals',
    '/crypto/withdrawals',
    { withdrawals: [] },
  );
