import mongoose from "mongoose";
const { Schema } = mongoose;

const posterSchema = new Schema(
  {
    posterId: { type: String, required: true },
    poster_name: { type: String, default: "" },
    poster_title: { type: String, default: "" },
    product_name: { type: String, default: "" },
    product_description: { type: String },
    product_price: { type: Number },
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    company_id: { type: Schema.Types.ObjectId, ref: "Company", required: false, default: null },
    product_image: { type: String },
    product_gallery_images: { type: [String], default: [] },
    product_gallery_zoom: { type: [Number], default: [] },
    product_gallery_positions: {
      type: [
        {
          x: { type: Number, default: 0 },
          y: { type: Number, default: 0 },
        },
      ],
      default: [],
    },
    company_logo: { type: String, required: false, default: "uploads/companies/default-company/logo-1779622107439-878996187.webp" },
    isHeart: { type: Boolean, default: false },
    logo_zoom: { type: Number, default: 1 },
    product_zoom: { type: Number, default: 1 },
    logo_position: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
    },
    product_position: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
    },
    template: {
      type: String,
      default: "frame1",
    },
    templateCategory: { type: String, default: "Classic" },
    colorThemeId: { type: String, default: "flame-orange" },
    bgTypeId: { type: String, default: "clean-white" },
    customBgColor: { type: String, default: null },
    backgroundImage: { type: String, default: null },
    fontFamilyId: { type: String, default: "serif" },
    fontColor: { type: String, default: null },
    titleSize: { type: String, default: "lg" },
    isUppercase: { type: Boolean, default: true },
    textAlign: { type: String, default: "center" },
    borderThickness: { type: Number, default: 4 },
    showPriceTag: { type: Boolean, default: true },
    imageZoom: { type: Number, default: 1 },
    imagePosition: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
    },
    neonEffect: { type: Boolean, default: false },
    theme: {
      type: String,
      default: "orangePink",
    },
    aspect_ratio: {
      type: String,
      default: "3:4",
    },
    custom_colors: { type: String, default: null },
    customSecondaryColor: { type: String, default: null },
    tags: { type: [String], default: [] },
    fileSizeBytes: { type: Number, default: 0 },
    isVideo: { type: Boolean, default: false },
    // Marketplace Fields
    shareableLinkToken: { type: String, default: null, index: true },
    shareableLinkId: { type: mongoose.Schema.Types.ObjectId, ref: "ShareableLink", default: null },
    isPublishedToMarketplace: { type: Boolean, default: false, index: true },
    publishedAt: { type: Date, default: null },
    publishedContentHash: { type: String, default: null },
    publishedVersion: { type: Number, default: 0 },
    marketplaceCategory: { type: String, default: "Amazon" },
    marketplaceSubcategory: { type: String, default: "Electronics & Accessories" },
    marketplaceCity: { type: String, default: "" },
    contactPhone: { type: String, default: "" },
    whatsappNumber: { type: String, default: "" },
    viewsCount: { type: Number, default: 0 },
    likesCount: { type: Number, default: 0 },
    dislikesCount: { type: Number, default: 0 },
    ratingSum: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    marketplacePrice: { type: Number, default: null },
    isSold: { type: Boolean, default: false, index: true },
    soldAt: { type: Date, default: null },
    stickers: {
      type: [
        {
          id: { type: String, required: true },
          stickerId: { type: String, required: true },
          x: { type: Number, required: true },
          y: { type: Number, required: true },
          width: { type: Number, default: 105 },
          rotation: { type: Number, default: 0 },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
); // ✅ This adds createdAt & updatedAt automatically

const Poster = mongoose.model("Poster", posterSchema);
export default Poster;
