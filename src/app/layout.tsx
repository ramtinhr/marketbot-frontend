import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { AppProvider } from '@/providers/app-provider';
import './globals.css';
export const dynamic = 'force-dynamic';
const vazir = localFont({
  src: '../../public/fonts/Vazirmatn.woff2',
  variable: '--font-vazir',
  display: 'swap',
});
export const metadata: Metadata = {
  title: { default: 'پارس کریپتو اکسچنج | پنل کاربری', template: '%s | پارس کریپتو اکسچنج' },
  description: 'پنل کاربری پارس کریپتو اکسچنج؛ مدیریت دارایی، مشاهدهٔ بازارها و معاملات',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" className={vazir.variable}>
      {/* Extensions may add body attributes (e.g. cz-shortcut-listen) before hydration.
          Limit suppression to this element; descendant hydration checks remain active. */}
      <body suppressHydrationWarning>
        <AppProvider demo={process.env.MARKETBOT_DEMO_MODE === 'true'}>{children}</AppProvider>
      </body>
    </html>
  );
}
