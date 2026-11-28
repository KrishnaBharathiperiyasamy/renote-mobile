import mongoose from 'mongoose';
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    authId: { type: String, required: true, unique: true },
    username: { type: String, trim: true, sparse: true },
    password: { type: String, select: false },
    role: { type: String, enum: ["USER", "SUPER_ADMIN"], default: "USER" },
    email: { type: String, trim: true, lowercase: true, default: "" },
    phoneNumber: { type: String, trim: true, default: "" },
    firstName: { type: String, trim: true, default: "" },
    lastName: { type: String, trim: true, default: "" },
    profilePic: { type: String, trim: true, default: "" },
    profileImage: { type: String, trim: true, default: "" },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Database-level uniqueness mechanism: Enforce exactly ONE SUPER_ADMIN in Renote_DB
userSchema.index(
  { role: 1 },
  {
    unique: true,
    partialFilterExpression: { role: "SUPER_ADMIN" },
  }
);

const User = mongoose.model("User", userSchema);
export default User
