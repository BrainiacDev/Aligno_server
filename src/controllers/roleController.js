import User from "../models/userModel.js";
import RoleChangeLog from "../models/roleChangeLogModel.js";
import { sendEmail } from "../utils/emailUtil.js";

/**
 * Update user role (Admin Only) + Send Email Notification
 */
export const updateUserRole = async (req, res) => {
  try {
    const { userId, newRole } = req.body;
    const adminId = req.user._id;

    if (!userId || !newRole) {
      return res.status(400).json({ message: "User ID and new role required" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const oldRole = user.role;
    user.role = newRole;
    await user.save();

    await RoleChangeLog.create({
      userId,
      changedBy: adminId,
      oldRole,
      newRole,
    });

    // Send email using utility function
    await sendEmail(
      user.email,
      "Your Role Has Been Updated",
      `Hello ${user.name},\n\nYour account role has been updated to: ${newRole}.\n\nIf this was not expected, please contact support.`
    );

    res.json({ message: "User role updated", user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

/**
 * Get all users with roles (Admin Only)
 */
export const getAllUsersWithRoles = async (req, res) => {
  try {
    const users = await User.find().select("name email role");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

/**
 * Get all role change logs (Admin Only)
 */
export const getRoleChangeLogs = async (req, res) => {
  try {
    const logs = await RoleChangeLog.find()
      .populate("userId", "name email")
      .populate("changedBy", "name email")
      .sort({ changedAt: -1 });

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
