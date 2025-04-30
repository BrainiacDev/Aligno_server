import EmailLog from "../models/emailLogModel.js";
import { sendEmail } from "../utils/emailUtil.js";
import { sendEmailStatusUpdate } from "../sockets/sockets.js"; // Import WebSocket function

/**
 * Get all email logs
 */
export const getEmailLogs = async (req, res) => {
  try {
    const logs = await EmailLog.find().sort({ sentAt: -1 }); // Latest first
    res.json(logs);
  } catch (error) {
    console.error("Error fetching email logs:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

/**
 * Retry sending a failed email
 */
export const retryFailedEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const log = await EmailLog.findById(id);

    if (!log) return res.status(404).json({ message: "Email log not found" });
    if (log.status === "sent")
      return res
        .status(400)
        .json({ message: "Email already sent successfully" });

    // Retry sending email
    const emailSent = await sendEmail(log.recipient, log.subject, log.content);

    if (emailSent.success) {
      log.status = "sent";
      log.errorMessage = null;
    } else {
      log.attempts += 1;
      log.errorMessage = emailSent.error;
    }

    await log.save();

    // Send WebSocket update
    sendEmailStatusUpdate(log.recipient, {
      email: log.recipient,
      status: emailSent.success ? "sent" : "failed",
      errorMessage: emailSent.success ? null : emailSent.error,
    });

    res.json({
      message: `Email ${emailSent.success ? "resent" : "failed to resend"}`,
      log,
    });
  } catch (error) {
    console.error("Error retrying email:", error);
    res.status(500).json({ message: "Server error", error });
  }
};
