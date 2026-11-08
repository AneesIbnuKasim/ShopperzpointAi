import mongoose from 'mongoose';

const productOpportunitySchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'ResearchProduct', required: true, index: true },
  researchDate: { type: Date, required: true, index: true },
  marketOpportunityScore: { type: Number, min: 0, max: 100 },
  profitabilityScore: { type: Number, min: 0, max: 100 },
  confidence: { type: String, enum: ['low', 'medium', 'high'] },
  dataCompleteness: { type: Number, min: 0, max: 100 },
  positiveFactors: [String],
  risks: [String],
  missingInformation: [String],
  scoreInputs: mongoose.Schema.Types.Mixed
}, { timestamps: true });

productOpportunitySchema.index({ researchDate: -1, marketOpportunityScore: -1 });

export const ProductOpportunity = mongoose.model('ProductOpportunity', productOpportunitySchema);
