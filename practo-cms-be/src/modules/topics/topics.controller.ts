/**
 * Topics Controller
 * 
 * Handles HTTP requests for topic management
 */

import type { Response } from 'express';
import type { AuthRequest } from '../../middlewares/auth.middleware.js';
import * as topicService from './topics.service.js';
import { TopicStatus } from '../../generated/prisma/index.js';

/**
 * Create a new topic
 * POST /api/topics
 */
export async function createTopicController(req: AuthRequest, res: Response) {
  try {
    const { title, description, assignedDoctorId } = req.body;

    if (!title || !description || !assignedDoctorId) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and assignedDoctorId are required'
      });
    }

    const topic = await topicService.createTopic({
      title,
      description,
      assignedDoctorId,
      createdById: req.user!.userId
    });

    return res.status(201).json({
      success: true,
      message: 'Topic created successfully',
      topic
    });
  } catch (error: any) {
    console.error('Create topic error:', error);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Get all topics with filters
 * GET /api/topics
 */
export async function getTopicsController(req: AuthRequest, res: Response) {
  try {
    const {
      status,
      assignedDoctorId,
      search,
      page = '1',
      limit = '20'
    } = req.query;

    const filters: any = {};
    
    if (status) filters.status = status as TopicStatus;
    if (assignedDoctorId) filters.assignedDoctorId = assignedDoctorId as string;
    if (search) filters.search = search as string;

    const result = await topicService.getTopics(
      filters,
      parseInt(page as string),
      parseInt(limit as string)
    );

    return res.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    console.error('Get topics error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Get topic by ID
 * GET /api/topics/:id
 */
export async function getTopicByIdController(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const topic = await topicService.getTopicById(id);

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: 'Topic not found'
      });
    }

    return res.json({
      success: true,
      topic
    });
  } catch (error: any) {
    console.error('Get topic error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Get doctor's assigned topics
 * GET /api/topics/my-assignments
 */
export async function getMyAssignmentsController(req: AuthRequest, res: Response) {
  try {
    const topics = await topicService.getDoctorAssignedTopics(req.user!.userId);

    return res.json({
      success: true,
      topics
    });
  } catch (error: any) {
    console.error('Get assignments error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Update a topic
 * PATCH /api/topics/:id
 */
export async function updateTopicController(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { title, description, assignedDoctorId, status } = req.body;

    // Check if topic exists
    const existing = await topicService.getTopicById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Topic not found'
      });
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (assignedDoctorId !== undefined) updateData.assignedDoctorId = assignedDoctorId;
    if (status !== undefined) updateData.status = status;

    const topic = await topicService.updateTopic(id, updateData);

    return res.json({
      success: true,
      message: 'Topic updated successfully',
      topic
    });
  } catch (error: any) {
    console.error('Update topic error:', error);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Delete a topic
 * DELETE /api/topics/:id
 */
export async function deleteTopicController(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    await topicService.deleteTopic(id);

    return res.json({
      success: true,
      message: 'Topic deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete topic error:', error);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Get topic statistics
 * GET /api/topics/stats
 */
export async function getTopicStatsController(req: AuthRequest, res: Response) {
  try {
    const stats = await topicService.getTopicStats();

    return res.json({
      success: true,
      stats
    });
  } catch (error: any) {
    console.error('Get stats error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

