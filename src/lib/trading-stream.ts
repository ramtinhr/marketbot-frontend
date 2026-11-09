import type { QueryClient } from '@tanstack/react-query';
import type { Auction, Market, Order, Wallet, Fill } from './types';

// Cards and table rows for the same pair share a subscription.
const subscriptions = new WeakMap<
  QueryClient,
  Map<string, { users: number; close: () => void; refresh: () => void }>
>();

// Query loading/error/retry state follows the WebSocket snapshot, never REST.
export function requestTradingSnapshot<T>(
  client: QueryClient,
  symbol: string,
  key: string,
  signal: AbortSignal,
) {
  return new Promise<T>((resolve, reject) => {
    const finish = (error?: Error, value?: T) => {
      unsubscribe();
      clearTimeout(timeout);
      signal.removeEventListener('abort', abort);
      if (error) reject(error);
      else resolve(value!);
    };
    const unsubscribe = client.getQueryCache().subscribe((event) => {
      if (
        event.type === 'updated' &&
        event.query.queryKey[0] === key &&
        event.action.type === 'success'
      )
        finish(undefined, event.query.state.data as T);
    });
    const timeout = setTimeout(
      () => finish(new Error('Live market connection unavailable')),
      15000,
    );
    const abort = () => finish(new Error('Live market request cancelled'));
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) abort();
    else subscriptions.get(client)?.get(symbol)?.refresh();
  });
}

export function subscribeTradingLive(client: QueryClient, symbol: string) {
  let active = subscriptions.get(client);
  if (!active) subscriptions.set(client, (active = new Map()));
  const existing = active.get(symbol);
  if (existing) {
    existing.users++;
    return () => {
      if (--existing.users === 0) {
        existing.close();
        active.delete(symbol);
      }
    };
  }
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
      for (const key of ['orders', 'auction-orders', 'wallet'])
        void client.invalidateQueries({ queryKey: [key] });
    };
    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.symbol && msg.symbol !== symbol && !['user', 'auction_user'].includes(msg.type))
          return;
        if (msg.type === 'snapshot' && msg.symbol === symbol) {
          client.setQueryData<Market>([`market-${symbol}`], msg.market);
          client.setQueryData<Auction>([`auction-${symbol}`], msg.auction);
          return;
        }
        const appendTrades = (old: Fill[], incoming: Fill[]) =>
          [...new Map([...incoming, ...old].map((t) => [t.id, t])).values()].slice(0, 100);
        if (msg.type === 'summary' && msg.symbol === symbol)
          client.setQueryData<Market>([`market-${symbol}`], (old) =>
            old ? { ...old, summary: msg.summary } : old,
          );
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
        /* Ignore malformed frames; reconnect fetches a fresh snapshot. */
      }
    };
    socket.onclose = () => {
      if (!stopped) timer = setTimeout(connect, 3000);
    };
    socket.onerror = () => socket.close();
  };
  connect();
  const subscription = {
    users: 1,
    refresh: () => {
      if (socket.readyState === WebSocket.OPEN)
        socket.send(JSON.stringify({ type: 'subscribe', symbol }));
    },
    close: () => {
      stopped = true;
      clearTimeout(timer);
      socket.onclose = null;
      socket.onerror = null;
      socket.onmessage = null;
      socket.onopen = null;
      socket.close();
    },
  };
  active.set(symbol, subscription);
  return () => {
    if (--subscription.users === 0) {
      subscription.close();
      active.delete(symbol);
    }
  };
}
