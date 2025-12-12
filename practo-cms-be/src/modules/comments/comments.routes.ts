/**
 * Comments Routes
 */

import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { checkAnyPermission } from '../../middlewares/checkPermission.js';
import {
  createCommentController,
  getScriptCommentsController,
  getVideoCommentsController,
  updateCommentController,
  deleteCommentController
} from './comments.controller.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create a comment
router.post(
  '/',
  checkAnyPermission(['comment_script', 'comment_video', 'comment']),
  createCommentController
);

// Get comments for a script
router.get(
  '/script/:scriptId',
  checkAnyPermission(['view_content', 'review_script']),
  getScriptCommentsController
);

// Get comments for a video
router.get(
  '/video/:videoId',
  checkAnyPermission(['view_content', 'review_video']),
  getVideoCommentsController
);

// Update a comment
router.patch(
  '/:id',
  checkAnyPermission(['comment_script', 'comment_video', 'comment']),
  updateCommentController
);

// Delete a comment
router.delete(
  '/:id',
  checkAnyPermission(['comment_script', 'comment_video', 'comment']),
  deleteCommentController
);

export default router;

