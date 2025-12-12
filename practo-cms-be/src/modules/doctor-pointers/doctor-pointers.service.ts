/**
 * Doctor Pointers Service
 * 
 * Handles doctor input (notes, audio, documents) for topics
 */

import prisma from '../../prisma/client.js';
import { TopicStatus } from '../../generated/prisma/index.js';
import * as s3Service from '../storage/s3.service.js';

// ============================================================================
// TYPES
// ============================================================================

export interface CreatePointerInput {
  topicId: string;
  doctorId: string;
  notes?: string;
  fileUrl?: string;
  fileType?: string;
}

// ============================================================================
// SERVICE FUNCTIONS
// ============================================================================

/**
 * Get presigned upload URL for doctor pointer file
 */
export async function getUploadUrl(
  userId: string,
  fileName: string,
  fileType: string,
  contentType: 'audio' | 'document'
) {
  if (!s3Service.validateFileType(fileType, contentType)) {
    throw new Error(`Invalid file type for ${contentType}`);
  }

  return await s3Service.generatePresignedUploadUrl(
    userId,
    fileName,
    fileType,
    contentType
  );
}

/**
 * Create a doctor pointer
 */
export async function createPointer(input: CreatePointerInput) {
  // Verify topic exists
  const topic = await prisma.topic.findUnique({
    where: { id: input.topicId }
  });

  if (!topic) {
    throw new Error('Topic not found');
  }

  // Verify doctor is assigned to this topic
  if (topic.assignedDoctorId !== input.doctorId) {
    throw new Error('You are not assigned to this topic');
  }

  const pointer = await prisma.doctorPointer.create({
    data: {
      topicId: input.topicId,
      doctorId: input.doctorId,
      notes: input.notes,
      fileUrl: input.fileUrl,
      fileType: input.fileType
    },
    include: {
      doctor: {
        select: {
          id: true,
          firstName: true,
          lastName: true
        }
      }
    }
  });

  // Update topic status
  if (topic.status === TopicStatus.ASSIGNED || topic.status === TopicStatus.DOCTOR_INPUT_PENDING) {
    await prisma.topic.update({
      where: { id: input.topicId },
      data: { status: TopicStatus.DOCTOR_INPUT_RECEIVED }
    });
  }

  return pointer;
}

/**
 * Get all pointers for a topic
 */
export async function getPointersByTopic(topicId: string) {
  const pointers = await prisma.doctorPointer.findMany({
    where: { topicId },
    include: {
      doctor: {
        select: {
          id: true,
          firstName: true,
          lastName: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return pointers;
}

/**
 * Get a specific pointer
 */
export async function getPointerById(pointerId: string) {
  const pointer = await prisma.doctorPointer.findUnique({
    where: { id: pointerId },
    include: {
      topic: true,
      doctor: {
        select: {
          id: true,
          firstName: true,
          lastName: true
        }
      }
    }
  });

  return pointer;
}

/**
 * Delete a pointer
 */
export async function deletePointer(pointerId: string, doctorId: string) {
  const pointer = await prisma.doctorPointer.findUnique({
    where: { id: pointerId }
  });

  if (!pointer) {
    throw new Error('Pointer not found');
  }

  if (pointer.doctorId !== doctorId) {
    throw new Error('You can only delete your own pointers');
  }

  // Delete file from S3 if exists
  if (pointer.fileUrl) {
    const s3Key = s3Service.extractS3Key(pointer.fileUrl);
    if (s3Key) {
      await s3Service.deleteFile(s3Key);
    }
  }

  await prisma.doctorPointer.delete({
    where: { id: pointerId }
  });

  return { success: true };
}

