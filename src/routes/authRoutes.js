import express from "express";
import {
  registerUserController,
  loginUserController,
  logoutUserController,
  refreshTokenController,
  forgotPasswordController,
  resetCodeAndPasswordController,
  getUserDetailsController,
} from "../controllers/authController.js";
import verifyToken from "../utils/verifyToken.js";

const router = express.Router();

// Register/Login a new user (User/Admin)
router.post("/register", registerUserController);
router.post("/login", loginUserController);
router.get("/user-details", verifyToken, getUserDetailsController)
router.post("/logout", logoutUserController);
router.get("/refresh-token", refreshTokenController);
router.post("/forgot-password", forgotPasswordController);
router.post("/reset-password", resetCodeAndPasswordController);

export default router;
