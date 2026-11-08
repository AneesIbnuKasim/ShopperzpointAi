import { z } from 'zod';

export const providers = ['meesho', 'amazon_india', 'flipkart', 'google_trends', 'google_search'];

const observationSchema = z.object({
  productName: z.string().trim().min(1).max(200),
  category: z.string().trim().min(1).max(100),
  provider: z.enum(providers),
  sourceUrl: z.string().url().optional(),
  observedPriceInr: z.number().nonnegative().optional(),
  rating: z.number().min(0).max(5).optional(),
  reviewCount: z.number().int().nonnegative().optional(),
  salesRank: z.number().int().positive().optional(),
  salesRankCategory: z.string().trim().max(200).optional(),
  salesUnits: z.number().nonnegative().optional(),
  salesRevenueInr: z.number().nonnegative().optional(),
  salesPeriod: z.enum(['hour', 'day', 'week', 'month', 'custom']).optional(),
  salesDataSource: z.string().trim().max(500).optional(),
  reviewHighlights: z.array(z.string().trim().min(1).max(500)).max(20).default([]),
  trendDirection: z.enum(['rising', 'stable', 'falling', 'unknown']).default('unknown'),
  evidence: z.string().trim().max(2000).optional(),
  dataStatus: z.enum(['verified', 'estimated', 'unavailable']).default('verified'),
  observedAt: z.coerce.date().default(() => new Date())
});

export const runSchema = z.object({
  category: z.string().trim().min(1).max(100),
  keywords: z.array(z.string().trim().min(1).max(100)).min(1).max(30),
  providers: z.array(z.enum(providers)).min(1),
  mode: z.enum(['manual_import', 'approved_source']).default('manual_import')
});

export function parseObservations(value) {
  return z.array(observationSchema).min(1).max(500).parse(value).map((observation) => ({
    ...observation,
    productKey: observation.productName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    sourceType: 'manual_import'
  }));
}
