/**
 * Topics Service
 * 
 * Handles all topic-related business logic
 */

import prisma from '../../prisma/client.js';
import { TopicStatus, UserRole } from '../../generated/prisma/index.js';

// ============================================================================
// TYPES
// ============================================================================

export interface CreateTopicInput {
  title: string;
  description: string;
  assignedDoctorId: string;
  createdById: string;
}

export interface UpdateTopicInput {
  title?: string;
  description?: string;
  assignedDoctorId?: string;
  status?: TopicStatus;
}

export interface TopicFilters {
  status?: TopicStatus;
  assignedDoctorId?: string;
  createdById?: string;
  search?: string;
}

// ============================================================================
// SERVICE FUNCTIONS
// ============================================================================

/**
 * Create a new topic
 */
export async function createTopic(input: CreateTopicInput) {
  // Verify assigned doctor exists and has DOCTOR_CREATOR role
  const doctor = await prisma.user.findUnique({
    where: { id: input.assignedDoctorId }
  });

  if (!doctor) {
    throw new Error('Assigned doctor not found');
  }

  if (doctor.role !== UserRole.DOCTOR_CREATOR) {
    throw new Error('Assigned user must be a Doctor Creator');
  }

  const topic = await prisma.topic.create({
    data: {
      title: input.title,
      description: input.description,
      assignedDoctorId: input.assignedDoctorId,
      createdById: input.createdById,
      status: TopicStatus.ASSIGNED
    },
    include: {
      assignedDoctor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          specialty: true
        }
      },
      createdBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      }
    }
  });

  // Trigger notification for topic assignment (async, don't block)
  const { NotificationService } = await import('../notifications/notifications.service.js');
  NotificationService.enqueueEvent({
    eventType: 'TOPIC_ASSIGNED',
    entityId: topic.id,
    entityType: 'TOPIC',
    topicId: topic.id,
    actorUserId: input.createdById,
  }).catch((err) => {
    console.error('Failed to trigger topic assignment notification:', err);
  });

  return topic;
}

/**
 * Get topic by ID
 */
export async function getTopicById(topicId: string) {
  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    include: {
      assignedDoctor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          specialty: true,
          city: true
        }
      },
      createdBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      },
      doctorPointers: {
        orderBy: { createdAt: 'desc' }
      },
      scripts: {
        orderBy: { version: 'desc' },
        select: {
          id: true,
          version: true,
          status: true,
          createdAt: true
        }
      },
      videos: {
        orderBy: { version: 'desc' },
        select: {
          id: true,
          title: true,
          version: true,
          status: true,
          createdAt: true
        }
      },
      _count: {
        select: {
          doctorPointers: true,
          scripts: true,
          videos: true
        }
      }
    }
  });

  return topic;
}

/**
 * Get all topics with filters and pagination
 */
export async function getTopics(
  filters: TopicFilters = {},
  page = 1,
  limit = 20
) {
  const skip = (page - 1) * limit;

  const where: any = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.assignedDoctorId) {
    where.assignedDoctorId = filters.assignedDoctorId;
  }

  if (filters.createdById) {
    where.createdById = filters.createdById;
  }

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } }
    ];
  }

  const [topics, total] = await Promise.all([
    prisma.topic.findMany({
      where,
      include: {
        assignedDoctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialty: true
          }
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        _count: {
          select: {
            doctorPointers: true,
            scripts: true,
            videos: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.topic.count({ where })
  ]);

  return {
    topics,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
}

/**
 * Get topics assigned to a specific doctor
 */
export async function getDoctorAssignedTopics(doctorId: string) {
  const topics = await prisma.topic.findMany({
    where: { assignedDoctorId: doctorId },
    include: {
      createdBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true
        }
      },
      _count: {
        select: {
          doctorPointers: true,
          scripts: true,
          videos: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return topics;
}

/**
 * Update a topic
 */
export async function updateTopic(topicId: string, input: UpdateTopicInput) {
  // If changing assigned doctor, verify the new doctor
  if (input.assignedDoctorId) {
    const doctor = await prisma.user.findUnique({
      where: { id: input.assignedDoctorId }
    });

    if (!doctor) {
      throw new Error('Assigned doctor not found');
    }

    if (doctor.role !== UserRole.DOCTOR_CREATOR) {
      throw new Error('Assigned user must be a Doctor Creator');
    }
  }

  const topic = await prisma.topic.update({
    where: { id: topicId },
    data: input,
    include: {
      assignedDoctor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          specialty: true
        }
      },
      createdBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      }
    }
  });

  return topic;
}

/**
 * Update topic status
 */
export async function updateTopicStatus(topicId: string, status: TopicStatus) {
  const topic = await prisma.topic.update({
    where: { id: topicId },
    data: { status }
  });

  return topic;
}

/**
 * Delete a topic
 */
export async function deleteTopic(topicId: string) {
  // Check if topic has any scripts or videos
  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    include: {
      _count: {
        select: {
          scripts: true,
          videos: true
        }
      }
    }
  });

  if (!topic) {
    throw new Error('Topic not found');
  }

  if (topic._count.scripts > 0 || topic._count.videos > 0) {
    throw new Error('Cannot delete topic with existing scripts or videos');
  }

  await prisma.topic.delete({
    where: { id: topicId }
  });

  return { success: true };
}

/**
 * Get topic statistics
 */
export async function getTopicStats() {
  const stats = await prisma.topic.groupBy({
    by: ['status'],
    _count: {
      id: true
    }
  });

  const total = await prisma.topic.count();

  return {
    total,
    byStatus: stats.reduce((acc, curr) => {
      acc[curr.status] = curr._count.id;
      return acc;
    }, {} as Record<TopicStatus, number>)
  };
}

