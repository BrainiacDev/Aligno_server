import Task from "../models/taskModel.js";
import Notification from "../models/notificationModel.js";

export default function taskControllers(io) {
  return {
    createTaskController: async (req, res) => {
      try {
        const newTask = await Task.create(req.body);
        io.emit("taskCreated", newTask); // Notify all clients
        res.status(201).json(newTask);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error });
      }
    },

    getAllTaskController: async (req, res) => {
      try {
        const tasks = await Task.find();
        res.json(tasks);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error });
      }
    },

    getSingleTaskController: async (req, res) => {
      try {
        const task = await Task.findById(req.params.id);
        if (!task) {
          return res.status(404).json({ message: "Task not found" });
        }
        res.json(task);
      } catch (error) {
        res.status(500).json({ message: "Server error", error });
      }
    },

    updateTaskByIdController: async (req, res) => {
      try {
        const updatedTask = await Task.findByIdAndUpdate(
          req.params.id,
          req.body,
          { new: true }
        );
        if (!updatedTask) {
          return res.status(404).json({ message: "Task not found" });
        }
        io.emit("taskUpdated", updatedTask); // Notify all clients
        res.json(updatedTask);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error });
      }
    },

    deleteTaskController: async (req, res) => {
      try {
        const deletedTask = await Task.findByIdAndDelete(req.params.id);
        if (!deletedTask) {
          return res.status(404).json({ message: "Task not found" });
        }
        io.emit("taskDeleted", req.params.id); // Notify all clients
        res.json({ message: "Task deleted", deletedTask });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error });
      }
    },

    assignTaskToUserController: async (req, res) => {
      try {
        const task = await Task.findById(req.params.id);
        if (!task) {
          return res.status(404).json({ message: "Task not found" });
        }
        task.assignedTo = req.body.userId;
        await task.save();

        io.to(req.body.userId).emit("taskAssigned", task); // Notify assigned user
        res.json(task);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error });
      }
    },

    addCommentController: async (req, res) => {
      try {
        const task = await Task.findById(req.params.id);
        if (!task) {
          return res.status(404).json({ message: "Task not found" });
        }

        const newComment = {
          user: req.body.userId,
          text: req.body.text,
          createdAt: new Date(),
        };
        task.comments.push(newComment);
        await task.save();

        io.emit("newComment", { taskId: task._id, comment: newComment }); // Notify all clients
        res.json(task);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error });
      }
    },

    getNotificationForUserController: async (req, res) => {
      try {
        const notifications = await Notification.find({ userId: req.user.id });
        res.json(notifications);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error });
      }
    },

    uploadTaskAttachmentController: async (req, res) => {
      try {
        const task = await Task.findById(req.params.id);
        if (!task) {
          return res.status(404).json({ message: "Task not found" });
        }

        if (!req.file) {
          return res.status(400).json({ message: "No file uploaded" });
        }

        task.attachments.push({
          fileUrl: req.file.path,
          uploadedAt: new Date(),
        });
        await task.save();

        io.emit("taskFileUploaded", {
          taskId: task._id,
          fileUrl: req.file.path,
        });
        res.json(task);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error });
      }
    },

    deleteTaskAttachmentController: async (req, res) => {
      try {
        const task = await Task.findById(req.params.taskId);
        if (!task) {
          return res.status(404).json({ message: "Task not found" });
        }

        task.attachments = task.attachments.filter(
          (file) => file._id.toString() !== req.params.fileId
        );
        await task.save();

        io.emit("taskFileDeleted", {
          taskId: task._id,
          fileId: req.params.fileId,
        });
        res.json(task);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error });
      }
    },
  };
}
