import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/userModel.js";

dotenv.config();

export const authenticateUser = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.split(" ")[1]; // Get token from Authorization header

    if (!token) {
      return res
        .status(401)
        .json({ message: "Access denied. No token provided." });
    }

    const decoded = jwt.verify(token, process.env.SECRETE_KEY_ACCESS_TOKEN); // Verify token
    req.user = await User.findById(decoded.id).select("-password"); // Attach user to request

    if (!req.user) {
      return res.status(401).json({ message: "User not found. Unauthorized." });
    }

    next(); // Proceed to next middleware
  } catch (error) {
    return res
      .status(401)
      .json({ message: "Invalid token. Authentication failed." });
  }
};
