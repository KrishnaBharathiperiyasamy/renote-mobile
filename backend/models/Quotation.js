import mongoose from 'mongoose';
const { Schema } = mongoose;

const quotationSchema = new Schema(
  {
    estimateID: { type: String, required: true },
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    products: [
      {
        productId: { type: Schema.Types.ObjectId, ref: 'Product' },
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        gst: { type: Number, required: false, default: 0 },
        unit: { type: String, required: false, default: 'Pcs' },
        hsn: { type: String, required: false, default: '' },
      }
    ],
    company_id: [{ type: Schema.Types.ObjectId, ref: 'Company', required: true }],
    isHeart: { type: Boolean, default: false },
    customers: [
      {
        name: { type: String, required: true },
        phoneNumber: { type: String, required: true },
        email: { type: String, required: false },
        address: { type: String, required: false },
        city: { type: String, required: false },
        gstNo: { type: String, required: false }
      }
    ]
  },
  { timestamps: true }
);

const Quotation = mongoose.model('Quotation', quotationSchema);
export default Quotation;
