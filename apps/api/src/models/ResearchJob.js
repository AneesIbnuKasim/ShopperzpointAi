import mongoose from 'mongoose';

const researchJobSchema = new mongoose.Schema({
  type: { type: String, required: true, enum: ['PRODUCT_ANALYSIS', 'COMPETITOR_ANALYSIS', 'PROFITABILITY_ANALYSIS', 'PRODUCT_DESCRIPTION', 'PRODUCT_CLASSIFICATION', 'TREND_ANALYSIS'] },
  payload: { type: mongoose.Schema.Types.Mixed, required: true },
  status: { type: String, enum: ['queued', 'processing', 'completed', 'failed'], default: 'queued', index: true },
  result: { type: mongoose.Schema.Types.Mixed },
  error: { type: String },
  workerId: { type: String },
  lockedAt: { type: Date },
  completedAt: { type: Date }
}, { timestamps: true });

researchJobSchema.index({ status: 1, createdAt: 1 });

export const ResearchJob = mongoose.model('ResearchJob', researchJobSchema);
