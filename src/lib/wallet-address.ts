// Format checks only: checksums, ownership and chain state require server validation.
const addressPatterns: Record<string, RegExp> = {
  ERC20: /^0x[0-9a-fA-F]{40}$/,
  BEP20: /^0x[0-9a-fA-F]{40}$/,
  TRC20: /^T[1-9A-HJ-NP-Za-km-z]{33}$/,
  BTC: /^(?:[13][1-9A-HJ-NP-Za-km-z]{25,34}|bc1[ac-hj-np-z02-9]{11,71}|BC1[AC-HJ-NP-Z02-9]{11,71})$/,
  DOGE: /^(?:D|A|9)[1-9A-HJ-NP-Za-km-z]{33}$/,
  SOL: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
  XRP: /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/,
  // Shelley payment addresses (base, enterprise and pointer), plus legacy Byron.
  // https://cips.cardano.org/cip/CIP-0019
  ADA: /^(?:addr1[ac-hj-np-z02-9]{53,98}|ADDR1[AC-HJ-NP-Z02-9]{53,98}|(?:Ae2|DdzFF|37)[1-9A-HJ-NP-Za-km-z]{37,195})$/,
  // Mainnet friendly (standard or URL-safe base64) and raw workchain formats.
  // https://github.com/ton-blockchain/TEPs/blob/master/text/0002-address.md
  TON: /^(?:[EU]Q[A-Za-z0-9+/_-]{46}|(?:0|-1):[0-9a-fA-F]{64})$/,
};

export function walletAddressError(network: string, value: string): string | null {
  const address = value.trim();
  if (!address) return 'آدرس مقصد را وارد کنید.';
  const pattern = addressPatterns[network];
  if (!pattern) return 'اعتبارسنجی آدرس این شبکه در دسترس نیست؛ شبکهٔ دیگری انتخاب کنید.';
  if (!pattern.test(address)) return `قالب آدرس مقصد برای شبکهٔ ${network} معتبر نیست.`;
  return null;
}
