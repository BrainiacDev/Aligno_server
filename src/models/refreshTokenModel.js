import mongoose from "mongoose";

const RefreshTokenSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now, expires: "7d" }, // Auto-delete after 7 days
});
const RefreshToken = mongoose.model("RefreshToken", RefreshTokenSchema);

export default RefreshToken