/**
 * Videos Routes
 */

import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { checkPermission, checkAnyPermission } from '../../middlewares/checkPermission.js';
import {
  getUploadUrlController,
  getThumbnailUploadUrlController,
  createVideoController,
  getVideoController,
  getVideosByTopicController,
  getVideosController,
  updateVideoController,
  submitVideoController,
  approveVideoController,
  rejectVideoController,
  lockVideoController,
  publishVideoController,
  unlockVideoController,
  archiveVideoController,
  getVideoQueueController,
  getVideoReviewsController
} from './videos.controller.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get presigned upload URLs
router.post(
  '/upload-url',
  checkPermission('upload_video'),
  getUploadUrlController
);

router.post(
  '/thumbnail-upload-url',
  checkPermission('upload_video'),
  getThumbnailUploadUrlController
);

// Get review queue (role-based)
router.get(
  '/queue',
  checkAnyPermission(['review_video', 'approve_video', 'publish_content']),
  getVideoQueueController
);

// Get videos for a topic
router.get(
  '/topic/:topicId',
  checkAnyPermission(['view_content', 'review_video']),
  getVideosByTopicController
);

// Create a new video
router.post(
  '/',
  checkPermission('upload_video'),
  createVideoController
);

// Get all videos with filters
router.get(
  '/',
  checkAnyPermission(['view_content', 'review_video']),
  getVideosController
);

// Get video by ID
router.get(
  '/:id',
  checkAnyPermission(['view_content', 'review_video']),
  getVideoController
);

// Get video review history
router.get(
  '/:id/reviews',
  checkAnyPermission(['view_content', 'review_video']),
  getVideoReviewsController
);

// Update a video (only DRAFT)
router.patch(
  '/:id',
  checkPermission('upload_video'),
  updateVideoController
);

// Workflow actions
router.post(
  '/:id/submit',
  checkPermission('submit_for_review'),
  submitVideoController
);

router.post(
  '/:id/approve',
  checkPermission('approve_video'),
  approveVideoController
);

router.post(
  '/:id/reject',
  checkPermission('reject_video'),
  rejectVideoController
);

router.post(
  '/:id/lock',
  checkPermission('lock_video'),
  lockVideoController
);

router.post(
  '/:id/publish',
  checkPermission('publish_content'),
  publishVideoController
);

router.post(
  '/:id/unlock',
  checkPermission('unlock_content'),
  unlockVideoController
);

router.post(
  '/:id/archive',
  checkPermission('archive_content'),
  archiveVideoController
);

export default router;

