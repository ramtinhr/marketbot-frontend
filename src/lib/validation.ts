import { asciiDigits } from './numbers.ts';
export function normalizeIban(value: string): string {
  return asciiDigits(value).replace(/\s/g, '').toUpperCase();
}
export function validIban(value: string): boolean {
  const iban = normalizeIban(value);
  if (!/^IR\d{24}$/.test(iban)) return false;
  const rearranged = iban.slice(4) + '1827' + iban.slice(2, 4);
  let remainder = 0;
  for (const digit of rearranged) remainder = (remainder * 10 + Number(digit)) % 97;
  return remainder === 1;
}
export function safeNext(value: string | null): string {
  return value?.startsWith('/') && !value.startsWith('//') && !value.includes('\\') ? value : '/';
}
