export interface User {
  id: number | string;
  phone: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  created_at: string;
  telegram_id: number | null;
}
export interface Balance {
  asset: string;
  available: string;
  frozen: string;
  locked: string;
  status: string;
}
export interface Wallet {
  balances: Balance[];
  assets: string[];
  prices: Record<string, number>;
}
export interface Entry {
  id: number;
  asset: string;
  kind: string;
  amount: string;
  created_at: string;
}
export interface Market {
  symbol: string;
  depth: {
    bids: { price: string; quantity: string }[];
    asks: { price: string; quantity: string }[];
    last_price?: string;
  } | null;
  summary: {
    open: number;
    high: number;
    low: number;
    close: number;
    change_pct: number;
    volume: number;
    quote_volume: number;
  } | null;
  trades: Fill[];
}
export interface Fill {
  id: string;
  symbol: string;
  price: string;
  quantity: string;
  taker_side: 'buy' | 'sell';
  executed_at: string;
}
export interface Order {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  price: string;
  quantity: string;
  filled_quantity: string;
  status: string;
  created_at: string;
}
export interface BankAccount {
  id: string;
  label: string;
  holder_name: string;
  iban: string;
}
export interface Withdrawal {
  id: string;
  asset: string;
  amount: string;
  status: string;
  destination: string;
  created_at: string;
}
export interface Auction {
  symbol: string;
  book: {
    bids: { price: string; quantity: string }[];
    asks: { price: string; quantity: string }[];
    last_price: string;
  };
  offers: {
    id: string;
    side: 'buy' | 'sell';
    price: string;
    remaining: string;
    description?: string;
  }[];
  trades: Fill[];
}
