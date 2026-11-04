'use client';
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
        <div className="notifications" aria-live="polite">
          {notices.map((n) => (
            <div className={`notification ${n.error ? 'error' : ''}`} key={n.id}>
              {n.error ? <AlertCircle size={19} /> : <CheckCircle2 size={19} />}
              <span>{n.text}</span>
              <button
                className="icon-button"
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
