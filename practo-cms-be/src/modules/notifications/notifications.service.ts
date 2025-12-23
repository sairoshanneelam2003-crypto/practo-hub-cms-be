/**
 * Notification Service
 * 
 * Handles creating notification events and enqueueing them to Bull queue.
 * This service determines recipients and builds notification content.
 */

import { UserRole, UserStatus } from '../../generated/prisma/index.js';
import { notificationQueue } from './queue.js';

// ============================================================================
// TYPES
// ============================================================================

export type NotificationEventType =
  | 'TOPIC_ASSIGNED'
  | 'SCRIPT_SUBMITTED'
  | 'SCRIPT_APPROVED'
  | 'SCRIPT_REJECTED'
  | 'SCRIPT_LOCKED'
  | 'VIDEO_SUBMITTED'
  | 'VIDEO_APPROVED'
  | 'VIDEO_REJECTED'
  | 'VIDEO_LOCKED'
  | 'VIDEO_PUBLISHED';

export interface NotificationEventPayload {
  eventType: NotificationEventType;
  entityId: string; // scriptId, videoId, or topicId
  entityType: 'SCRIPT' | 'VIDEO' | 'TOPIC';
  topicId: string;
  version?: number;
  actorUserId?: string; // Who triggered the event
  actorRole?: UserRole;
  comments?: string;
  nextStage?: string; // For approved events
  deepLink?: string; // For published events
}

export interface NotificationJobData {
  eventType: NotificationEventType;
  recipientIds: string[];
  title: string;
  message: string;
  metadata: Record<string, any>;
  emailSubject?: string;
  emailHtml?: string;
}

// ============================================================================
// NOTIFICATION SERVICE
// ============================================================================

export class NotificationService {
  /**
   * Enqueue a notification event
   * This is the main entry point - called from workflow service
   */
  static async enqueueEvent(payload: NotificationEventPayload): Promise<void> {
    try {
      // Build notification job data based on event type
      const jobData = await this.buildNotificationJob(payload);
      
      if (!jobData) {
        console.warn(`⚠️ No notification job created for event: ${payload.eventType}`);
        return;
      }

      // Add job to queue
      await notificationQueue.add('send-notification', jobData, {
        priority: 1,
      });

      console.log(`📬 Notification event queued: ${payload.eventType} for ${jobData.recipientIds.length} recipients`);
    } catch (error: any) {
      console.error(`❌ Failed to enqueue notification event ${payload.eventType}:`, error);
      // Don't throw - notifications shouldn't break workflow
    }
  }



  /**
   * Build notification job data based on event type
   */
  private static async buildNotificationJob(
    payload: NotificationEventPayload
  ): Promise<NotificationJobData | null> {
    switch (payload.eventType) {
      case 'TOPIC_ASSIGNED':
        return await this.buildTopicAssignedNotification(payload);
      case 'SCRIPT_SUBMITTED':
        return await this.buildScriptSubmittedNotification(payload);
      case 'SCRIPT_APPROVED':
        return await this.buildScriptApprovedNotification(payload);
      case 'SCRIPT_REJECTED':
        return await this.buildScriptRejectedNotification(payload);
      case 'SCRIPT_LOCKED':
        return await this.buildScriptLockedNotification(payload);
      case 'VIDEO_SUBMITTED':
        return await this.buildVideoSubmittedNotification(payload);
      case 'VIDEO_APPROVED':
        return await this.buildVideoApprovedNotification(payload);
      case 'VIDEO_REJECTED':
        return await this.buildVideoRejectedNotification(payload);
      case 'VIDEO_LOCKED':
        return await this.buildVideoLockedNotification(payload);
      case 'VIDEO_PUBLISHED':
        return await this.buildVideoPublishedNotification(payload);
      default:
        return null;
    }
  }

