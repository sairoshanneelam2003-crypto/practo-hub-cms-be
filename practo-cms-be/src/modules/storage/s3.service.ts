/**
 * S3 Service
 * 
 * Handles AWS S3 operations including presigned URL generation
 * for direct browser-to-S3 uploads
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// ============================================================================
// S3 CLIENT CONFIGURATION
// ============================================================================

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'practo-hub-videos';

// ============================================================================
// TYPES
// ============================================================================

export interface PresignedUrlResponse {
  uploadUrl: string;
  key: string;
  fileUrl: string;
  expiresIn: number;
}

export type ContentType = 'video' | 'audio' | 'document' | 'image' | 'thumbnail';

// ============================================================================
// SERVICE FUNCTIONS
// ============================================================================

/**
 * Generate a presigned URL for direct upload to S3
 */
export async function generatePresignedUploadUrl(
  userId: string,
  fileName: string,
  fileType: string,
  contentType: ContentType
): Promise<PresignedUrlResponse> {
  // Generate unique S3 key
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const s3Key = `${contentType}s/${userId}/${timestamp}_${sanitizedFileName}`;

  // Create presigned URL command
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
    ContentType: fileType
  });

  const expiresIn = 3600; // 1 hour

  // Generate presigned URL
  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });

  // Construct the final file URL
  const fileUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${s3Key}`;

  return {
    uploadUrl,
    key: s3Key,
    fileUrl,
    expiresIn
  };
}

/**
 * Generate a presigned URL for downloading/viewing a file
 */
export async function generatePresignedDownloadUrl(
  s3Key: string,
  expiresIn = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Delete a file from S3
 */
export async function deleteFile(s3Key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key
  });

  await s3Client.send(command);
}

/**
 * Extract S3 key from a full S3 URL
 */
export function extractS3Key(fileUrl: string): string | null {
  try {
    const url = new URL(fileUrl);
    // Remove leading slash from pathname
    return url.pathname.substring(1);
  } catch {
    return null;
  }
}

/**
 * Validate file type for uploads
 */
export function validateFileType(fileType: string, contentType: ContentType): boolean {
  const allowedTypes: Record<ContentType, string[]> = {
    video: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'],
    audio: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm'],
    document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    thumbnail: ['image/jpeg', 'image/png', 'image/webp']
  };

  return allowedTypes[contentType]?.includes(fileType) ?? false;
}

/**
 * Get max file size for content type (in bytes)
 */
export function getMaxFileSize(contentType: ContentType): number {
  const maxSizes: Record<ContentType, number> = {
    video: 500 * 1024 * 1024,      // 500MB
    audio: 50 * 1024 * 1024,       // 50MB
    document: 20 * 1024 * 1024,    // 20MB
    image: 10 * 1024 * 1024,       // 10MB
    thumbnail: 5 * 1024 * 1024     // 5MB
  };

  return maxSizes[contentType];
}

