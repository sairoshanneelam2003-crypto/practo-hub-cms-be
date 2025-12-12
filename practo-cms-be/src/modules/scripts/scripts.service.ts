/**
 * Scripts Service
 * 
 * Handles all script-related business logic including workflow
 */

import prisma from '../../prisma/client.js';
import { ScriptStatus, TopicStatus, UserRole } from '../../generated/prisma/index.js';
import { WorkflowService, type TransitionResult } from '../../services/workflow.service.js';

// ============================================================================
// TYPES
// ============================================================================

export interface CreateScriptInput {
  topicId: string;
  content: string;
  uploadedById: string;
}

export interface UpdateScriptInput {
  content?: string;
  summary?: string;
  tags?: string[];
}

export interface ScriptFilters {
  status?: ScriptStatus;
  topicId?: string;
  uploadedById?: string;
}

// ============================================================================
// SERVICE FUNCTIONS
// ============================================================================

/**
 * Create a new script
 */
export async function createScript(input: CreateScriptInput) {
  // Verify topic exists
  const topic = await prisma.topic.findUnique({
    where: { id: input.topicId }
  });

  if (!topic) {
    throw new Error('Topic not found');
  }

  // Get the latest version for this topic
  const latestScript = await prisma.script.findFirst({
    where: { topicId: input.topicId },
    orderBy: { version: 'desc' }
  });

  const nextVersion = (latestScript?.version || 0) + 1;

  const script = await prisma.script.create({
    data: {
      topicId: input.topicId,
      content: input.content,
      version: nextVersion,
      status: ScriptStatus.DRAFT,
      uploadedById: input.uploadedById
    },
    include: {
      topic: true,
      uploadedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      }
    }
  });

  // Update topic status if needed
  if (topic.status === TopicStatus.DOCTOR_INPUT_RECEIVED) {
    await prisma.topic.update({
      where: { id: input.topicId },
      data: { status: TopicStatus.IN_PROGRESS }
    });
  }

  return script;
}

/**
 * Get script by ID
 */
export async function getScriptById(scriptId: string) {
  const script = await prisma.script.findUnique({
    where: { id: scriptId },
    include: {
      topic: {
        include: {
          assignedDoctor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              specialty: true
            }
          }
        }
      },
      uploadedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      },
      lockedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true
        }
      },
      reviews: {
        include: {
          reviewer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      },
      comments: {
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  return script;
}

/**
 * Get all scripts for a topic
 */
export async function getScriptsByTopic(topicId: string) {
  const scripts = await prisma.script.findMany({
    where: { topicId },
    include: {
      uploadedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true
        }
      },
      _count: {
        select: {
          reviews: true,
          comments: true
        }
      }
    },
    orderBy: { version: 'desc' }
  });

  return scripts;
}

/**
 * Get scripts with filters
 */
export async function getScripts(
  filters: ScriptFilters = {},
  page = 1,
  limit = 20
) {
  const skip = (page - 1) * limit;

  const where: any = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.topicId) {
    where.topicId = filters.topicId;
  }

  if (filters.uploadedById) {
    where.uploadedById = filters.uploadedById;
  }

  const [scripts, total] = await Promise.all([
    prisma.script.findMany({
      where,
      include: {
        topic: {
          select: {
            id: true,
            title: true
          }
        },
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.script.count({ where })
  ]);

  return {
    scripts,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
}

/**
 * Update a script (only if in DRAFT status)
 */
export async function updateScript(scriptId: string, input: UpdateScriptInput) {
  const script = await prisma.script.findUnique({
    where: { id: scriptId }
  });

  if (!script) {
    throw new Error('Script not found');
  }

  if (script.status !== ScriptStatus.DRAFT) {
    throw new Error('Can only edit scripts in DRAFT status');
  }

  const updated = await prisma.script.update({
    where: { id: scriptId },
    data: input,
    include: {
      topic: true,
      uploadedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true
        }
      }
    }
  });

  return updated;
}

/**
 * Submit script for review
 */
export async function submitScript(
  scriptId: string,
  userId: string,
  userRole: UserRole
) {
  const result = await WorkflowService.transitionScript(scriptId, 'SUBMIT', {
    userId,
    userRole
  });

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.data;
}

/**
 * Approve a script
 */
export async function approveScript(
  scriptId: string,
  userId: string,
  userRole: UserRole,
  comments?: string
) {
  const context: any = {
    userId,
    userRole
  };
  
  if (comments) {
    context.comments = comments;
  }

  const result = await WorkflowService.transitionScript(scriptId, 'APPROVE', context);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.data;
}

/**
 * Reject a script (goes one step back)
 */
export async function rejectScript(
  scriptId: string,
  userId: string,
  userRole: UserRole,
  comments: string
) {
  if (!comments) {
    throw new Error('Rejection comments are required');
  }

  const result = await WorkflowService.transitionScript(scriptId, 'REJECT', {
    userId,
    userRole,
    comments
  });

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.data;
}

/**
 * Lock a script
 */
export async function lockScript(
  scriptId: string,
  userId: string,
  userRole: UserRole
) {
  const result = await WorkflowService.lockScript(scriptId, {
    userId,
    userRole
  });

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.data;
}

/**
 * Unlock a script (Super Admin only)
 */
export async function unlockScript(
  scriptId: string,
  userId: string,
  userRole: UserRole
) {
  const result = await WorkflowService.unlockScript(scriptId, {
    userId,
    userRole
  });

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.data;
}

/**
 * Get review queue based on user role (with claim status)
 */
export async function getScriptQueue(userRole: UserRole, userId: string) {
  const result = await WorkflowService.getQueueForRole(userRole, 'script', userId);
  return result;
}

/**
 * Get script review history
 */
export async function getScriptReviews(scriptId: string) {
  const reviews = await prisma.scriptReview.findMany({
    where: { scriptId },
    include: {
      reviewer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return reviews;
}

/**
 * Claim a script for review (blocks other reviewers)
 */
export async function claimScript(
  scriptId: string,
  userId: string,
  userRole: UserRole
): Promise<TransitionResult> {
  return WorkflowService.claimScript(scriptId, {
    userId,
    userRole
  });
}

/**
 * Release a claimed script (back to pool)
 */
export async function releaseScript(
  scriptId: string,
  userId: string,
  userRole: UserRole
): Promise<TransitionResult> {
  return WorkflowService.releaseScript(scriptId, {
    userId,
    userRole
  });
}


