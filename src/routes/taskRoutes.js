import { Router } from "express";
import taskControllers from "../controllers/taskController.js";
import upload from "../middleware/uploadMiddleware.js";
import { authenticateUser } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

export default function taskRoutes(io) {
  const router = Router();
  const {
    createTaskController,
    getAllTaskController,
    getSingleTaskController,
    updateTaskByIdController,
    deleteTaskController,
    assignTaskToUserController,
    addCommentController,
    getNotificationForUserController,
    uploadTaskAttachmentController,
    deleteTaskAttachmentController,
  } = taskControllers(io); // Pass `io` to controllers

  // Task CRUD routes
  router.post(
    "/create-task",
    authenticateUser,
    authorizeRoles("admin"),
    createTaskController
  );
  router.get("/getAll-task", getAllTaskController);
  router.get("/getSingle-task/:id", getSingleTaskController);
  router.put("/update-task/:id", updateTaskByIdController);
  router.delete("/delete-task/:id", deleteTaskController);

  // Task assignment
  router.post("/assign-task/:id/assign", assignTaskToUserController);

  // Comments
  router.post("/add-comment/:id/comment", addCommentController);

  // Notifications
  router.get(
    "/notifications",
    authenticateUser,
    getNotificationForUserController
  );

  // File Upload & Deletion
  router.post(
    "/upload-task-file/:id",
    upload.single("file"),
    uploadTaskAttachmentController
  );
  router.delete(
    "/delete-task-file/:taskId/:fileId",
    deleteTaskAttachmentController
  );

  return router;
}
