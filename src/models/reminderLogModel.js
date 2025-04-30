import mongoose from "mongoose";

const reminderLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
  type: { type: String, enum: ["email", "websocket"], required: true },
  message: { type: String, required: true },
  sentAt: { type: Date, default: Date.now },
});

const ReminderLog = mongoose.model("ReminderLog", reminderLogSchema);

export default ReminderLog;