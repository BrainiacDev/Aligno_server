import mongoose from "mongoose";

const emailLogSchema = new mongoose.Schema(
  {
    recipient: { type: String, required: true },
    subject: { type: String, required: true },
    content: { type: String, required: true },
    status: { type: String, enum: ["sent", "failed"], default: "sent" },
    errorMessage: { type: String, default: null },
    attempts: { type: Number, default: 1 },
    sentAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const EmailLog = mongoose.model("EmailLog", emailLogSchema);
export default EmailLog;
