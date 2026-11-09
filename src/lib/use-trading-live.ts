'use client';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useApp } from '@/providers/app-provider';
import { subscribeTradingLive } from './trading-stream';

export function useTradingLive(symbol: string) {
  const client = useQueryClient();
  const { demo } = useApp();
  useEffect(() => {
    if (!demo) return subscribeTradingLive(client, symbol);
  }, [client, demo, symbol]);
}
