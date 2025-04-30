import cron from "node-cron";
import EmailLog from "../models/emailLogModel.js";
import { sendEmail } from "../utils/emailUtils.js"; // Use generic function

/**
 * Cron job to retry sending failed emails every 10 minutes.
 */
cron.schedule("*/10 * * * *", async () => {
  console.log("🔄 Checking for failed emails to retry...");

  try {
    const failedEmails = await EmailLog.find({
      status: "failed",
      retryCount: { $lt: 3 }, // Retry emails less than 3 times
    });

    for (const emailLog of failedEmails) {
      console.log(
        `⏳ Retrying email to ${emailLog.recipient} (Attempt ${
          emailLog.retryCount + 1
        })`
      );

      const result = await sendEmail(
        emailLog.recipient, // Email address
        emailLog.subject, // Subject
        emailLog.content, // Email body
        emailLog.retryCount // Retry count
      );

      if (result.success) {
        // Update log if the email is successfully sent
        await EmailLog.findByIdAndUpdate(emailLog._id, { status: "sent" });
        console.log(`✅ Email successfully resent to ${emailLog.recipient}`);
      } else {
        // Increase retry count if it fails again
        await EmailLog.findByIdAndUpdate(emailLog._id, {
          retryCount: emailLog.retryCount + 1,
        });

        if (emailLog.retryCount + 1 >= 3) {
          console.warn(
            `⚠️ Max retry attempts reached for ${emailLog.recipient}. Manual intervention required.`
          );
        }
      }
    }
  } catch (error) {
    console.error("❌ Error retrying failed emails:", error);
  }
});

console.log("✅ Failed email retry cron job scheduled.");
