/**
 * Videos Controller
 * 
 * Handles HTTP requests for video management and workflow
 */

import type { Response } from 'express';
import type { AuthRequest } from '../../middlewares/auth.middleware.js';
import * as videoService from './videos.service.js';
import { VideoStatus, CTAType } from '../../generated/prisma/index.js';

/**
 * Get presigned upload URL for video
 * POST /api/videos/upload-url
 */
export async function getUploadUrlController(req: AuthRequest, res: Response) {
  try {
    const { fileName, fileType } = req.body;

    if (!fileName || !fileType) {
      return res.status(400).json({
        success: false,
        message: 'fileName and fileType are required'
      });
    }

    const result = await videoService.getUploadUrl(
      req.user!.userId,
      fileName,
      fileType
    );

    return res.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    console.error('Get upload URL error:', error);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Get presigned upload URL for thumbnail
 * POST /api/videos/thumbnail-upload-url
 */
export async function getThumbnailUploadUrlController(req: AuthRequest, res: Response) {
  try {
    const { fileName, fileType } = req.body;

    if (!fileName || !fileType) {
      return res.status(400).json({
        success: false,
        message: 'fileName and fileType are required'
      });
    }

    const result = await videoService.getThumbnailUploadUrl(
      req.user!.userId,
      fileName,
      fileType
    );

    return res.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    console.error('Get thumbnail upload URL error:', error);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Create a new video
 * POST /api/videos
 */
export async function createVideoController(req: AuthRequest, res: Response) {
  try {
    const {
      topicId,
      scriptId,
      title,
      description,
      videoUrl,
      thumbnailUrl,
      duration,
      fileSize,
      doctorName,
      specialty,
      language,
      city,
      ctaType,
      tags
    } = req.body;

    // Validate required fields
    if (!topicId || !title || !videoUrl || !doctorName || !specialty || !language || !city || !ctaType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: topicId, title, videoUrl, doctorName, specialty, language, city, ctaType'
      });
    }

    // Validate ctaType
    if (!Object.values(CTAType).includes(ctaType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ctaType. Must be one of: ${Object.values(CTAType).join(', ')}`
      });
    }

    const video = await videoService.createVideo({
      topicId,
      scriptId,
      title,
      description,
      videoUrl,
      thumbnailUrl,
      duration,
      fileSize: fileSize ? BigInt(fileSize) : undefined,
      doctorName,
      specialty,
      language,
      city,
      ctaType,
      tags,
      uploadedById: req.user!.userId
    });

    return res.status(201).json({
      success: true,
      message: 'Video created successfully',
      video
    });
  } catch (error: any) {
    console.error('Create video error:', error);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Get video by ID
 * GET /api/videos/:id
 */
export async function getVideoController(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const video = await videoService.getVideoById(id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    return res.json({
      success: true,
      video
    });
  } catch (error: any) {
    console.error('Get video error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Get all videos for a topic
 * GET /api/videos/topic/:topicId
 */
export async function getVideosByTopicController(req: AuthRequest, res: Response) {
  try {
    const { topicId } = req.params;

    const videos = await videoService.getVideosByTopic(topicId);

    return res.json({
      success: true,
      videos
    });
  } catch (error: any) {
    console.error('Get videos by topic error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Get videos with filters
 * GET /api/videos
 */
export async function getVideosController(req: AuthRequest, res: Response) {
  try {
    const { status, topicId, specialty, language, page = '1', limit = '20' } = req.query;

    const filters: any = {};
    if (status) filters.status = status as VideoStatus;
    if (topicId) filters.topicId = topicId as string;
    if (specialty) filters.specialty = specialty as string;
    if (language) filters.language = language as string;

    const result = await videoService.getVideos(
      filters,
      parseInt(page as string),
      parseInt(limit as string)
    );

    return res.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    console.error('Get videos error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Update a video
 * PATCH /api/videos/:id
 */
export async function updateVideoController(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { title, description, thumbnailUrl, doctorName, specialty, language, city, ctaType, tags } = req.body;

    const video = await videoService.updateVideo(id, {
      title,
      description,
      thumbnailUrl,
      doctorName,
      specialty,
      language,
      city,
      ctaType,
      tags
    });

    return res.json({
      success: true,
      message: 'Video updated successfully',
      video
    });
  } catch (error: any) {
    console.error('Update video error:', error);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Submit video for review
 * POST /api/videos/:id/submit
 */
export async function submitVideoController(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const video = await videoService.submitVideo(
      id,
      req.user!.userId,
      req.user!.role
    );

    return res.json({
      success: true,
      message: 'Video submitted for review',
      video
    });
  } catch (error: any) {
    console.error('Submit video error:', error);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Approve a video
 * POST /api/videos/:id/approve
 */
export async function approveVideoController(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { comments } = req.body;

    const video = await videoService.approveVideo(
      id,
      req.user!.userId,
      req.user!.role,
      comments
    );

    return res.json({
      success: true,
      message: 'Video approved',
      video
    });
  } catch (error: any) {
    console.error('Approve video error:', error);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Reject a video
 * POST /api/videos/:id/reject
 */
export async function rejectVideoController(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { comments } = req.body;

    if (!comments) {
      return res.status(400).json({
        success: false,
        message: 'Comments are required for rejection'
      });
    }

    const video = await videoService.rejectVideo(
      id,
      req.user!.userId,
      req.user!.role,
      comments
    );

    return res.json({
      success: true,
      message: 'Video rejected and moved to previous stage',
      video
    });
  } catch (error: any) {
    console.error('Reject video error:', error);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Lock a video
 * POST /api/videos/:id/lock
 */
export async function lockVideoController(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const video = await videoService.lockVideo(
      id,
      req.user!.userId,
      req.user!.role
    );

    return res.json({
      success: true,
      message: 'Video locked successfully',
      video
    });
  } catch (error: any) {
    console.error('Lock video error:', error);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Publish a video
 * POST /api/videos/:id/publish
 */
export async function publishVideoController(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const video = await videoService.publishVideo(
      id,
      req.user!.userId,
      req.user!.role
    );

    return res.json({
      success: true,
      message: 'Video published successfully',
      video
    });
  } catch (error: any) {
    console.error('Publish video error:', error);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Unlock a video (Super Admin only)
 * POST /api/videos/:id/unlock
 */
export async function unlockVideoController(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const video = await videoService.unlockVideo(
      id,
      req.user!.userId,
      req.user!.role
    );

    return res.json({
      success: true,
      message: 'Video unlocked successfully (emergency action)',
      video
    });
  } catch (error: any) {
    console.error('Unlock video error:', error);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Archive a video
 * POST /api/videos/:id/archive
 */
export async function archiveVideoController(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const video = await videoService.archiveVideo(
      id,
      req.user!.userId,
      req.user!.role
    );

    return res.json({
      success: true,
      message: 'Video archived successfully',
      video
    });
  } catch (error: any) {
    console.error('Archive video error:', error);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Get review queue
 * GET /api/videos/queue
 */
export async function getVideoQueueController(req: AuthRequest, res: Response) {
  try {
    const queue = await videoService.getVideoQueue(req.user!.role);

    return res.json({
      success: true,
      ...queue
    });
  } catch (error: any) {
    console.error('Get queue error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Get video review history
 * GET /api/videos/:id/reviews
 */
export async function getVideoReviewsController(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const reviews = await videoService.getVideoReviews(id);

    return res.json({
      success: true,
      reviews
    });
  } catch (error: any) {
    console.error('Get reviews error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Get published videos (public API)
 * GET /api/v1/hub/videos
 */
export async function getPublishedVideosController(req: AuthRequest, res: Response) {
  try {
    const { specialty, language, search, page = '1', limit = '20' } = req.query;

    const result = await videoService.getPublishedVideos(
      {
        specialty: specialty as string,
        language: language as string,
        search: search as string
      },
      parseInt(page as string),
      parseInt(limit as string)
    );

    return res.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    console.error('Get published videos error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

