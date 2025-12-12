/**
 * Videos Service
 * 
 * Handles all video-related business logic including workflow
 */

import prisma from '../../prisma/client.js';
import { VideoStatus, CTAType, TopicStatus, UserRole } from '../../generated/prisma/index.js';
import { WorkflowService } from '../../services/workflow.service.js';
import * as s3Service from '../storage/s3.service.js';

// ============================================================================
// TYPES
// ============================================================================

export interface CreateVideoInput {
  topicId: string;
  scriptId?: string;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration?: number;
  fileSize?: bigint;
  doctorName: string;
  specialty: string;
  language: string;
  city: string;
  ctaType: CTAType;
  tags?: string[];
  uploadedById: string;
}

export interface UpdateVideoInput {
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  doctorName?: string;
  specialty?: string;
  language?: string;
  city?: string;
  ctaType?: CTAType;
  tags?: string[];
}

export interface VideoFilters {
  status?: VideoStatus;
  topicId?: string;
  uploadedById?: string;
  specialty?: string;
  language?: string;
}

// ============================================================================
// SERVICE FUNCTIONS
// ============================================================================

/**
 * Generate presigned upload URL for video
 */
export async function getUploadUrl(
  userId: string,
  fileName: string,
  fileType: string
) {
  // Validate file type
  if (!s3Service.validateFileType(fileType, 'video')) {
    throw new Error('Invalid file type. Allowed: mp4, webm, mov, avi');
  }

  return await s3Service.generatePresignedUploadUrl(
    userId,
    fileName,
    fileType,
    'video'
  );
}

/**
 * Generate presigned upload URL for thumbnail
 */
export async function getThumbnailUploadUrl(
  userId: string,
  fileName: string,
  fileType: string
) {
  if (!s3Service.validateFileType(fileType, 'thumbnail')) {
    throw new Error('Invalid file type. Allowed: jpeg, png, webp');
  }

  return await s3Service.generatePresignedUploadUrl(
    userId,
    fileName,
    fileType,
    'thumbnail'
  );
}

/**
 * Create a new video record
 */
