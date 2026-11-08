'use client';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useApp } from '@/providers/app-provider';
import type { Auction, Market, Order, Wallet, Fill } from './types';

export function useTradingLive(symbol: string) {
  const client = useQueryClient();
  const { demo } = useApp();
  useEffect(() => {
    if (demo) return;
    let stopped = false;
    let socket: WebSocket;
    let timer: ReturnType<typeof setTimeout>;
    const connect = () => {
      socket = new WebSocket(
        `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/api/live`,
      );
      socket.onopen = () => {
        socket.send(JSON.stringify({ type: 'subscribe', symbol }));
        // Recover events missed during a disconnect.
        for (const key of [
          'orders',
          'auction-orders',
          'wallet',
          `market-${symbol}`,
          `auction-${symbol}`,
        ])
          void client.invalidateQueries({ queryKey: [key] });
      };
      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.symbol && msg.symbol !== symbol && !['user', 'auction_user'].includes(msg.type))
            return;
          const appendTrades = (old: Fill[], incoming: Fill[]) =>
            [...new Map([...incoming, ...old].map((t) => [t.id, t])).values()].slice(0, 100);
          if (msg.type === 'depth' && msg.depth?.symbol === symbol)
            client.setQueryData<Market>([`market-${symbol}`], (old) =>
              old ? { ...old, depth: msg.depth } : old,
            );
          if (msg.type === 'balances')
            client.setQueryData<Wallet>(['wallet'], (old) =>
              old ? { ...old, balances: msg.balances } : old,
            );
          if (msg.type === 'user' || msg.type === 'auction_user') {
            const key = msg.type === 'user' ? 'orders' : 'auction-orders';
            client.setQueryData<{ orders: Order[] }>([key], (old) =>
              old
                ? {
                    orders: [
                      ...new Map<string, Order>(
                        [...old.orders, ...msg.orders].map((o: Order) => [o.id, o]),
                      ).values(),
                    ].sort((a, b) => b.created_at.localeCompare(a.created_at)),
                  }
                : old,
            );
          }
          if (msg.type === 'trades')
            client.setQueryData<Market>([`market-${symbol}`], (old) =>
              old ? { ...old, trades: appendTrades(old.trades, msg.trades) } : old,
            );
          if (msg.type.startsWith('auction_'))
            client.setQueryData<Auction>([`auction-${symbol}`], (old) =>
              old
                ? {
                    ...old,
                    ...(msg.type === 'auction_book' ? { book: msg.book } : {}),
                    ...(msg.type === 'auction_offers' ? { offers: msg.offers } : {}),
                    ...(msg.type === 'auction_trades'
                      ? { trades: appendTrades(old.trades, msg.trades) }
                      : {}),
                  }
                : old,
            );
        } catch {
          /* Polling reconciles malformed or missed events. */
        }
      };
      socket.onclose = () => {
        if (!stopped) timer = setTimeout(connect, 3000);
      };
      socket.onerror = () => socket.close();
    };
    connect();
    return () => {
      stopped = true;
      clearTimeout(timer);
      socket.close();
    };
  }, [client, demo, symbol]);
}
