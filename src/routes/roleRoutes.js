import express from "express";
import { authenticateUser } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import {
  updateUserRole,
  getAllUsersWithRoles,
} from "../controllers/roleController.js";
import sendRoleChangeEmail from "../utils/emailUtil.js";

const router = express.Router();

/**
 * @route PUT /api/roles/update-role
 * @desc Update user role (Admin Only) & send email notification
 * @access Private (Admin)
 */
router.put(
  "/update-role",
  authenticateUser,
  authorizeRoles("admin"),
  async (req, res, next) => {
    try {
      const { userId, newRole } = req.body;
      const result = await updateUserRole(req, res);

      if (result.success) {
        // Send email notification
        await sendRoleChangeEmail(result.user.email, result.user.name, newRole);
      }

      res.json({
        message: "User role updated successfully",
        user: result.user,
      });
    } catch (error) {
      console.error("❌ Error updating user role:", error);
      next(error);
    }
  }
);

/**
 * @route GET /api/roles/users
 * @desc Get all users with roles (Admin Only)
 * @access Private (Admin)
 */
router.get(
  "/users",
  authenticateUser,
  authorizeRoles("admin"),
  async (req, res, next) => {
    try {
      await getAllUsersWithRoles(req, res);
    } catch (error) {
      console.error("❌ Error fetching users:", error);
      next(error);
    }
  }
);

export default router;
