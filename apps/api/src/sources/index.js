import { dedupeKey } from '../productResearch.js';

export const sourceCapabilities = {
  meesho: { mode: 'manual_import', operations: ['searchProducts'] },
  amazon_india: { mode: 'manual_import', operations: ['searchProducts', 'getProductDetails'] },
  flipkart: { mode: 'manual_import', operations: ['searchProducts', 'getProductDetails'] },
  google_trends: { mode: 'manual_import', operations: ['searchProducts'] },
  google_search: { mode: 'manual_import', operations: ['searchProducts'] },
  pinterest: { mode: 'manual_import', operations: ['searchProducts'] },
  indiamart: { mode: 'manual_import', operations: ['searchProducts', 'getProductDetails'] },
  online_wholesaler: { mode: 'manual_import', operations: ['searchProducts', 'getProductDetails'] }
};

export function normalizeProduct(input) {
  return { productName: input.productName, description: input.description || null, category: input.category, source: input.source, sourceUrl: input.sourceUrl || null, sourceProductId: input.sourceProductId || null, price: input.price ?? null, originalPrice: input.originalPrice ?? null, currency: 'INR', rating: input.rating ?? null, reviewCount: input.reviewCount ?? null, sellerName: input.sellerName || null, imageUrls: input.imageUrls || [], availability: input.availability || null, observedAt: input.observedAt || new Date(), dataFieldsVerified: input.dataFieldsVerified || [], dataFieldsEstimated: input.dataFieldsEstimated || [], confidence: input.confidence || 'low', dedupeKey: dedupeKey(input) };
}

export function createManualAdapter(source) {
  if (!sourceCapabilities[source]) throw new Error(`Unsupported source: ${source}`);
  return { source, async searchProducts(products) { return products.map(normalizeProduct); }, async getProductDetails(product) { return normalizeProduct(product); } };
}
