import mongoose from 'mongoose';

const supplierObservationSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'ResearchProduct', index: true },
  supplierName: { type: String, required: true },
  productName: { type: String, required: true },
  sourceUrl: String,
  contactReference: String,
  quotedPrice: { type: Number, min: 0 },
  minimumOrderQuantity: { type: Number, min: 0 },
  packSize: String,
  shippingInformation: String,
  observedAt: { type: Date, default: Date.now },
  verificationStatus: { type: String, enum: ['unverified', 'manually_verified'], default: 'unverified' }
}, { timestamps: true });

export const SupplierObservation = mongoose.model('SupplierObservation', supplierObservationSchema);
