import test from 'node:test';
import assert from 'node:assert/strict';
import { parseObservations } from '../src/research.js';

test('normalizes imported observations and preserves evidence fields', () => {
  const [observation] = parseObservations([{
    productName: 'Cute Floral Sticker Pack',
    category: 'Cute stationery',
    provider: 'meesho',
    sourceUrl: 'https://example.com/product',
    observedPriceInr: 89,
    evidence: 'Visible listing price captured manually',
    observedAt: '2026-11-07T10:00:00.000Z'
  }]);

  assert.equal(observation.productKey, 'cute-floral-sticker-pack');
  assert.equal(observation.sourceType, 'manual_import');
  assert.equal(observation.observedPriceInr, 89);
  assert.equal(observation.evidence, 'Visible listing price captured manually');
});

test('rejects observations without a supported provider', () => {
  assert.throws(() => parseObservations([{
    productName: 'Example',
    category: 'Craft supplies',
    provider: 'unknown'
  }]));
});
