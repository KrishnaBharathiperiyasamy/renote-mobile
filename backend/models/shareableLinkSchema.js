import mongoose from "mongoose";
const { Schema } = mongoose;

// Reply schema (same as comment, but without recursive replies)
const replySchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true },
  name: { type: String },
  likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
  createdAt: { type: Date, default: Date.now },
});

// Comment schema
const commentSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true },
  name: { type: String },
  likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
  replies: [replySchema], // ✅ use replySchema here
  createdAt: { type: Date, default: Date.now },
});

const likeSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
});

// Poster interaction schema
const posterInteractionSchema = new Schema({
  posterId: { type: Schema.Types.ObjectId, ref: "Poster", required: true },
  likes: [likeSchema],
  comments: [commentSchema],
});

// Main schema
const shareableLinkSchema = new Schema(
  {
    token: { type: String, required: true, unique: true },
    customSlug: { type: String, unique: true, sparse: true, trim: true, lowercase: true },
    name: { type: String, required: true },
    posterIds: [{ type: Schema.Types.ObjectId, ref: "Poster" }],
    expiresAt: { type: Date, default: () => Date.now() + 7 * 24 * 60 * 60 * 1000 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    interactions: [posterInteractionSchema],
    isPublishedToMarketplace: { type: Boolean, default: false },
    isRevoked: { type: Boolean, default: false },
    revokedAt: { type: Date },
  },
  { timestamps: true }
);

// shareableLinkSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const ShareableLink = mongoose.model("ShareableLink", shareableLinkSchema);
export default ShareableLink;
