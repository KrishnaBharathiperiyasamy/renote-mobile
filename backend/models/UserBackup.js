import mongoose from 'mongoose';

const userBackupSchema = new mongoose.Schema({
  ownerName: { type: String, default: 'Unknown' },
  ownerEmail: { type: String, default: '' },
  authUser: { type: Object, default: null },   // Full auth-service (PostgreSQL) user record
  user: { type: Object, required: true },
  quotations: [Object],
  invoices: [Object],
  companies: [Object],
  posters: [Object],
  products: [Object],
  // Stored for lightweight listing without loading full arrays
  companiesCount: { type: Number, default: 0 },
  quotationsCount: { type: Number, default: 0 },
  invoicesCount: { type: Number, default: 0 },
  postersCount: { type: Number, default: 0 },
  productsCount: { type: Number, default: 0 },
}, { timestamps: true });

// Auto-delete after 6 months (180 days)
userBackupSchema.index({ createdAt: 1 }, { expireAfterSeconds: 180 * 24 * 60 * 60 });

export default mongoose.model('UserBackup', userBackupSchema);
