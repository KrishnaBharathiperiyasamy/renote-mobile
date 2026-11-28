import mongoose from "mongoose";
const { Schema } = mongoose;

const notificationSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true }, // receiver
        fromUser: { type: Schema.Types.ObjectId, ref: "User" }, // who triggered action
        fromName: { type: String },
        posterId: { type: Schema.Types.ObjectId, ref: "Poster" },
        token: { type: String }, // shared link token
        type: {
            type: String,
            enum: ["like", "comment", "reply", "comment-like", "system"],
            required: true,
        },
        message: { type: String, required: true },
        link: { type: String }, // optional link for redirecting user
        identifier: { type: String }, // unique key to prevent duplicates
        isRead: { type: Boolean, default: false },
    },
    { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
