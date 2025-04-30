import nodemailer from "nodemailer";
import dotenv from "dotenv";
import EmailLog from "../models/emailLogModel.js";
import { initializeSocket } from "../sockets/sockets.js"; // Import WebSocket

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const MAX_RETRY_ATTEMPTS = 3; // Limit retries to prevent infinite loops

/**
 * Generic function to send an email and log the result
 */
export const sendEmail = async (to, subject, text, retryCount = 0) => {
  if (!to) {
    console.error("❌ Recipient email is required.");
    return { success: false, error: "Recipient email is required" };
  }

  const mailOptions = { from: process.env.EMAIL_USER, to, subject, text };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent to ${to}: ${subject}`);

    const log = await EmailLog.create({
      recipient: to,
      subject,
      content: text,
      status: "sent",
      retryCount,
    });

    initializeSocket().emit("emailStatusUpdate", log); // 🔥 Notify clients

    return { success: true };
  } catch (error) {
    console.error("❌ Error sending email:", error.message);

    const log = await EmailLog.create({
      recipient: to,
      subject,
      content: text,
      status: "failed",
      errorMessage: error.message,
      retryCount: retryCount + 1,
    });

    initializeSocket().emit("emailStatusUpdate", log); // 🔥 Notify clients

    return { success: false, error: error.message };
  }
};

/**
 * Send role change email using the generic sendEmail function
 */
export const sendRoleChangeEmail = async (
  email,
  name,
  newRole,
  retryCount = 0
) => {
  const subject = "Your Role Has Been Updated";
  const message = `Hello ${name},\n\nYour account role has been updated to: ${newRole}.\n\nIf you did not request this change, please contact support.\n\nBest regards,\nTask Manager Team`;

  return sendEmail(email, subject, message, retryCount);
};
