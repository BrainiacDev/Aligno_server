import mongoose from "mongoose";

const roleChangeLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  oldRole: { type: String, required: true },
  newRole: { type: String, required: true },
  changedAt: { type: Date, default: Date.now },
});

const RoleChangeLog = mongoose.model("RoleChangeLog", roleChangeLogSchema);
export default RoleChangeLog;
