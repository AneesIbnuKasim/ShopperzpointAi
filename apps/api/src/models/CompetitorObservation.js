import mongoose from 'mongoose';

const competitorObservationSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'ResearchProduct', required: true, index: true },
  name: { type: String, required: true },
  source: String,
  sourceUrl: String,
  price: { type: Number, min: 0 },
  rating: { type: Number, min: 0, max: 5 },
  reviewCount: { type: Number, min: 0 },
  variantDescription: String,
  complaints: [String],
  observedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export const CompetitorObservation = mongoose.model('CompetitorObservation', competitorObservationSchema);
