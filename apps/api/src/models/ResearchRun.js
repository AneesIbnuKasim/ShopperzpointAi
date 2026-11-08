import mongoose from 'mongoose';

const researchRunSchema = new mongoose.Schema({
  category: { type: String, required: true },
  keywords: [{ type: String }],
  providers: [{ type: String, enum: ['meesho', 'amazon_india', 'flipkart', 'google_trends', 'google_search'] }],
  mode: { type: String, enum: ['manual_import', 'approved_source'], default: 'manual_import' },
  status: { type: String, enum: ['awaiting_source_data', 'analysing', 'completed', 'failed'], default: 'awaiting_source_data' },
  limitation: { type: String }
}, { timestamps: true });

researchRunSchema.index({ createdAt: -1 });

export const ResearchRun = mongoose.model('ResearchRun', researchRunSchema);
