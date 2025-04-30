import cron from "node-cron";
import Task from "../models/taskModel.js";
import ReminderLog from "../models/reminderLogModel.js"; // Import new model
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const REMINDER_INTERVALS = [24, 12, 6];

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export function scheduleTaskReminders(io) {
  cron.schedule("0 * * * *", async () => {
    console.log("🔍 Checking for upcoming task deadlines...");

    const now = new Date();

    try {
      const tasks = await Task.find({ dueDate: { $gte: now } }).populate(
        "assignedTo",
        "name email"
      );

      for (const task of tasks) {
        const taskDueDate = new Date(task.dueDate);
        const timeDiffInHours = (taskDueDate - now) / (1000 * 60 * 60);

        const reminderInterval = REMINDER_INTERVALS.find(
          (interval) =>
            timeDiffInHours <= interval &&
            (!task.lastReminder || task.lastReminder > timeDiffInHours)
        );

        if (reminderInterval && task.assignedTo) {
          const userId = task.assignedTo._id.toString();
          const userEmail = task.assignedTo.email;

          // 🔹 Check if a reminder was already logged for this task & interval
          const existingLog = await ReminderLog.findOne({
            userId,
            taskId: task._id,
            sentAt: { $gte: new Date(now - reminderInterval * 60 * 60 * 1000) }, // Prevent duplicate reminders
          });

          if (!existingLog) {
            // 🔹 WebSocket Notification
            const message = `⏳ Reminder: Task "${
              task.title
            }" is due in ${Math.ceil(timeDiffInHours)} hours!`;
            io.to(userId).emit("taskReminder", {
              message,
              dueDate: task.dueDate,
            });

            console.log(
              `✅ WebSocket reminder sent to ${userId} for task "${task.title}"`
            );

            await logReminder(userId, task._id, "websocket", message);

            // 🔹 Email Notification
            await sendEmailReminder(userEmail, task.title, taskDueDate);
            await logReminder(
              userId,
              task._id,
              "email",
              `Email reminder sent for "${task.title}"`
            );

            task.lastReminder = timeDiffInHours;
            await task.save();
          }
        }
      }
    } catch (error) {
      console.error("❌ Error checking task deadlines:", error);
    }
  });

  console.log("✅ Task reminder cron job scheduled.");
}

// Function to Log Reminders
async function logReminder(userId, taskId, type, message) {
  try {
    await ReminderLog.create({ userId, taskId, type, message });
    console.log(`📜 Reminder log saved for ${type}: ${message}`);
  } catch (error) {
    console.error("❌ Error logging reminder:", error);
  }
}

// Function to Send Email
async function sendEmailReminder(email, taskTitle, dueDate) {
  if (!email) return;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Task Reminder: "${taskTitle}"`,
    text: `Hello,\n\nThis is a reminder that your task "${taskTitle}" is due on ${dueDate}.\n\nBest regards,\nTask Manager`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Email reminder sent to ${email} for task "${taskTitle}"`);
  } catch (error) {
    console.error("❌ Error sending email:", error);
  }
}
