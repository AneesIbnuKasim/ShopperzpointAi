import mongoose from 'mongoose';

const productFeedbackSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'ResearchProduct', required: true, index: true },
  action: { type: String, enum: ['interested', 'rejected', 'note'], required: true },
  note: String
}, { timestamps: true });

export const ProductFeedback = mongoose.model('ProductFeedback', productFeedbackSchema);
