'use client';
import { ui } from '@/lib/ui-styles';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
interface Notice {
  text: string;
  error: boolean;
  id: number;
}
const AppContext = createContext<{
  demo: boolean;
  notify: (text: string, error?: boolean) => void;
}>({ demo: false, notify: () => {} });
export const useApp = () => useContext(AppContext);
export function AppProvider({ children, demo }: { children: ReactNode; demo: boolean }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 15_000, retry: 1, refetchOnWindowFocus: true } },
      }),
  );
  const [notices, setNotices] = useState<Notice[]>([]);
  const notify = (text: string, error = false) => {
    const id = Date.now();
    setNotices((n) => [...n, { text, error, id }]);
    setTimeout(() => setNotices((n) => n.filter((x) => x.id !== id)), 5000);
  };
  return (
    <QueryClientProvider client={client}>
      <AppContext.Provider value={{ demo, notify }}>
        {children}
        <div
          data-ui="notifications"
          className="fixed [bottom:24px] [left:26px] [z-index:120] flex flex-col [gap:9px] [@media(width<=640px)]:[bottom:16px] [@media(width<=640px)]:[left:16px]"
          aria-live="polite"
        >
          {notices.map((n) => (
            <div {...ui(`notification ${n.error ? 'error' : ''}`)} key={n.id}>
              {n.error ? <AlertCircle size={19} /> : <CheckCircle2 size={19} />}
              <span>{n.text}</span>
              <button
                data-ui="icon-button"
                className="inline-flex items-center justify-center [width:30px] [height:30px] [border-radius:7px] [color:#8d99a7] [padding-top:0] [padding-right:0] [padding-bottom:0] [padding-left:0] [@media(width<=640px)]:[min-width:44px] [@media(width<=640px)]:[min-height:44px] [@media(width>640px)]:[@media(width<=800px)]:[min-width:34px] [@media(width>640px)]:[@media(width<=800px)]:[min-height:34px] [&:hover]:[background:#f3f6f7] [&:hover]:[color:var(--text)]"
                aria-label="بستن پیام"
                onClick={() => setNotices((items) => items.filter((x) => x.id !== n.id))}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      </AppContext.Provider>
    </QueryClientProvider>
  );
}
