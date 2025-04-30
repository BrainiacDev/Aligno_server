import User from "../models/userModel.js";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import crypto from "crypto";
import generateTokens from "../utils/generateTokens.js";
import RefreshToken from "../models/refreshTokenModel.js";

// Register user
export async function registerUserController(req, res) {
  try {
    const { name, email, password, role, adminSecret } = req.body;

    console.log("Received adminSecret:", adminSecret);
    console.log("Stored ADMIN_SECRET:", process.env.ADMIN_SECRET);

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Provide registration details" });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Ensure only those with the admin secret can register as admin
    let userRole = "user"; // Default role is "user"
    if (role === "admin" && adminSecret === process.env.ADMIN_SECRET) {
      userRole = "admin";
    } else if (role === "admin") {
      return res.status(403).json({ message: "Invalid admin secret key" });
    }

    // Hash the password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: userRole,
    });

    await newUser.save();

    res.status(201).json({
      message: "User registered successfully",
      role: userRole,
    });
  } catch (error) {
    next(error);
  }
}

// Login user
export async function loginUserController(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        message: "Provide email and password",
        error: true,
        success: false,
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message: "User not registered",
        error: true,
        success: false,
      });
    }

    const checkPassword = await bcryptjs.compare(password, user.password);
    if (!checkPassword) {
      return res.status(400).json({
        message: "Invalid Password",
        error: true,
        success: false,
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Save refresh token in the database
    user.refreshToken = refreshToken;
    await user.save();

    const cookiesOption = {
      httpOnly: true,
      secure: true,
      sameSite: "None",
    };

    res.cookie("accessToken", accessToken, cookiesOption);
    res.cookie("refreshToken", refreshToken, cookiesOption);

    res.status(200).json({
      message: "Login successful",
      error: false,
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role, // Include the role in the response
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

// Logout User
export async function logoutUserController(req, res, next) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: "No refresh token provided" });
    }

    // Delete refresh token from DB
    await RefreshToken.findOneAndDelete({ token: refreshToken });

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
}

// Refresh token
export async function refreshTokenController(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({
        message: "Refresh token required",
        error: true,
        success: false,
      });
    }

    // Check if refresh token exists in DB
    const storedToken = await RefreshToken.findOne({ token: refreshToken });
    if (!storedToken) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const decode = jwt.verify(
      refreshToken,
      process.env.SECRETE_KEY_REFRESH_TOKEN
    );
    if (!decode.id) {
      return res.status(403).json({ error: "Invalid token structure" });
    }

    const user = await User.findById(decode.id);
    console.log("User found:", user);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({
        message: "Invalid refresh token",
        error: true,
        success: false,
      });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(
      user._id
    );

    console.log("Old Refresh Token:", user.refreshToken);

    // Update token in DB using findByIdAndUpdate
    await User.findByIdAndUpdate(
      user._id,
      { refreshToken: newRefreshToken },
      { new: true }
    );

    const updatedUser = await User.findById(user._id);
    console.log("Updated Refresh Token in DB:", updatedUser.refreshToken);

    res.status(200).json({
      message: "Refresh token generated successfully",
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    next(error);
  }
}

// Forgot Password
export async function forgotPasswordController(req, res, next) {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const resetCode = crypto.randomInt(100000, 999999).toString();
    user.resetCode = resetCode;
    user.resetCodeExpiry = Date.now() + 15 * 60 * 1000;
    await user.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL, pass: process.env.EMAIL_PASSWORD },
    });

    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Password Reset Code",
      text: `Your password reset code is: ${resetCode}`,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: "Reset code sent to email" });
  } catch (error) {
    next(error); // 🔥 Pass error to errorHandler
  }
}

// Verify Reset Code and Reset Password
export async function resetCodeAndPasswordController(req, res, next) {
  try {
    const { email, resetCode, newPassword } = req.body;
    const user = await User.findOne({
      email,
      resetCode,
      resetCodeExpiry: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({ message: "Invalid or expired reset code" });

    user.password = await bcryptjs.hash(newPassword, 10);
    user.resetCode = undefined;
    user.resetCodeExpiry = undefined;
    await user.save();

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    next(error); // 🔥 Pass error to errorHandler
  }
}
