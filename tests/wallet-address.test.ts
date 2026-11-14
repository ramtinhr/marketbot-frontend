import assert from 'node:assert/strict';
import { test } from 'node:test';
import { walletAddressError } from '../src/lib/wallet-address.ts';

const examples: Record<string, string[]> = {
  ERC20: ['0x' + 'aB12'.repeat(10)],
  BEP20: ['0x' + 'aB12'.repeat(10)],
  TRC20: ['T' + 'a'.repeat(33)],
  BTC: [
    '1' + 'a'.repeat(33),
    '3' + 'a'.repeat(33),
    'bc1q' + 'a'.repeat(38),
    'bc1p' + 'a'.repeat(58),
  ],
  DOGE: ['D' + 'a'.repeat(33), 'A' + 'a'.repeat(33), '9' + 'a'.repeat(33)],
  SOL: ['1'.repeat(32), 'a'.repeat(44)],
  XRP: ['r' + 'a'.repeat(33)],
  ADA: [
    'addr1' + 'q'.repeat(53),
    'addr1' + 'q'.repeat(98),
    'Ae2' + 'a'.repeat(56),
    'DdzFF' + 'a'.repeat(99),
  ],
  TON: [
    'EQ' + 'a'.repeat(46),
    'UQ' + '_'.repeat(46),
    '0:' + 'a'.repeat(64),
    '-1:' + 'B'.repeat(64),
  ],
};

test('accepts supported address formats and surrounding whitespace', () => {
  for (const [network, addresses] of Object.entries(examples)) {
    for (const address of addresses) {
      assert.equal(walletAddressError(network, address), null, `${network}: ${address}`);
      assert.equal(walletAddressError(network, ` ${address}\n`), null);
    }
  }
});

test('rejects missing addresses, internal whitespace, URI payloads and unsupported networks', () => {
  for (const [network, addresses] of Object.entries(examples)) {
    assert.ok(walletAddressError(network, '  '));
    assert.ok(walletAddressError(network, addresses[0] + '?memo=1'));
    assert.ok(
      walletAddressError(network, addresses[0].slice(0, 10) + ' ' + addresses[0].slice(10)),
    );
    assert.ok(walletAddressError(network, addresses[0] + '\nmalicious'));
  }
  assert.ok(walletAddressError('UNKNOWN', examples.ERC20[0]));
});

test('rejects wrong networks, forbidden characters, lengths and testnet addresses', () => {
  for (const [network, address] of [
    ['ERC20', '0x' + 'a'.repeat(39)],
    ['TRC20', 'T' + '0'.repeat(33)],
    ['BTC', 'tb1q' + 'a'.repeat(38)],
    ['BTC', 'bc1q' + 'A'.repeat(38)],
    ['DOGE', examples.BTC[0]],
    ['SOL', '0'.repeat(44)],
    ['XRP', examples.TRC20[0]],
    ['ADA', 'addr_test1' + 'q'.repeat(53)],
    ['ADA', 'stake1' + 'q'.repeat(53)],
    ['ADA', examples.SOL[1]],
    ['TON', 'kQ' + 'a'.repeat(46)],
    ['TON', 'EQ' + 'a'.repeat(45)],
  ])
    assert.ok(walletAddressError(network, address), `${network}: ${address}`);
});
