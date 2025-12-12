/**
 * Comments Service
 * 
 * Handles comments on scripts and videos
 */

import prisma from '../../prisma/client.js';

// ============================================================================
// TYPES
// ============================================================================

export interface CreateCommentInput {
  authorId: string;
  content: string;
  scriptId?: string;
  videoId?: string;
}

// ============================================================================
// SERVICE FUNCTIONS
// ============================================================================

/**
 * Create a comment
 */
export async function createComment(input: CreateCommentInput) {
  if (!input.scriptId && !input.videoId) {
    throw new Error('Either scriptId or videoId is required');
  }

  if (input.scriptId && input.videoId) {
    throw new Error('Cannot comment on both script and video');
  }

  // Verify entity exists
  if (input.scriptId) {
    const script = await prisma.script.findUnique({
      where: { id: input.scriptId }
    });
    if (!script) {
      throw new Error('Script not found');
    }
  }

  if (input.videoId) {
    const video = await prisma.video.findUnique({
      where: { id: input.videoId }
    });
    if (!video) {
      throw new Error('Video not found');
    }
  }

  const comment = await prisma.comment.create({
    data: {
      authorId: input.authorId,
      content: input.content,
      scriptId: input.scriptId,
      videoId: input.videoId
    },
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true
        }
      }
    }
  });

  return comment;
}

/**
 * Get comments for a script
 */
export async function getScriptComments(scriptId: string) {
  const comments = await prisma.comment.findMany({
    where: { scriptId },
    include: {
      author: {
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

  return comments;
}

/**
 * Get comments for a video
 */
export async function getVideoComments(videoId: string) {
  const comments = await prisma.comment.findMany({
    where: { videoId },
    include: {
      author: {
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

  return comments;
}

/**
 * Update a comment
 */
export async function updateComment(commentId: string, authorId: string, content: string) {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId }
  });

  if (!comment) {
    throw new Error('Comment not found');
  }

  if (comment.authorId !== authorId) {
    throw new Error('You can only edit your own comments');
  }

  const updated = await prisma.comment.update({
    where: { id: commentId },
    data: { content },
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true
        }
      }
    }
  });

  return updated;
}

/**
 * Delete a comment
 */
export async function deleteComment(commentId: string, authorId: string) {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId }
  });

  if (!comment) {
    throw new Error('Comment not found');
  }

  if (comment.authorId !== authorId) {
    throw new Error('You can only delete your own comments');
  }

  await prisma.comment.delete({
    where: { id: commentId }
  });

  return { success: true };
}

