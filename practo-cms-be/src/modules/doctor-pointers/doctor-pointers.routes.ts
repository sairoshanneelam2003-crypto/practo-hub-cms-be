/**
 * Doctor Pointers Routes
 */

import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { checkPermission, checkAnyPermission } from '../../middlewares/checkPermission.js';
import {
  getUploadUrlController,
  createPointerController,
  getPointersByTopicController,
  getPointerController,
  deletePointerController
} from './doctor-pointers.controller.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get presigned upload URL
router.post(
  '/upload-url',
  checkPermission('upload_pointers'),
  getUploadUrlController
);

// Create a pointer
router.post(
  '/',
  checkPermission('upload_pointers'),
  createPointerController
);

// Get pointers for a topic
router.get(
  '/topic/:topicId',
  checkAnyPermission(['view_doctor_notes', 'view_assigned_topics']),
  getPointersByTopicController
);

// Get specific pointer
router.get(
  '/:id',
  checkAnyPermission(['view_doctor_notes', 'view_assigned_topics']),
  getPointerController
);

// Delete a pointer
router.delete(
  '/:id',
  checkPermission('upload_pointers'),
  deletePointerController
);

export default router;

