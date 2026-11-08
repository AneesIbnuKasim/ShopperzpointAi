import test from 'node:test';
import assert from 'node:assert/strict';
import { createManualAdapter, normalizeProduct } from '../src/sources/index.js';
import { productKey, scoreProduct } from '../src/productResearch.js';

test('normalizes manual source data without inventing missing values', async () => {
  const adapter = createManualAdapter('amazon_india');
  const [product] = await adapter.searchProducts([{ productName: 'Pipe Cleaner Kit', category: 'Craft supplies', source: 'amazon_india' }]);
  assert.equal(product.price, null);
  assert.equal(product.currency, 'INR');
  assert.equal(product.confidence, 'low');
  assert.equal(product.dedupeKey, productKey('Pipe Cleaner Kit', 'Craft supplies'));
});

test('keeps materially different pack sizes separate through the product key', () => {
  assert.notEqual(productKey('Sticker pack 20 pieces', 'Stationery'), productKey('Sticker pack 50 pieces', 'Stationery'));
});

test('reduces scores and confidence when cost evidence is missing', () => {
  const score = scoreProduct({ observations: [{ price: 99, rating: 4.5, reviewCount: 40 }] });
  assert.equal(score.profitabilityScore, 0);
  assert.equal(score.confidence, 'medium');
  assert.ok(score.missingInformation.includes('supplier quote'));
});
