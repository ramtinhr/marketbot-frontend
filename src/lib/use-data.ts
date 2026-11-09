'use client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { requestTradingSnapshot } from './trading-stream';
import { useTradingLive } from './use-trading-live';
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
export function useResource<T>(
  key: string,
  path: string,
  fixture: T,
  interval: number | false = 15000,
) {
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
function useStreamResource<T>(key: string, symbol: string, fixture: T) {
  useTradingLive(symbol);
  const client = useQueryClient();
  const { demo } = useApp();
  return useQuery<T>({
    queryKey: [key],
    queryFn: ({ signal }) =>
      demo ? Promise.resolve(fixture) : requestTradingSnapshot<T>(client, symbol, key, signal),
    staleTime: Infinity,
    refetchInterval: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  });
}
export const useMarket = (symbol: string) =>
  useStreamResource<Market>(`market-${symbol}`, symbol, demoMarket(symbol));
export const useEntries = () =>
  useResource<{ entries: Entry[] }>('entries', '/wallet/entries', { entries: demoEntries });
export const useAuction = (symbol: string) =>
  useStreamResource<Auction>(`auction-${symbol}`, symbol, demoAuction(symbol));

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
