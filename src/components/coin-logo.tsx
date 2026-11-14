import Image from 'next/image';

const logos: Record<string, string> = {
  BTC: '/coins/btc.webp',
  ETH: '/coins/eth.webp',
  USDT: '/coins/usdt.webp',
  TON: '/coins/ton.webp',
  SOL: '/coins/sol.webp',
};

/** Decorative logo; the surrounding asset label supplies the accessible name. */
export function CoinLogo({ asset }: { asset: string }) {
  const symbol = asset.toUpperCase();
  const src = logos[symbol];
  if (!src) return symbol === 'IRT' ? 'ت' : symbol.charAt(0);

  return (
    <Image
      src={src}
      alt=""
      width={96}
      height={96}
      loading="lazy"
      decoding="async"
      unoptimized
      style={{ display: 'block', width: '100%', height: '100%', objectFit: 'contain' }}
    />
  );
}