export async function createVideo(input: CreateVideoInput) {
  // Verify topic exists
  const topic = await prisma.topic.findUnique({
    where: { id: input.topicId }
  });

  if (!topic) {
    throw new Error('Topic not found');
  }

  // Verify script exists if provided
  if (input.scriptId) {
    const script = await prisma.script.findUnique({
      where: { id: input.scriptId }
    });

    if (!script) {
      throw new Error('Script not found');
    }

    if (script.topicId !== input.topicId) {
      throw new Error('Script does not belong to the specified topic');
    }
  }

  // Get the latest version for this topic
  const latestVideo = await prisma.video.findFirst({
    where: { topicId: input.topicId },
    orderBy: { version: 'desc' }
  });

  const nextVersion = (latestVideo?.version || 0) + 1;

  const video = await prisma.video.create({
    data: {
      topicId: input.topicId,
      scriptId: input.scriptId,
      title: input.title,
      description: input.description,
      videoUrl: input.videoUrl,
      thumbnailUrl: input.thumbnailUrl,
      duration: input.duration,
      fileSize: input.fileSize,
      doctorName: input.doctorName,
      specialty: input.specialty,
      language: input.language,
      city: input.city,
      ctaType: input.ctaType,
      tags: input.tags || [],
      version: nextVersion,
      status: VideoStatus.DRAFT,
      uploadedById: input.uploadedById
    },
    include: {
      topic: true,
      script: true,
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

  // Update topic status
  if (topic.status !== TopicStatus.COMPLETED) {
    await prisma.topic.update({
      where: { id: input.topicId },
      data: { status: TopicStatus.IN_PROGRESS }
    });
  }

  return video;
}

/**
 * Get video by ID
 */
export async function getVideoById(videoId: string) {
  const video = await prisma.video.findUnique({
    where: { id: videoId },
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
      script: {
        select: {
          id: true,
          version: true,
          status: true,
          content: true
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
      publishedBy: {
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
      },
      analytics: true
    }
  });

  return video;
}

/**
 * Get all videos for a topic
 */
export async function getVideosByTopic(topicId: string) {
  const videos = await prisma.video.findMany({
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

  return videos;
}

/**
 * Get videos with filters
 */
export async function getVideos(
  filters: VideoFilters = {},
  page = 1,
  limit = 20
) {
  const skip = (page - 1) * limit;

  const where: any = {};

  if (filters.status) where.status = filters.status;
  if (filters.topicId) where.topicId = filters.topicId;
  if (filters.uploadedById) where.uploadedById = filters.uploadedById;
  if (filters.specialty) where.specialty = { contains: filters.specialty, mode: 'insensitive' };
  if (filters.language) where.language = { contains: filters.language, mode: 'insensitive' };

  const [videos, total] = await Promise.all([
    prisma.video.findMany({
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
    prisma.video.count({ where })
  ]);

  return {
    videos,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
}

/**
 * Update a video (only if in DRAFT status)
 */
export async function updateVideo(videoId: string, input: UpdateVideoInput) {
  const video = await prisma.video.findUnique({
    where: { id: videoId }
  });

  if (!video) {
    throw new Error('Video not found');
  }

  if (video.status !== VideoStatus.DRAFT) {
    throw new Error('Can only edit videos in DRAFT status');
  }

  const updated = await prisma.video.update({
    where: { id: videoId },
    data: input,
    include: {
      topic: true,
      script: true,
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
 * Submit video for review
 */
export async function submitVideo(
  videoId: string,
  userId: string,
  userRole: UserRole
) {
  const result = await WorkflowService.transitionVideo(videoId, 'SUBMIT', {
    userId,
    userRole
  });

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.data;
}

/**
 * Approve a video
 */
export async function approveVideo(
  videoId: string,
  userId: string,
  userRole: UserRole,
  comments?: string
) {
  const result = await WorkflowService.transitionVideo(videoId, 'APPROVE', {
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
 * Reject a video (goes one step back)
 */
export async function rejectVideo(
  videoId: string,
  userId: string,
  userRole: UserRole,
  comments: string
) {
  if (!comments) {
    throw new Error('Rejection comments are required');
  }

  const result = await WorkflowService.transitionVideo(videoId, 'REJECT', {
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
 * Lock a video
 */
export async function lockVideo(
  videoId: string,
  userId: string,
  userRole: UserRole
) {
  const result = await WorkflowService.lockVideo(videoId, {
    userId,
    userRole
  });

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.data;
}

/**
 * Publish a video
 */
export async function publishVideo(
  videoId: string,
  userId: string,
  userRole: UserRole
) {
  const result = await WorkflowService.transitionVideo(videoId, 'PUBLISH', {
    userId,
    userRole
  });

  if (!result.success) {
    throw new Error(result.error);
  }

  // Update topic status to COMPLETED
  const video = result.data;
  await prisma.topic.update({
    where: { id: video.topicId },
    data: { status: TopicStatus.COMPLETED }
  });

  return result.data;
}

/**
 * Unlock a video (Super Admin only)
 */
export async function unlockVideo(
  videoId: string,
  userId: string,
  userRole: UserRole
) {
  const result = await WorkflowService.unlockVideo(videoId, {
    userId,
    userRole
  });

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.data;
}

/**
 * Archive a video
 */
export async function archiveVideo(
  videoId: string,
  userId: string,
  userRole: UserRole
) {
  const result = await WorkflowService.transitionVideo(videoId, 'ARCHIVE', {
    userId,
    userRole
  });

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.data;
}

/**
 * Get review queue based on user role
 */
export async function getVideoQueue(userRole: UserRole) {
  const result = await WorkflowService.getQueueForRole(userRole, 'video');
  return result;
}

/**
 * Get video review history
 */
export async function getVideoReviews(videoId: string) {
  const reviews = await prisma.videoReview.findMany({
    where: { videoId },
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
 * Get published videos (for public API)
 */
export async function getPublishedVideos(
  filters: { specialty?: string; language?: string; search?: string } = {},
  page = 1,
  limit = 20
) {
  const skip = (page - 1) * limit;

  const where: any = {
    status: VideoStatus.PUBLISHED
  };

  if (filters.specialty) {
    where.specialty = { contains: filters.specialty, mode: 'insensitive' };
  }
  if (filters.language) {
    where.language = { contains: filters.language, mode: 'insensitive' };
  }
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
      { doctorName: { contains: filters.search, mode: 'insensitive' } },
      { tags: { has: filters.search } }
    ];
  }

  const [videos, total] = await Promise.all([
    prisma.video.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        videoUrl: true,
        thumbnailUrl: true,
        duration: true,
        doctorName: true,
        specialty: true,
        language: true,
        city: true,
        ctaType: true,
        tags: true,
        summary: true,
        shortSummary: true,
        keyTakeaways: true,
        deepLink: true,
        viewCount: true,
        publishedAt: true
      },
      orderBy: { publishedAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.video.count({ where })
  ]);

  return {
    videos,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
}

