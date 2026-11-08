import test from 'node:test';
import assert from 'node:assert/strict';
import { supportedJobTypes, validateStructuredResult } from '../src/orchestrator.js';

test('supports every Phase 2 AI job type', () => {
  assert.deepEqual(supportedJobTypes, [
    'PRODUCT_ANALYSIS',
    'COMPETITOR_ANALYSIS',
    'PROFITABILITY_ANALYSIS',
    'PRODUCT_DESCRIPTION',
    'PRODUCT_CLASSIFICATION',
    'TREND_ANALYSIS',
    'PRODUCT_DISCOVERY',
    'MARKET_DEMAND_ANALYSIS',
    'SUPPLIER_ANALYSIS',
    'PRODUCT_OPPORTUNITY_SCORING',
    'PRODUCT_DEDUPLICATION'
  ]);
});

test('rejects an unstructured or incomplete product analysis response', () => {
  assert.equal(validateStructuredResult('PRODUCT_ANALYSIS', { opportunity_score: 120 }), false);
  assert.equal(validateStructuredResult('PRODUCT_ANALYSIS', {
    product_name: 'Pipe Cleaner Craft Kit',
    category: 'Craft Supplies',
    demand_assessment: 'Promising',
    competition_assessment: 'Moderate',
    opportunity_score: 85,
    confidence: 'Medium',
    reasoning: ['Suitable for DIY craft projects']
  }), true);
});
