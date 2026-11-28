import mongoose from 'mongoose';
const { Schema } = mongoose;

const invoiceSchema = new Schema(
  {
    invoiceID: { type: String, required: true }, // like estimateID
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    products: [
      {
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        gst: { type: Number, required: false },
        unit: { type: String, required: false },
        hsn: { type: String, required: false },
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
        gstNo: { type: String, required: false }
      }
    ]
  },
  { timestamps: true }
);

const Invoice = mongoose.model('Invoice', invoiceSchema);
export default Invoice;
