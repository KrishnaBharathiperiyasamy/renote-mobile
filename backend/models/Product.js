import mongoose from "mongoose";
const { Schema } = mongoose;

const productSchema = new Schema(
  {
    company_id: { type: Schema.Types.ObjectId, ref: "Company", required: true, },
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true, },
    name: { type: String, required: true, trim: true, },
    price: { type: Number, required: true},
    qty: { type: Number, required: true },
    unit: { type: String, default: "", },
    gst: { type: Number, default: 0, },
    hsn: { type: String, default: "" },
    isHeart: { type: Boolean, default: false },
    description: { type: String, default: "", trim: true },
    dealers: { type: String, default: "" },
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);
export default Product;
