/**
 * Public Hub API Routes
 * 
 * These endpoints are for the Practo Hub mobile app to fetch published videos
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import * as videoService from './videos.service.js';

const router = Router();

/**
 * Get published videos
 * GET /api/v1/hub/videos
 */
router.get('/videos', async (req: Request, res: Response) => {
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
});

/**
 * Get single published video
 * GET /api/v1/hub/videos/:id
 */
router.get('/videos/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const video = await videoService.getVideoById(id);

    if (!video || video.status !== 'PUBLISHED') {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Increment view count
    // Note: In production, this should be done through analytics service

    return res.json({
      success: true,
      video: {
        id: video.id,
        title: video.title,
        description: video.description,
        videoUrl: video.videoUrl,
        thumbnailUrl: video.thumbnailUrl,
        duration: video.duration,
        doctorName: video.doctorName,
        specialty: video.specialty,
        language: video.language,
        city: video.city,
        ctaType: video.ctaType,
        tags: video.tags,
        summary: video.summary,
        shortSummary: video.shortSummary,
        keyTakeaways: video.keyTakeaways,
        transcript: video.transcript,
        deepLink: video.deepLink,
        viewCount: video.viewCount,
        publishedAt: video.publishedAt
      }
    });
  } catch (error: any) {
    console.error('Get video error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Search videos
 * GET /api/v1/hub/videos/search
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q, specialty, language, page = '1', limit = '20' } = req.query;

    const result = await videoService.getPublishedVideos(
      {
        search: q as string,
        specialty: specialty as string,
        language: language as string
      },
      parseInt(page as string),
      parseInt(limit as string)
    );

    return res.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    console.error('Search videos error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;

