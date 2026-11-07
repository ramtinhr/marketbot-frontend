/** User-facing numbers: commas/٬ group thousands; dot/٫ separates decimals. */
export function asciiDigits(raw: string): string {
  return raw
    .replace(/[۰-۹]/g, (c) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c)))
    .replace(/[٠-٩]/g, (c) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(c)));
}
export function parseDecimal(
  raw: string,
  decimals = 8,
  wholeDigits = 15,
  positive = true,
): string | null {
  const text = asciiDigits(raw).trim().replace(/٫/g, '.');
  const [whole, fraction, ...extra] = text.split('.');
  if (extra.length || !/^(?:\d+|\d{1,3}(?:,\d{3})+|\d{1,3}(?:٬\d{3})+)$/.test(whole)) return null;
  if (
    fraction !== undefined &&
    (!decimals || !/^\d+$/.test(fraction) || fraction.length > decimals)
  )
    return null;
  const integer = whole.replace(/[,٬]/g, '').replace(/^0+(?=\d)/, '');
  if (integer.length > wholeDigits) return null;
  const result = integer + (fraction !== undefined ? '.' + fraction : '');
  return positive && !/[1-9]/.test(result) ? null : result;
}
/** Preserve incomplete decimals, excess precision and invalid text for validation. */
export function formatAmountInput(raw: string): string {
  const normalized = asciiDigits(raw).replace(/٫/g, '.');
  const clean = normalized.replace(/[,٬]/g, '');
  if (!/^\d*(?:\.\d*)?$/.test(clean)) return normalized;
  const [whole, fraction] = clean.split('.');
  return (
    (whole.replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',') ||
      (fraction !== undefined ? '0' : '')) + (fraction !== undefined ? '.' + fraction : '')
  );
}
export function decimalUnits(raw: string, decimals = 18): bigint | null {
  const value = parseDecimal(raw, decimals, 18, false);
  if (value === null) return null;
  const [whole, fraction = ''] = value.split('.');
  return BigInt(whole + fraction.padEnd(decimals, '0'));
}
