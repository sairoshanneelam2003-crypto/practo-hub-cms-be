/**
 * Topics Routes
 */

import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { checkPermission, checkAnyPermission } from '../../middlewares/checkPermission.js';
import {
  createTopicController,
  getTopicsController,
  getTopicByIdController,
  getMyAssignmentsController,
  updateTopicController,
  deleteTopicController,
  getTopicStatsController
} from './topics.controller.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get topic statistics (before /:id to avoid conflict)
router.get(
  '/stats',
  checkAnyPermission(['view_analytics', 'view_all_topics']),
  getTopicStatsController
);

// Get my assigned topics (for doctors)
router.get(
  '/my-assignments',
  checkPermission('view_assigned_topics'),
  getMyAssignmentsController
);

// Create a new topic
router.post(
  '/',
  checkPermission('create_topic'),
  createTopicController
);

// Get all topics
router.get(
  '/',
  checkAnyPermission(['view_all_topics', 'view_assigned_topics']),
  getTopicsController
);

// Get topic by ID
router.get(
  '/:id',
  checkAnyPermission(['view_all_topics', 'view_assigned_topics', 'view_content']),
  getTopicByIdController
);

// Update a topic
router.patch(
  '/:id',
  checkPermission('edit_topic'),
  updateTopicController
);

// Delete a topic
router.delete(
  '/:id',
  checkPermission('delete_topic'),
  deleteTopicController
);

export default router;

