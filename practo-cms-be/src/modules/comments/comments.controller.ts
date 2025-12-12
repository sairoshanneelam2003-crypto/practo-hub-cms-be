/**
 * Comments Controller
 */

import type { Response } from 'express';
import type { AuthRequest } from '../../middlewares/auth.middleware.js';
import * as commentService from './comments.service.js';

/**
 * Create a comment
 * POST /api/comments
 */
export async function createCommentController(req: AuthRequest, res: Response) {
  try {
    const { content, scriptId, videoId } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }

    const comment = await commentService.createComment({
      authorId: req.user!.userId,
      content,
      scriptId,
      videoId
    });

    return res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      comment
    });
  } catch (error: any) {
    console.error('Create comment error:', error);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Get comments for a script
 * GET /api/comments/script/:scriptId
 */
export async function getScriptCommentsController(req: AuthRequest, res: Response) {
  try {
    const { scriptId } = req.params;

    const comments = await commentService.getScriptComments(scriptId);

    return res.json({
      success: true,
      comments
    });
  } catch (error: any) {
    console.error('Get script comments error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Get comments for a video
 * GET /api/comments/video/:videoId
 */
export async function getVideoCommentsController(req: AuthRequest, res: Response) {
  try {
    const { videoId } = req.params;

    const comments = await commentService.getVideoComments(videoId);

    return res.json({
      success: true,
      comments
    });
  } catch (error: any) {
    console.error('Get video comments error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Update a comment
 * PATCH /api/comments/:id
 */
export async function updateCommentController(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }

    const comment = await commentService.updateComment(
      id,
      req.user!.userId,
      content
    );

    return res.json({
      success: true,
      message: 'Comment updated successfully',
      comment
    });
  } catch (error: any) {
    console.error('Update comment error:', error);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Delete a comment
 * DELETE /api/comments/:id
 */
export async function deleteCommentController(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    await commentService.deleteComment(id, req.user!.userId);

    return res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete comment error:', error);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

