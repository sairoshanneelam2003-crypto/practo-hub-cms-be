/**
 * Doctor Pointers Controller
 */

import type { Response } from 'express';
import type { AuthRequest } from '../../middlewares/auth.middleware.js';
import * as pointerService from './doctor-pointers.service.js';

/**
 * Get presigned upload URL
 * POST /api/doctor-pointers/upload-url
 */
export async function getUploadUrlController(req: AuthRequest, res: Response) {
  try {
    const { fileName, fileType, contentType } = req.body;

    if (!fileName || !fileType || !contentType) {
      return res.status(400).json({
        success: false,
        message: 'fileName, fileType, and contentType are required'
      });
    }

    if (!['audio', 'document'].includes(contentType)) {
      return res.status(400).json({
        success: false,
        message: 'contentType must be audio or document'
      });
    }

    const result = await pointerService.getUploadUrl(
      req.user!.userId,
      fileName,
      fileType,
      contentType as 'audio' | 'document'
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
 * Create a doctor pointer
 * POST /api/doctor-pointers
 */
export async function createPointerController(req: AuthRequest, res: Response) {
  try {
    const { topicId, notes, fileUrl, fileType } = req.body;

    if (!topicId) {
      return res.status(400).json({
        success: false,
        message: 'topicId is required'
      });
    }

    if (!notes && !fileUrl) {
      return res.status(400).json({
        success: false,
        message: 'Either notes or fileUrl is required'
      });
    }

    const pointer = await pointerService.createPointer({
      topicId,
      doctorId: req.user!.userId,
      notes,
      fileUrl,
      fileType
    });

    return res.status(201).json({
      success: true,
      message: 'Doctor pointer created successfully',
      pointer
    });
  } catch (error: any) {
    console.error('Create pointer error:', error);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Get pointers for a topic
 * GET /api/doctor-pointers/topic/:topicId
 */
export async function getPointersByTopicController(req: AuthRequest, res: Response) {
  try {
    const { topicId } = req.params;

    const pointers = await pointerService.getPointersByTopic(topicId);

    return res.json({
      success: true,
      pointers
    });
  } catch (error: any) {
    console.error('Get pointers error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Get a specific pointer
 * GET /api/doctor-pointers/:id
 */
export async function getPointerController(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const pointer = await pointerService.getPointerById(id);

    if (!pointer) {
      return res.status(404).json({
        success: false,
        message: 'Pointer not found'
      });
    }

    return res.json({
      success: true,
      pointer
    });
  } catch (error: any) {
    console.error('Get pointer error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Delete a pointer
 * DELETE /api/doctor-pointers/:id
 */
export async function deletePointerController(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    await pointerService.deletePointer(id, req.user!.userId);

    return res.json({
      success: true,
      message: 'Pointer deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete pointer error:', error);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

