import mongoose from 'mongoose';

const productObservationSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'ResearchProduct', required: true, index: true },
  source: { type: String, required: true, index: true },
  sourceProductId: String,
  sourceUrl: String,
  price: { type: Number, min: 0 },
  originalPrice: { type: Number, min: 0 },
  currency: { type: String, default: 'INR' },
  rating: { type: Number, min: 0, max: 5 },
  reviewCount: { type: Number, min: 0 },
  sellerName: String,
  imageUrls: [String],
  availability: String,
  observedAt: { type: Date, required: true, index: true },
  dataFieldsVerified: [String],
  dataFieldsEstimated: [String],
  confidence: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
  rawData: mongoose.Schema.Types.Mixed
}, { timestamps: true });

productObservationSchema.index({ productId: 1, observedAt: -1 });

export const ProductObservation = mongoose.model('ProductObservation', productObservationSchema);
