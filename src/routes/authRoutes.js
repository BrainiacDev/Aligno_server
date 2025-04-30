import express from "express";
import {
  registerUserController,
  loginUserController,
  logoutUserController,
  refreshTokenController,
  forgotPasswordController,
  resetCodeAndPasswordController,
} from "../controllers/authController.js";

const router = express.Router();

// Register/Login a new user (User/Admin)
router.post("/register", registerUserController);
router.post("/login", loginUserController);
router.post("/logout", logoutUserController);
router.get("/refresh-token", refreshTokenController);
router.post("/forgot-password", forgotPasswordController);
router.post("/reset-password", resetCodeAndPasswordController);

export default router;
