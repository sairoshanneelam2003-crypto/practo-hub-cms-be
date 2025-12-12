/**
 * Scripts Routes
 */

import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { checkPermission, checkAnyPermission } from '../../middlewares/checkPermission.js';
import {
  createScriptController,
  getScriptController,
  getScriptsByTopicController,
  getScriptsController,
  updateScriptController,
  submitScriptController,
  approveScriptController,
  rejectScriptController,
  lockScriptController,
  unlockScriptController,
  getScriptQueueController,
  getScriptReviewsController,
  claimScriptController,
  releaseScriptController
} from './scripts.controller.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get review queue (role-based)
router.get(
  '/queue',
  checkAnyPermission(['review_script', 'approve_script']),
  getScriptQueueController
);

// Get scripts for a topic
router.get(
  '/topic/:topicId',
  checkAnyPermission(['view_content', 'view_script_versions']),
  getScriptsByTopicController
);

// Create a new script
router.post(
  '/',
  checkPermission('upload_script'),
  createScriptController
);

// Get all scripts with filters
router.get(
  '/',
  checkAnyPermission(['view_content', 'review_script']),
  getScriptsController
);

// Get script by ID
router.get(
  '/:id',
  checkAnyPermission(['view_content', 'review_script']),
  getScriptController
);

// Get script review history
router.get(
  '/:id/reviews',
  checkAnyPermission(['view_content', 'view_script_versions']),
  getScriptReviewsController
);

// Update a script (only DRAFT)
router.patch(
  '/:id',
  checkAnyPermission(['upload_script', 'upload_script_revision']),
  updateScriptController
);

// Workflow actions
router.post(
  '/:id/submit',
  checkPermission('submit_for_review'),
  submitScriptController
);

router.post(
  '/:id/approve',
  checkPermission('approve_script'),
  approveScriptController
);

router.post(
  '/:id/reject',
  checkPermission('reject_script'),
  rejectScriptController
);

router.post(
  '/:id/lock',
  checkPermission('lock_script'),
  lockScriptController
);

router.post(
  '/:id/unlock',
  checkPermission('unlock_content'),
  unlockScriptController
);

// Claim system - track who is reviewing
router.post(
  '/:id/claim',
  checkAnyPermission(['review_script', 'approve_script']),
  claimScriptController
);

router.post(
  '/:id/release',
  checkAnyPermission(['review_script', 'approve_script']),
  releaseScriptController
);

export default router;

