import mongoose from 'mongoose';

const researchProductSchema = new mongoose.Schema({
  productKey: { type: String, required: true, unique: true, index: true },
  productName: { type: String, required: true, index: true },
  category: { type: String, required: true, index: true },
  description: String,
  sourceMarketplaces: [{ type: String, enum: ['meesho', 'amazon_india', 'flipkart'] }],
  sourceUrls: [String],
  dataFieldsVerified: [String],
  dataFieldsEstimated: [String],
  confidence: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
  status: { type: String, enum: ['new', 'interested', 'rejected'], default: 'new' },
  notes: String
}, { timestamps: true });

export const ResearchProduct = mongoose.model('ResearchProduct', researchProductSchema);
