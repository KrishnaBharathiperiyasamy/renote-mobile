import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
  logo: { type: String, required: false, default: "uploads/companies/default-company/logo-1779622107439-878996187.webp" },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: false},
  address: { type: String, required: false},
  city: { type: String, required: true },
  state: { type: String, required: false },
  zipCode: { type: String, required: false },
  gstNo: { type: String, required: false },
  panNo: { type: String, required: false, default: "" },
  panVerificationStatus: {
    type: String,
    enum: ["unverified", "pending", "verified", "failed"],
    default: "unverified",
  },
  panVerifiedAt: { type: Date, required: false, default: null },
  panVerificationRefId: { type: String, required: false, default: "" },
  panVerificationSource: { type: String, required: false, default: "" },
  panVerificationMeta: { type: mongoose.Schema.Types.Mixed, required: false, default: null },
  companyType: { type: String, required: true },
  description: { type: String, required: false },
  upiId: { type: String, required: false, default: '' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  invoices:{ type: [mongoose.Schema.Types.ObjectId], ref: 'Invoices', default: []},
  quotations: { type: [mongoose.Schema.Types.ObjectId], ref: 'Quotation', default: [] },
  isDeleted: { type: Boolean, default: false },
  // flag: Distinguishes between vendor and customer companies
  flag: { type: String, required: true, enum: ["vendor", "customer"] },
}, { timestamps: true });

const Company = mongoose.model('Company', companySchema);
export default Company;

