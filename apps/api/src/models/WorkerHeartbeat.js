import mongoose from 'mongoose';

const workerHeartbeatSchema = new mongoose.Schema({
  workerId: { type: String, required: true, unique: true },
  model: { type: String, required: true },
  status: { type: String, enum: ['idle', 'processing', 'offline'], default: 'idle' },
  currentJob: { type: String },
  lastSuccessAt: { type: Date },
  lastError: { type: String }
}, { timestamps: true });

export const WorkerHeartbeat = mongoose.model('WorkerHeartbeat', workerHeartbeatSchema);
