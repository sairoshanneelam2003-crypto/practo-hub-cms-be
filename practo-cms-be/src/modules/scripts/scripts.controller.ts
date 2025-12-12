/**
 * Scripts Controller
 * 
 * Handles HTTP requests for script management and workflow
 */

import type { Response } from 'express';
import type { AuthRequest } from '../../middlewares/auth.middleware.js';
import * as scriptService from './scripts.service.js';
import { ScriptStatus } from '../../generated/prisma/index.js';

/**
 * Create a new script
 * POST /api/scripts
 */
export async function createScriptController(req: AuthRequest, res: Response) {
  try {
    const { topicId, content } = req.body;

    if (!topicId || !content) {
      return res.status(400).json({
        success: false,
        message: 'topicId and content are required'
      });
    }

    const script = await scriptService.createScript({
      topicId,
      content,
      uploadedById: req.user!.userId
    });

    return res.status(201).json({
      success: true,
      message: 'Script created successfully',
      script
    });
  } catch (error: any) {
    console.error('Create script error:', error);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Get script by ID
 * GET /api/scripts/:id
 */
export async function getScriptController(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Script ID is required'
      });
    }

    const script = await scriptService.getScriptById(id);

    if (!script) {
      return res.status(404).json({
        success: false,
        message: 'Script not found'
      });
    }

    return res.json({
      success: true,
      script
    });
  } catch (error: any) {
    console.error('Get script error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Get all scripts for a topic
 * GET /api/scripts/topic/:topicId
 */
export async function getScriptsByTopicController(req: AuthRequest, res: Response) {
  try {
    const topicId = req.params.topicId;

    if (!topicId) {
      return res.status(400).json({
        success: false,
        message: 'topicId is required'
      });
    }

    const scripts = await scriptService.getScriptsByTopic(topicId);

    return res.json({
      success: true,
      scripts
    });
  } catch (error: any) {
    console.error('Get scripts by topic error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Get scripts with filters
 * GET /api/scripts
 */
export async function getScriptsController(req: AuthRequest, res: Response) {
  try {
    const status = req.query.status as string | undefined;
    const topicId = req.query.topicId as string | undefined;
    const page = req.query.page as string || '1';
    const limit = req.query.limit as string || '20';

    const filters: any = {};
    if (status) filters.status = status as ScriptStatus;
    if (topicId) filters.topicId = topicId;

    const result = await scriptService.getScripts(
      filters,
      parseInt(page),
      parseInt(limit)
    );

    return res.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    console.error('Get scripts error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Update a script
 * PATCH /api/scripts/:id
 */
export async function updateScriptController(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Script ID is required'
      });
    }

    const { content, summary, tags } = req.body;

    const script = await scriptService.updateScript(id, {
      content,
      summary,
      tags
    });

    return res.json({
      success: true,
      message: 'Script updated successfully',
      script
    });
  } catch (error: any) {
    console.error('Update script error:', error);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Submit script for review
 * POST /api/scripts/:id/submit
 */
export async function submitScriptController(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Script ID is required'
      });
    }

    const script = await scriptService.submitScript(
      id,
      req.user!.userId,
      req.user!.role
    );

    return res.json({
      success: true,
      message: 'Script submitted for review',
      script
    });
  } catch (error: any) {
    console.error('Submit script error:', error);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Approve a script
 * POST /api/scripts/:id/approve
 */
export async function approveScriptController(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Script ID is required'
      });
    }

    const { comments } = req.body;

    const script = await scriptService.approveScript(
      id,
      req.user!.userId,
      req.user!.role,
      comments
    );

    return res.json({
      success: true,
      message: 'Script approved',
      script
    });
  } catch (error: any) {
    console.error('Approve script error:', error);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Reject a script
 * POST /api/scripts/:id/reject
 */
export async function rejectScriptController(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Script ID is required'
      });
    }

    const { comments } = req.body;

    if (!comments) {
      return res.status(400).json({
        success: false,
        message: 'Comments are required for rejection'
      });
    }

    const script = await scriptService.rejectScript(
      id,
      req.user!.userId,
      req.user!.role,
      comments
    );

    return res.json({
      success: true,
      message: 'Script rejected and moved to previous stage',
      script
    });
  } catch (error: any) {
    console.error('Reject script error:', error);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Lock a script
 * POST /api/scripts/:id/lock
 */
export async function lockScriptController(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Script ID is required'
      });
    }

    const script = await scriptService.lockScript(
      id,
      req.user!.userId,
      req.user!.role
    );

    return res.json({
      success: true,
      message: 'Script locked successfully',
      script
    });
  } catch (error: any) {
    console.error('Lock script error:', error);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Unlock a script (Super Admin only)
 * POST /api/scripts/:id/unlock
 */
export async function unlockScriptController(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Script ID is required'
      });
    }

    const script = await scriptService.unlockScript(
      id,
      req.user!.userId,
      req.user!.role
    );

    return res.json({
      success: true,
      message: 'Script unlocked successfully (emergency action)',
      script
    });
  } catch (error: any) {
    console.error('Unlock script error:', error);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Get review queue (with available vs my claims)
 * GET /api/scripts/queue
 */
export async function getScriptQueueController(req: AuthRequest, res: Response) {
  try {
    const queue = await scriptService.getScriptQueue(
      req.user!.role,
      req.user!.userId
    );

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
 * Get script review history
 * GET /api/scripts/:id/reviews
 */
export async function getScriptReviewsController(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Script ID is required'
      });
    }

    const reviews = await scriptService.getScriptReviews(id);

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
 * Claim a script for review (blocks other reviewers)
 * POST /api/scripts/:id/claim
 */
export async function claimScriptController(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Script ID is required'
      });
    }

    const result = await scriptService.claimScript(
      id,
      req.user!.userId,
      req.user!.role
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }

    return res.json({
      success: true,
      message: 'Script claimed successfully. You can now review it.',
      script: result.data
    });
  } catch (error: any) {
    console.error('Claim script error:', error);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Release a claimed script (back to pool)
 * POST /api/scripts/:id/release
 */
export async function releaseScriptController(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Script ID is required'
      });
    }

    const result = await scriptService.releaseScript(
      id,
      req.user!.userId,
      req.user!.role
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }

    return res.json({
      success: true,
      message: 'Script released back to queue',
      script: result.data
    });
  } catch (error: any) {
    console.error('Release script error:', error);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
}


