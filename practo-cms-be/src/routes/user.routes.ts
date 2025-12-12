/**
 * User Routes
 */

import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { checkPermission, checkAnyPermission } from "../middlewares/checkPermission.js";
import { 
  createUserController, 
  getAllUsersController,
  getDoctorsController,
  getCurrentUserController,
  getUserByIdController,
  toggleUserStatusController,
  updateUserStatusController,
  updateUserRoleController,
  forceWorkflowController,
  unlockContentController
} from "../controllers/user.controller.js";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get current user (no permission needed)
router.get("/me", getCurrentUserController);

// Get doctors list (for topic assignment)
router.get(
  "/doctors",
  checkAnyPermission(['create_topic', 'assign_topic']),
  getDoctorsController
);

// User management routes (Super Admin)
router.post(
  "/",
  checkPermission("create_user"),
  createUserController
);

// Alias for backward compatibility
router.post(
  "/create",
  checkPermission("create_user"),
  createUserController
);

router.get(
  "/",
  checkPermission("view_analytics"),
  getAllUsersController
);

router.get(
  "/:id",
  checkPermission("view_analytics"),
  getUserByIdController
);

router.post(
  "/toggle-status",
  checkPermission("deactivate_user"),
  toggleUserStatusController
);

router.post(
  "/update-status",
  checkPermission("deactivate_user"),
  updateUserStatusController
);

router.post(
  "/update-role",
  checkPermission("assign_role"),
  updateUserRoleController
);

// Super Admin override actions
router.post(
  "/force-move-workflow",
  checkPermission("force_move_workflow"),
  forceWorkflowController
);

router.post(
  "/unlock-content",
  checkPermission("unlock_content"),
  unlockContentController
);

export default router;
