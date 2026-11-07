import assert from 'node:assert/strict';
import { test } from 'node:test';
import { decimalUnits, formatAmountInput, parseDecimal } from '../src/lib/numbers.ts';
import { validIban, normalizeIban } from '../src/lib/validation.ts';
test('amounts normalize grouped English, Persian and Arabic digits without losing decimals', () => {
  for (const value of ['1,234,567.8900', '۱٬۲۳۴٬۵۶۷٫۸۹۰۰', '١٬٢٣٤٬٥٦٧٫٨٩٠٠'])
    assert.equal(parseDecimal(value), '1234567.8900');
  assert.equal(parseDecimal('۵٬۰۰۰٬۰۰۰', 0), '5000000');
  assert.equal(decimalUnits('1,000.000000000000000001'), 1000000000000000000001n);
});
test('validation rejects bad grouping, fractions in Toman, excess precision and non-numeric expressions', () => {
  for (const raw of [
    '1,2',
    '1 2',
    '1,000,00',
    '1e5',
    '-1',
    '+1',
    '1/2',
    'NaN',
    '1.2.3',
    '1abc',
    '0',
    '1.',
  ])
    assert.equal(parseDecimal(raw), null, raw);
  assert.equal(parseDecimal('1.5', 0), null);
  assert.equal(parseDecimal('1.123456789', 8), null);
  assert.equal(parseDecimal('999999999999999'), '999999999999999');
  assert.equal(parseDecimal('1000000000000000'), null);
});
test('live grouping preserves fractional zeros and invalid input for visible errors', () => {
  assert.equal(formatAmountInput('۱۲۳۴۵۶۷٫۰۰۱۰'), '1,234,567.0010');
  assert.equal(formatAmountInput('1,2345.00'), '12,345.00');
  assert.equal(formatAmountInput('12.'), '12.');
  for (const raw of ['-5', '1e5', '1.2.3', '1/2', '12abc', '1 2'])
    assert.equal(formatAmountInput(raw), raw);
});
test('Persian bank account digits normalize before checksum validation', () => {
  const iban = 'IR۸۲۰۵۴۰۱۰۲۶۸۰۰۲۰۸۱۷۹۰۹۰۰۲';
  assert.equal(validIban(iban), true);
  assert.equal(normalizeIban(iban), 'IR820540102680020817909002');
});