  /**
   * Topic Assigned - Notify Doctor
   */
  private static async buildTopicAssignedNotification(
    payload: NotificationEventPayload
  ): Promise<NotificationJobData | null> {
    const prisma = (await import('../../prisma/client.js')).default;

    try {
      const topic = await prisma.topic.findUnique({
        where: { id: payload.topicId },
        include: {
          assignedDoctor: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });

      if (!topic || !topic.assignedDoctor) {
        return null;
      }

      return {
        eventType: 'TOPIC_ASSIGNED',
        recipientIds: [topic.assignedDoctor.id],
        title: 'New Topic Assigned',
        message: `A new topic has been assigned to you: ${topic.title}`,
        metadata: {
          topicId: payload.topicId,
          action: 'TOPIC_ASSIGNED',
        },
        emailSubject: `New Topic Assigned: ${topic.title}`,
        emailHtml: `
          <h2>New Topic Assigned</h2>
          <p>Hello ${topic.assignedDoctor.firstName},</p>
          <p>A new topic has been assigned to you:</p>
          <ul>
            <li><strong>Topic:</strong> ${topic.title}</li>
          </ul>
          <p>Please review the topic and provide your input.</p>
        `,
      };
    } catch (error) {
      console.error('Error building topic assigned notification:', error);
      return null;
    }
  }

  /**
   * Script Submitted - Notify Medical Reviewers
   */
  private static async buildScriptSubmittedNotification(
    payload: NotificationEventPayload
  ): Promise<NotificationJobData | null> {
    const prisma = (await import('../../prisma/client.js')).default;

    try {
      const script = await prisma.script.findUnique({
        where: { id: payload.entityId },
        include: { topic: true },
      });

      if (!script) return null;

      const reviewers = await prisma.user.findMany({
        where: {
          role: UserRole.MEDICAL_AFFAIRS,
          status: UserStatus.ACTIVE,
        },
        select: { id: true, firstName: true, lastName: true },
      });

      if (reviewers.length === 0) {
        console.warn('⚠️ No medical reviewers found for script notification');
        return null;
      }

      return {
        eventType: 'SCRIPT_SUBMITTED',
        recipientIds: reviewers.map((r) => r.id),
        title: 'Script Submitted for Review',
        message: `A new script has been submitted for review: ${script.topic.title} (v${script.version})`,
        metadata: {
          scriptId: payload.entityId,
          topicId: payload.topicId,
          version: script.version,
          action: 'SCRIPT_SUBMITTED',
        },
        emailSubject: `Script Submitted: ${script.topic.title}`,
        emailHtml: `
          <h2>Script Submitted for Review</h2>
          <p>Hello,</p>
          <p>A new script has been submitted for your review:</p>
          <ul>
            <li><strong>Topic:</strong> ${script.topic.title}</li>
            <li><strong>Version:</strong> ${script.version}</li>
          </ul>
          <p>Please review the script and provide your feedback.</p>
        `,
      };
    } catch (error) {
      console.error('Error building script submitted notification:', error);
      return null;
    }
  }

  /**
   * Script Approved - Notify next stage reviewers + Agency
   */
  private static async buildScriptApprovedNotification(
    payload: NotificationEventPayload
  ): Promise<NotificationJobData | null> {
    const prisma = (await import('../../prisma/client.js')).default;

    try {
      const script = await prisma.script.findUnique({
        where: { id: payload.entityId },
        include: {
          topic: {
            include: {
              assignedDoctor: { select: { id: true, firstName: true, lastName: true } },
            },
          },
          uploadedBy: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      if (!script) return null;

      const actor = payload.actorUserId
        ? await prisma.user.findUnique({
            where: { id: payload.actorUserId },
            select: { firstName: true, lastName: true },
          })
        : null;

      const actorName = actor ? `${actor.firstName} ${actor.lastName}` : 'Reviewer';

      // Find next stage reviewers
      let nextReviewers: any[] = [];
      const nextStageStr = String(payload.nextStage || '');
      if (nextStageStr.includes('BRAND_REVIEW')) {
        nextReviewers = await prisma.user.findMany({
          where: { role: UserRole.BRAND_REVIEWER, status: UserStatus.ACTIVE },
          select: { id: true, firstName: true, lastName: true },
        });
      } else if (nextStageStr.includes('DOCTOR_REVIEW') && script.topic.assignedDoctor) {
        nextReviewers = [script.topic.assignedDoctor];
      }

      // Notify agency POC
      const agencyPOCs = script.uploadedBy
        ? [script.uploadedBy]
        : await prisma.user.findMany({
            where: { role: UserRole.AGENCY_POC, status: UserStatus.ACTIVE },
            select: { id: true, firstName: true, lastName: true },
          });

      const allRecipients = [
        ...nextReviewers.map((r) => r.id),
        ...agencyPOCs.map((r) => r.id),
      ];

      if (allRecipients.length === 0) return null;

      return {
        eventType: 'SCRIPT_APPROVED',
        recipientIds: allRecipients,
        title: 'Script Approved',
        message: `Script "${script.topic.title}" has been approved and moved to ${payload.nextStage || 'next stage'}`,
        metadata: {
          scriptId: payload.entityId,
          topicId: payload.topicId,
          version: script.version,
          action: 'SCRIPT_APPROVED',
          nextStage: payload.nextStage,
        },
        emailSubject: `Script Approved: ${script.topic.title}`,
        emailHtml: `
          <h2>Script Approved</h2>
          <p>The script has been approved by ${actorName}:</p>
          <ul>
            <li><strong>Topic:</strong> ${script.topic.title}</li>
            <li><strong>Version:</strong> ${script.version}</li>
          </ul>
          <p>The script will now proceed to the next review stage: ${payload.nextStage || 'next stage'}</p>
        `,
      };
    } catch (error) {
      console.error('Error building script submitted notification:', error);
      return null;
    }
  }

  /**
   * Script Rejected - Notify Agency POC
   */
  private static async buildScriptRejectedNotification(
    payload: NotificationEventPayload
  ): Promise<NotificationJobData | null> {
    const prisma = (await import('../../prisma/client.js')).default;

    try {
      const script = await prisma.script.findUnique({
        where: { id: payload.entityId },
        include: {
          topic: true,
          uploadedBy: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      if (!script) return null;

      const actor = payload.actorUserId
        ? await prisma.user.findUnique({
            where: { id: payload.actorUserId },
            select: { firstName: true, lastName: true },
          })
        : null;

      const actorName = actor ? `${actor.firstName} ${actor.lastName}` : 'Reviewer';

      // Notify agency POC
      const agencyPOCs = script.uploadedBy
        ? [script.uploadedBy]
        : await prisma.user.findMany({
            where: { role: UserRole.AGENCY_POC, status: UserStatus.ACTIVE },
            select: { id: true, firstName: true, lastName: true },
          });

      if (agencyPOCs.length === 0) return null;

      return {
        eventType: 'SCRIPT_REJECTED',
        recipientIds: agencyPOCs.map((poc) => poc.id),
        title: 'Script Rejected - Action Required',
        message: `Script "${script.topic.title}" has been rejected. Please review feedback and submit a new version.`,
        metadata: {
          scriptId: payload.entityId,
          topicId: payload.topicId,
          version: script.version,
          action: 'SCRIPT_REJECTED',
          reviewerId: payload.actorUserId,
          comments: payload.comments,
        },
        emailSubject: `Script Rejected: ${script.topic.title}`,
        emailHtml: `
          <h2>Script Rejected - Action Required</h2>
          <p>The script has been rejected and requires your attention:</p>
          <ul>
            <li><strong>Topic:</strong> ${script.topic.title}</li>
            <li><strong>Version:</strong> ${script.version}</li>
            <li><strong>Rejected by:</strong> ${actorName}</li>
          </ul>
          ${payload.comments ? `
            <div style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
              <strong>Feedback:</strong>
              <p>${payload.comments}</p>
            </div>
          ` : ''}
          <p>Please review the feedback and submit a new version.</p>
        `,
      };
    } catch (error) {
      console.error('Error building script submitted notification:', error);
      return null;
    }
  }

  /**
   * Script Locked - Notify all stakeholders
   */
  private static async buildScriptLockedNotification(
    payload: NotificationEventPayload
  ): Promise<NotificationJobData | null> {
    const prisma = (await import('../../prisma/client.js')).default;

    try {
      const script = await prisma.script.findUnique({
        where: { id: payload.entityId },
        include: {
          topic: {
            include: {
              assignedDoctor: { select: { id: true } },
            },
          },
          uploadedBy: { select: { id: true } },
        },
      });

      if (!script) return null;

      const stakeholders: string[] = [];

      if (script.topic.assignedDoctor) {
        stakeholders.push(script.topic.assignedDoctor.id);
      }
      if (script.uploadedBy) {
        stakeholders.push(script.uploadedBy.id);
      }

      // Get all reviewers
      const reviews = await prisma.scriptReview.findMany({
        where: { scriptId: payload.entityId },
        select: { reviewerId: true },
        distinct: ['reviewerId'],
      });

      reviews.forEach((review) => {
        if (!stakeholders.includes(review.reviewerId)) {
          stakeholders.push(review.reviewerId);
        }
      });

      if (stakeholders.length === 0) return null;

      return {
        eventType: 'SCRIPT_LOCKED',
        recipientIds: stakeholders,
        title: 'Script Locked - Ready for Video Production',
        message: `Script "${script.topic.title}" has been locked and is ready for video production.`,
        metadata: {
          scriptId: payload.entityId,
          topicId: payload.topicId,
          version: script.version,
          action: 'SCRIPT_LOCKED',
        },
        emailSubject: `Script Locked: ${script.topic.title}`,
        emailHtml: `
          <h2>Script Locked - Ready for Video Production</h2>
          <p>The script has been locked and is ready for video production:</p>
          <ul>
            <li><strong>Topic:</strong> ${script.topic.title}</li>
            <li><strong>Version:</strong> ${script.version}</li>
          </ul>
          <p>You can now proceed with video production.</p>
        `,
      };
    } catch (error) {
      console.error('Error building script submitted notification:', error);
      return null;
    }
  }

  /**
   * Video Submitted - Notify Brand Reviewers
   */
  private static async buildVideoSubmittedNotification(
    payload: NotificationEventPayload
  ): Promise<NotificationJobData | null> {
    const prisma = (await import('../../prisma/client.js')).default;

    try {
      const video = await prisma.video.findUnique({
        where: { id: payload.entityId },
        include: { topic: true },
      });

      if (!video) return null;

      const reviewers = await prisma.user.findMany({
        where: {
          role: UserRole.BRAND_REVIEWER,
          status: UserStatus.ACTIVE,
        },
        select: { id: true, firstName: true, lastName: true },
      });

      if (reviewers.length === 0) {
        console.warn('⚠️ No brand reviewers found for video notification');
        return null;
      }

      return {
        eventType: 'VIDEO_SUBMITTED',
        recipientIds: reviewers.map((r) => r.id),
        title: 'Video Submitted for Review',
        message: `A new video has been submitted for review: ${video.topic.title} (v${video.version})`,
        metadata: {
          videoId: payload.entityId,
          topicId: payload.topicId,
          version: video.version,
          action: 'VIDEO_SUBMITTED',
        },
        emailSubject: `Video Submitted: ${video.topic.title}`,
        emailHtml: `
          <h2>Video Submitted for Review</h2>
          <p>A new video has been submitted for your review:</p>
          <ul>
            <li><strong>Topic:</strong> ${video.topic.title}</li>
            <li><strong>Version:</strong> ${video.version}</li>
          </ul>
          <p>Please review the video and provide your feedback.</p>
        `,
      };
    } catch (error) {
      console.error('Error building script submitted notification:', error);
      return null;
    }
  }

  /**
   * Video Approved - Notify next stage reviewers + Agency
   */
  private static async buildVideoApprovedNotification(
    payload: NotificationEventPayload
  ): Promise<NotificationJobData | null> {
    const prisma = (await import('../../prisma/client.js')).default;

    try {
      const video = await prisma.video.findUnique({
        where: { id: payload.entityId },
        include: {
          topic: {
            include: {
              assignedDoctor: { select: { id: true, firstName: true, lastName: true } },
            },
          },
          uploadedBy: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      if (!video) return null;

      const actor = payload.actorUserId
        ? await prisma.user.findUnique({
            where: { id: payload.actorUserId },
            select: { firstName: true, lastName: true },
          })
        : null;

      const actorName = actor ? `${actor.firstName} ${actor.lastName}` : 'Reviewer';

      // Find next stage reviewers
      let nextReviewers: any[] = [];
      const nextStageStr = String(payload.nextStage || '');
      if (nextStageStr.includes('MEDICAL_REVIEW')) {
        nextReviewers = await prisma.user.findMany({
          where: { role: UserRole.MEDICAL_REVIEWER, status: UserStatus.ACTIVE },
          select: { id: true, firstName: true, lastName: true },
        });
      } else if (nextStageStr.includes('DOCTOR_REVIEW') && video.topic.assignedDoctor) {
        nextReviewers = [video.topic.assignedDoctor];
      }

      // Notify agency POC
      const agencyPOCs = video.uploadedBy
        ? [video.uploadedBy]
        : await prisma.user.findMany({
            where: { role: UserRole.AGENCY_POC, status: UserStatus.ACTIVE },
            select: { id: true, firstName: true, lastName: true },
          });

      const allRecipients = [
        ...nextReviewers.map((r) => r.id),
        ...agencyPOCs.map((r) => r.id),
      ];

      if (allRecipients.length === 0) return null;

      return {
        eventType: 'VIDEO_APPROVED',
        recipientIds: allRecipients,
        title: 'Video Approved',
        message: `Video "${video.topic.title}" has been approved and moved to ${payload.nextStage || 'next stage'}`,
        metadata: {
          videoId: payload.entityId,
          topicId: payload.topicId,
          version: video.version,
          action: 'VIDEO_APPROVED',
          nextStage: payload.nextStage,
        },
        emailSubject: `Video Approved: ${video.topic.title}`,
        emailHtml: `
          <h2>Video Approved</h2>
          <p>The video has been approved by ${actorName}:</p>
          <ul>
            <li><strong>Topic:</strong> ${video.topic.title}</li>
            <li><strong>Version:</strong> ${video.version}</li>
          </ul>
          <p>The video will now proceed to the next review stage: ${payload.nextStage || 'next stage'}</p>
        `,
      };
    } catch (error) {
      console.error('Error building script submitted notification:', error);
      return null;
    }
  }

  /**
   * Video Rejected - Notify Agency POC
   */
  private static async buildVideoRejectedNotification(
    payload: NotificationEventPayload
  ): Promise<NotificationJobData | null> {
    const prisma = (await import('../../prisma/client.js')).default;

    try {
      const video = await prisma.video.findUnique({
        where: { id: payload.entityId },
        include: {
          topic: true,
          uploadedBy: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      if (!video) return null;

      const actor = payload.actorUserId
        ? await prisma.user.findUnique({
            where: { id: payload.actorUserId },
            select: { firstName: true, lastName: true },
          })
        : null;

      const actorName = actor ? `${actor.firstName} ${actor.lastName}` : 'Reviewer';

      // Notify agency POC
      const agencyPOCs = video.uploadedBy
        ? [video.uploadedBy]
        : await prisma.user.findMany({
            where: { role: UserRole.AGENCY_POC, status: UserStatus.ACTIVE },
            select: { id: true, firstName: true, lastName: true },
          });

      if (agencyPOCs.length === 0) return null;

      return {
        eventType: 'VIDEO_REJECTED',
        recipientIds: agencyPOCs.map((poc) => poc.id),
        title: 'Video Rejected - Action Required',
        message: `Video "${video.topic.title}" has been rejected. Please review feedback and submit a new version.`,
        metadata: {
          videoId: payload.entityId,
          topicId: payload.topicId,
          version: video.version,
          action: 'VIDEO_REJECTED',
          reviewerId: payload.actorUserId,
          comments: payload.comments,
        },
        emailSubject: `Video Rejected: ${video.topic.title}`,
        emailHtml: `
          <h2>Video Rejected - Action Required</h2>
          <p>The video has been rejected and requires your attention:</p>
          <ul>
            <li><strong>Topic:</strong> ${video.topic.title}</li>
            <li><strong>Version:</strong> ${video.version}</li>
            <li><strong>Rejected by:</strong> ${actorName}</li>
          </ul>
          ${payload.comments ? `
            <div style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
              <strong>Feedback:</strong>
              <p>${payload.comments}</p>
            </div>
          ` : ''}
          <p>Please review the feedback and submit a new version.</p>
        `,
      };
    } catch (error) {
      console.error('Error building script submitted notification:', error);
      return null;
    }
  }

  /**
   * Video Locked - Notify all stakeholders
   */
  private static async buildVideoLockedNotification(
    payload: NotificationEventPayload
  ): Promise<NotificationJobData | null> {
    const prisma = (await import('../../prisma/client.js')).default;

    try {
      const video = await prisma.video.findUnique({
        where: { id: payload.entityId },
        include: {
          topic: {
            include: {
              assignedDoctor: { select: { id: true } },
            },
          },
          uploadedBy: { select: { id: true } },
        },
      });

      if (!video) return null;

      const stakeholders: string[] = [];

      if (video.topic.assignedDoctor) {
        stakeholders.push(video.topic.assignedDoctor.id);
      }
      if (video.uploadedBy) {
        stakeholders.push(video.uploadedBy.id);
      }

      // Get all reviewers
      const reviews = await prisma.videoReview.findMany({
        where: { videoId: payload.entityId },
        select: { reviewerId: true },
        distinct: ['reviewerId'],
      });

      reviews.forEach((review) => {
        if (!stakeholders.includes(review.reviewerId)) {
          stakeholders.push(review.reviewerId);
        }
      });

      if (stakeholders.length === 0) return null;

      return {
        eventType: 'VIDEO_LOCKED',
        recipientIds: stakeholders,
        title: 'Video Locked - Ready for Publishing',
        message: `Video "${video.topic.title}" has been locked and is ready for publishing.`,
        metadata: {
          videoId: payload.entityId,
          topicId: payload.topicId,
          version: video.version,
          action: 'VIDEO_LOCKED',
        },
        emailSubject: `Video Locked: ${video.topic.title}`,
        emailHtml: `
          <h2>Video Locked - Ready for Publishing</h2>
          <p>The video has been locked and is ready for publishing:</p>
          <ul>
            <li><strong>Topic:</strong> ${video.topic.title}</li>
            <li><strong>Version:</strong> ${video.version}</li>
          </ul>
          <p>The video is now available for publishing to Practo Hub.</p>
        `,
      };
    } catch (error) {
      console.error('Error building script submitted notification:', error);
      return null;
    }
  }

  /**
   * Video Published - Notify Doctor
   */
  private static async buildVideoPublishedNotification(
    payload: NotificationEventPayload
  ): Promise<NotificationJobData | null> {
    const prisma = (await import('../../prisma/client.js')).default;

    try {
      const video = await prisma.video.findUnique({
        where: { id: payload.entityId },
        include: {
          topic: {
            include: {
              assignedDoctor: {
                select: { id: true, firstName: true, lastName: true, email: true },
              },
            },
          },
        },
      });

      if (!video || !video.topic.assignedDoctor) return null;

      return {
        eventType: 'VIDEO_PUBLISHED',
        recipientIds: [video.topic.assignedDoctor.id],
        title: 'Video Published Successfully',
        message: `Your video "${video.topic.title}" has been published to Practo Hub.`,
        metadata: {
          videoId: payload.entityId,
          topicId: payload.topicId,
          version: video.version,
          action: 'VIDEO_PUBLISHED',
          deepLink: payload.deepLink,
        },
        emailSubject: `Video Published: ${video.topic.title}`,
        emailHtml: `
          <h2>Video Published Successfully</h2>
          <p>Hello ${video.topic.assignedDoctor.firstName},</p>
          <p>Your video has been successfully published to Practo Hub:</p>
          <ul>
            <li><strong>Topic:</strong> ${video.topic.title}</li>
            <li><strong>Version:</strong> ${video.version}</li>
          </ul>
          <p>Thank you for your contribution!</p>
          ${payload.deepLink ? `<p><a href="${payload.deepLink}">View on Practo Hub</a></p>` : ''}
        `,
      };
    } catch (error) {
      console.error('Error building script submitted notification:', error);
      return null;
    }
  }
}

export default NotificationService;

