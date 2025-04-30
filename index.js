import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import authRoutes from "./src/routes/authRoutes.js";
import taskRoutes from "./src/routes/taskRoutes.js";
import emailLogRoutes from "./src/routes/emailLogRoutes.js";
import cors from "cors";
import http from "http";
import connectDB from "./src/config/db.js";
import { scheduleTaskReminders } from "./src/cronjobs/reminder.js";
import { initializeSocket } from "./src/sockets/sockets.js"; // Import WebSocket setup
import errorHandler from "./src/utils/errorHandler.js";

dotenv.config();

const app = express();
const server = http.createServer(app); // Create an HTTP server
const io = initializeSocket(server); // Initialize WebSocket

// Middleware
app.use(express.json());
app.use(
  cors({
    credentials: true,
    origin: process.env.FRONTEND_URL,
  })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes(io));
app.use("/api/email-logs", emailLogRoutes(io)); // Pass io to email log routes

// Start cron job for reminders
scheduleTaskReminders(io);

// ✅ Error Handling Middleware (Must be placed after all routes)
app.use(errorHandler);

// Database Connection & Server Start
const PORT = process.env.PORT || 0;

connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server is running on port http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
    process.exit(1);
  });
