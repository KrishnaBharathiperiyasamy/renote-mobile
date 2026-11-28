import mongoose from "mongoose";
const { Schema } = mongoose;

const posterFeedbackSchema = new Schema(
  {
    poster_id: { type: Schema.Types.ObjectId, ref: "Poster", required: true, index: true },
    user_key: { type: String, required: true, index: true },
    reaction: { type: String, enum: ["like", "dislike", "none"], default: "none" },
    rating: { type: Number, min: 1, max: 5, default: null },
  },
  { timestamps: true }
);

posterFeedbackSchema.index({ poster_id: 1, user_key: 1 }, { unique: true });

const PosterFeedback = mongoose.model("PosterFeedback", posterFeedbackSchema);
export default PosterFeedback;
