import express from "express";
import {
  getEmailLogs,
  retryFailedEmail,
} from "../controllers/emailLogController.js";
import { authenticateUser } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

export default (io) => {
  router.get("/", authenticateUser, authorizeRoles("admin"), getEmailLogs);
  router.post(
    "/retry/:id",
    authenticateUser,
    authorizeRoles("admin"),
    (req, res) => retryFailedEmail(req, res, io) // Pass io to controller
  );

  return router;
};
