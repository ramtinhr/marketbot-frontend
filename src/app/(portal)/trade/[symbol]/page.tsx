import { notFound } from 'next/navigation';
import { Trading } from '@/features/trading/trading';
export const metadata = { title: 'معامله' };
export default async function Page({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  if (!/^[A-Z0-9]{2,15}_[A-Z0-9]{2,15}$/.test(symbol)) notFound();
  return <Trading key={symbol} symbol={symbol} />;
}
