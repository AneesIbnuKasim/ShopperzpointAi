import mongoose from 'mongoose';

const researchObservationSchema = new mongoose.Schema({
  productKey: { type: String, required: true, index: true },
  productName: { type: String, required: true },
  category: { type: String, required: true },
  provider: { type: String, enum: ['meesho', 'amazon_india', 'flipkart', 'google_trends', 'google_search'], required: true },
  sourceType: { type: String, enum: ['official_api', 'seller_central', 'public_page', 'manual_import'], required: true },
  sourceUrl: { type: String },
  observedPriceInr: { type: Number, min: 0 },
  rating: { type: Number, min: 0, max: 5 },
  reviewCount: { type: Number, min: 0 },
  salesRank: { type: Number, min: 1 },
  salesRankCategory: { type: String },
  salesUnits: { type: Number, min: 0 },
  salesRevenueInr: { type: Number, min: 0 },
  salesPeriod: { type: String, enum: ['hour', 'day', 'week', 'month', 'custom'] },
  salesDataSource: { type: String },
  reviewHighlights: [{ type: String }],
  trendDirection: { type: String, enum: ['rising', 'stable', 'falling', 'unknown'], default: 'unknown' },
  evidence: { type: String },
  dataStatus: { type: String, enum: ['verified', 'estimated', 'unavailable'], default: 'verified' },
  observedAt: { type: Date, required: true },
  runId: { type: mongoose.Schema.Types.ObjectId, ref: 'ResearchRun' }
}, { timestamps: true });

researchObservationSchema.index({ productKey: 1, provider: 1, observedAt: -1 });

export const ResearchObservation = mongoose.model('ResearchObservation', researchObservationSchema);
