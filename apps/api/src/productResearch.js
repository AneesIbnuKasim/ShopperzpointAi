import { z } from 'zod';

export const researchSources = ['meesho', 'amazon_india', 'flipkart', 'google_trends', 'google_search', 'pinterest', 'indiamart', 'online_wholesaler', 'manual'];
export const researchCategories = ['Craft supplies', 'Hamper materials', 'Artificial flowers', 'Kawaii products', 'Stationery', 'Balloon and party supplies'];

export const importedProductSchema = z.object({
  productName: z.string().trim().min(1).max(200),
  category: z.string().trim().min(1).max(100),
  source: z.enum(researchSources),
  sourceUrl: z.string().url().optional(),
  sourceProductId: z.string().trim().max(100).optional(),
  description: z.string().trim().max(2000).optional(),
  price: z.number().nonnegative().optional(),
  originalPrice: z.number().nonnegative().optional(),
  rating: z.number().min(0).max(5).optional(),
  reviewCount: z.number().int().nonnegative().optional(),
  sellerName: z.string().trim().max(200).optional(),
  imageUrls: z.array(z.string().url()).max(10).default([]),
  availability: z.string().trim().max(100).optional(),
  observedAt: z.coerce.date().default(() => new Date()),
  dataFieldsVerified: z.array(z.string()).default([]),
  dataFieldsEstimated: z.array(z.string()).default([]),
  confidence: z.enum(['low', 'medium', 'high']).default('low')
});

export const importSchema = z.object({ products: z.array(importedProductSchema).min(1).max(500) });

export function productKey(name, category) {
  return `${category}-${name}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function dedupeKey(product) {
  return productKey(product.productName, product.category);
}

export function scoreProduct({ observations, supplierCost, sellingPrice, packagingCost = 0, fees = 0, shippingCost = 0, returnCost = 0 }) {
  const hasPrice = observations.some((item) => item.price != null);
  const hasDemand = observations.some((item) => item.rating != null || item.reviewCount != null);
  const hasTrend = observations.some((item) => item.rawData?.trendDirection);
  const hasSupplier = supplierCost != null;
  const marketOpportunityScore = Math.round(((hasDemand ? 25 : 0) + (hasSupplier && sellingPrice ? 25 : 0) + (observations.length > 1 ? 15 : 5) + (hasTrend ? 15 : 0) + (hasDemand ? 10 : 0) + (hasPrice ? 10 : 0)));
  const totalCost = [supplierCost, packagingCost, fees, shippingCost, returnCost].every((value) => value != null) ? supplierCost + packagingCost + fees + shippingCost + returnCost : null;
  const profit = totalCost != null && sellingPrice != null ? sellingPrice - totalCost : null;
  const margin = profit != null && sellingPrice > 0 ? (profit / sellingPrice) * 100 : null;
  const profitabilityScore = margin == null ? 0 : Math.max(0, Math.min(100, Math.round(margin * 2)));
  const present = [hasPrice, hasDemand, hasSupplier, sellingPrice != null, totalCost != null].filter(Boolean).length;
  return { marketOpportunityScore, profitabilityScore, confidence: present >= 4 ? 'high' : present >= 2 ? 'medium' : 'low', dataCompleteness: present * 20, totalCost, profit, margin, missingInformation: [!hasPrice && 'marketplace price', !hasDemand && 'ratings or reviews', !hasSupplier && 'supplier quote', sellingPrice == null && 'selling price', totalCost == null && 'complete cost inputs'].filter(Boolean) };
}
