/**
 * Workflow Service - Complete State Machine Implementation
 * 
 * Handles all workflow transitions for Scripts and Videos with:
 * - State validation
 * - Role-based authorization
 * - ONE-STEP-BACK rejection logic
 * - Audit logging
 * - Review record creation
 */

import prisma from '../prisma/client.js';
import { 
  ScriptStatus, 
  VideoStatus, 
  UserRole, 
  ReviewDecision 
} from '../generated/prisma/index.js';
import { 
  SCRIPT_TRANSITIONS, 
  VIDEO_TRANSITIONS,
  LOCK_PERMISSIONS,
  type ScriptAction,
  type VideoAction,
  isValidScriptTransition,
  isValidVideoTransition
} from '../config/constants.js';

// ============================================================================
// TYPES
// ============================================================================

export interface TransitionResult {
  success: boolean;
  data?: any;
  error?: string | undefined;
}

interface TransitionContext {
  userId: string;
  userRole: UserRole;
  comments?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

// ============================================================================
// WORKFLOW SERVICE CLASS
// ============================================================================

export class WorkflowService {
  
  // ========================================================================
  // SCRIPT WORKFLOW
  // ========================================================================
  
  /**
   * Transition a script through the workflow
   */
  static async transitionScript(
    scriptId: string,
    action: ScriptAction,
    context: TransitionContext
  ): Promise<TransitionResult> {
    try {
      // 1. Load current script
      const script = await prisma.script.findUnique({
        where: { id: scriptId },
        include: { topic: true }
      });
      
      if (!script) {
        return { success: false, error: 'Script not found' };
      }
      
      // 2. Validate transition
      const validation = isValidScriptTransition(
        script.status,
        action,
        context.userRole
      );
      
      if (!validation.valid) {
        return { success: false, error: validation.error ?? 'Unknown validation error' };
      }
      
      const nextState = validation.nextState!;
      const currentState = script.status;
      
      // 3. Execute transition in transaction
      const result = await prisma.$transaction(async (tx) => {
        // Update script status + CLEAR ASSIGNMENT (next stage = new reviewer pool)
        const updatedScript = await tx.script.update({
          where: { id: scriptId },
          data: { 
            status: nextState,
            updatedAt: new Date(),
            // Clear assignment so next reviewer can claim it
            assignedReviewerId: null,
            assignedAt: null
          },
          include: {
            topic: true,
            uploadedBy: {
              select: { id: true, firstName: true, lastName: true, email: true }
            }
          }
        });
        
        // Create review record (for APPROVE/REJECT actions)
        if (action === 'APPROVE' || action === 'REJECT') {
          await tx.scriptReview.create({
            data: {
              scriptId: scriptId,
              reviewerId: context.userId,
              reviewerType: context.userRole,
              decision: action === 'APPROVE' ? ReviewDecision.APPROVED : ReviewDecision.REJECTED,
              comments: context.comments ?? null,
              reviewedAt: new Date()
            }
          });
        }
        
        // Create audit log
        await tx.auditLog.create({
          data: {
            userId: context.userId,
            action: `${action}_SCRIPT`,
            entityType: 'SCRIPT',
            entityId: scriptId,
            oldValue: { status: currentState },
            newValue: { status: nextState },
            ipAddress: context.ipAddress ?? null,
            userAgent: context.userAgent ?? null
          }
        });
        
        return updatedScript;
      });
      
      return { success: true, data: result };
      
    } catch (error: any) {
      console.error('Script transition error:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Lock a script (Content Approver only - after Doctor has approved)
   */
  static async lockScript(
    scriptId: string,
    context: TransitionContext
  ): Promise<TransitionResult> {
    try {
      // Verify lock permission
      if (!(LOCK_PERMISSIONS.CAN_LOCK_SCRIPT as UserRole[]).includes(context.userRole)) {
      return {
          success: false, 
          error: 'Only Content Approver or Super Admin can lock scripts' 
        };
      }
      
      const script = await prisma.script.findUnique({
        where: { id: scriptId }
      });
      
      if (!script) {
        return { success: false, error: 'Script not found' };
      }
      
      // Script must be in APPROVED state (doctor has approved, waiting for lock)
      if (script.status !== ScriptStatus.APPROVED) {
      return {
          success: false, 
          error: `Script must be in APPROVED state to lock. Current: ${script.status}. Doctor must approve first.` 
        };
      }
      
      // Lock the script
      const result = await prisma.$transaction(async (tx) => {
        const updatedScript = await tx.script.update({
          where: { id: scriptId },
          data: {
            status: ScriptStatus.LOCKED,
            lockedById: context.userId,
            lockedAt: new Date()
          }
        });
        
        // Create audit log
        await tx.auditLog.create({
          data: {
            userId: context.userId,
            action: 'LOCK_SCRIPT',
            entityType: 'SCRIPT',
            entityId: scriptId,
            oldValue: { status: ScriptStatus.APPROVED },
            newValue: { status: ScriptStatus.LOCKED, lockedById: context.userId },
            ipAddress: context.ipAddress ?? null,
            userAgent: context.userAgent ?? null
          }
        });
        
        return updatedScript;
      });
      
      return { success: true, data: result };
      
    } catch (error: any) {
      console.error('Lock script error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Unlock a script (Super Admin only - emergency)
   */
  static async unlockScript(
    scriptId: string,
    context: TransitionContext
  ): Promise<TransitionResult> {
    try {
      if (!(LOCK_PERMISSIONS.CAN_UNLOCK as UserRole[]).includes(context.userRole)) {
        return { 
          success: false, 
          error: 'Only Super Admin can unlock scripts' 
        };
      }
      
      const script = await prisma.script.findUnique({
        where: { id: scriptId }
      });
      
      if (!script) {
        return { success: false, error: 'Script not found' };
      }
      
      if (script.status !== ScriptStatus.LOCKED) {
      return {
          success: false, 
          error: `Script is not locked. Current status: ${script.status}` 
        };
      }
      
      const result = await prisma.$transaction(async (tx) => {
        const updatedScript = await tx.script.update({
          where: { id: scriptId },
          data: {
            status: ScriptStatus.APPROVED, // Back to approved state
            lockedById: null,
            lockedAt: null
          }
        });
        
        await tx.auditLog.create({
          data: {
            userId: context.userId,
            action: 'EMERGENCY_UNLOCK_SCRIPT',
            entityType: 'SCRIPT',
            entityId: scriptId,
            oldValue: { status: ScriptStatus.LOCKED },
            newValue: { status: ScriptStatus.APPROVED },
            ipAddress: context.ipAddress ?? null,
            userAgent: context.userAgent ?? null
          }
        });
        
        return updatedScript;
      });
      
      return { success: true, data: result };
      
    } catch (error: any) {
      console.error('Unlock script error:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ========================================================================
  // VIDEO WORKFLOW
  // ========================================================================
  
  /**
   * Transition a video through the workflow
   */
  static async transitionVideo(
    videoId: string,
    action: VideoAction,
    context: TransitionContext
  ): Promise<TransitionResult> {
    try {
      // 1. Load current video
      const video = await prisma.video.findUnique({
        where: { id: videoId },
        include: { topic: true, script: true }
      });
      
      if (!video) {
        return { success: false, error: 'Video not found' };
      }
      
      // 2. Validate transition
      const validation = isValidVideoTransition(
        video.status,
        action,
        context.userRole
      );
      
      if (!validation.valid) {
        return { success: false, error: validation.error ?? 'Unknown validation error' };
      }
      
      const nextState = validation.nextState!;
      const currentState = video.status;
      
      // 3. Execute transition in transaction
      const result = await prisma.$transaction(async (tx) => {
        // Build update data + CLEAR ASSIGNMENT (next stage = new reviewer pool)
        const updateData: any = { 
          status: nextState,
          updatedAt: new Date(),
          // Clear assignment so next reviewer can claim it
          assignedReviewerId: null,
          assignedAt: null
        };
        
        // Special handling for PUBLISH action
        if (action === 'PUBLISH') {
          updateData.publishedAt = new Date();
          updateData.publishedById = context.userId;
          updateData.deepLink = `practo://hub/video/${videoId}`;
        }
        
        // Update video status
        const updatedVideo = await tx.video.update({
          where: { id: videoId },
          data: updateData,
          include: {
            topic: true,
            script: true,
            uploadedBy: {
              select: { id: true, firstName: true, lastName: true, email: true }
            }
          }
        });
        
        // Create review record (for APPROVE/REJECT actions)
        if (action === 'APPROVE' || action === 'REJECT') {
          await tx.videoReview.create({
            data: {
              videoId: videoId,
              reviewerId: context.userId,
              reviewerType: context.userRole,
              decision: action === 'APPROVE' ? ReviewDecision.APPROVED : ReviewDecision.REJECTED,
              comments: context.comments ?? null,
              reviewedAt: new Date()
            }
          });
        }
        
        // Create audit log
        await tx.auditLog.create({
          data: {
            userId: context.userId,
            action: `${action}_VIDEO`,
            entityType: 'VIDEO',
            entityId: videoId,
            oldValue: { status: currentState },
            newValue: { status: nextState },
            ipAddress: context.ipAddress ?? null,
            userAgent: context.userAgent ?? null
          }
        });
        
        // Create analytics record on publish
        if (action === 'PUBLISH') {
          await tx.videoAnalytics.upsert({
            where: { videoId: videoId },
            create: { videoId: videoId },
            update: {}
          });
        }
        
        return updatedVideo;
      });
      
      return { success: true, data: result };
      
    } catch (error: any) {
      console.error('Video transition error:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Lock a video (Content Approver only - after Doctor has approved)
   */
  static async lockVideo(
    videoId: string,
    context: TransitionContext
  ): Promise<TransitionResult> {
    try {
      if (!(LOCK_PERMISSIONS.CAN_LOCK_VIDEO as UserRole[]).includes(context.userRole)) {
        return { 
          success: false, 
          error: 'Only Content Approver or Super Admin can lock videos' 
        };
      }
      
      const video = await prisma.video.findUnique({
        where: { id: videoId }
      });
      
      if (!video) {
        return { success: false, error: 'Video not found' };
      }
      
      // Video must be in APPROVED state (doctor has approved, waiting for lock)
      if (video.status !== VideoStatus.APPROVED) {
      return {
          success: false, 
          error: `Video must be in APPROVED state to lock. Current: ${video.status}. Doctor must approve first.` 
        };
      }
      
      const result = await prisma.$transaction(async (tx) => {
        const updatedVideo = await tx.video.update({
          where: { id: videoId },
          data: {
            status: VideoStatus.LOCKED,
            lockedById: context.userId,
            lockedAt: new Date()
          }
        });
        
        await tx.auditLog.create({
          data: {
            userId: context.userId,
            action: 'LOCK_VIDEO',
            entityType: 'VIDEO',
            entityId: videoId,
            oldValue: { status: VideoStatus.APPROVED },
            newValue: { status: VideoStatus.LOCKED, lockedById: context.userId },
            ipAddress: context.ipAddress ?? null,
            userAgent: context.userAgent ?? null
          }
        });
        
        return updatedVideo;
      });
      
      return { success: true, data: result };
      
    } catch (error: any) {
      console.error('Lock video error:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Unlock a video (Super Admin only - emergency)
   */
  static async unlockVideo(
    videoId: string,
    context: TransitionContext
  ): Promise<TransitionResult> {
    try {
      if (!(LOCK_PERMISSIONS.CAN_UNLOCK as UserRole[]).includes(context.userRole)) {
        return { 
          success: false, 
          error: 'Only Super Admin can unlock videos' 
        };
      }
      
      const video = await prisma.video.findUnique({
        where: { id: videoId }
      });
      
      if (!video) {
        return { success: false, error: 'Video not found' };
      }
      
      if (video.status !== VideoStatus.LOCKED) {
        return { 
          success: false, 
          error: `Video is not locked. Current status: ${video.status}` 
        };
      }
      
      const result = await prisma.$transaction(async (tx) => {
        const updatedVideo = await tx.video.update({
          where: { id: videoId },
          data: {
            status: VideoStatus.APPROVED, // Back to approved state
            lockedById: null,
            lockedAt: null
          }
        });
        
        await tx.auditLog.create({
          data: {
            userId: context.userId,
            action: 'EMERGENCY_UNLOCK_VIDEO',
            entityType: 'VIDEO',
            entityId: videoId,
            oldValue: { status: VideoStatus.LOCKED },
            newValue: { status: VideoStatus.APPROVED },
            ipAddress: context.ipAddress ?? null,
            userAgent: context.userAgent ?? null
          }
        });
        
        return updatedVideo;
      });
      
      return { success: true, data: result };
      
    } catch (error: any) {
      console.error('Unlock video error:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ========================================================================
  // CLAIM SYSTEM - Track who is reviewing what
  // ========================================================================
  
  /**
   * Claim a script for review (blocks other reviewers)
   */
  static async claimScript(
    scriptId: string,
    context: TransitionContext
  ): Promise<TransitionResult> {
    try {
      const script = await prisma.script.findUnique({
        where: { id: scriptId },
        include: {
          assignedReviewer: {
            select: { id: true, firstName: true, lastName: true }
          }
        }
      });
      
      if (!script) {
        return { success: false, error: 'Script not found' };
      }
      
      // Check if already claimed by someone else
      if (script.assignedReviewerId && script.assignedReviewerId !== context.userId) {
        const reviewer = script.assignedReviewer;
        return { 
          success: false, 
          error: `Script is already being reviewed by ${reviewer?.firstName} ${reviewer?.lastName}. Please select another script.`
        };
      }
      
      // If already claimed by same user, just return success
      if (script.assignedReviewerId === context.userId) {
        return { success: true, data: script };
      }
      
      // Verify user has permission to review at current stage
      const allowedRoles = this.getRolesForScriptStage(script.status);
      if (!allowedRoles.includes(context.userRole)) {
        return { 
          success: false, 
          error: `Your role (${context.userRole}) cannot review scripts in ${script.status} status`
        };
      }
      
      // Claim the script
      const result = await prisma.script.update({
        where: { id: scriptId },
        data: {
          assignedReviewerId: context.userId,
          assignedAt: new Date()
        },
        include: {
          topic: true,
          uploadedBy: { select: { id: true, firstName: true, lastName: true } },
          assignedReviewer: { select: { id: true, firstName: true, lastName: true } }
        }
      });
      
      // Log the claim action
      await prisma.auditLog.create({
        data: {
          userId: context.userId,
          action: 'CLAIM_SCRIPT',
          entityType: 'SCRIPT',
          entityId: scriptId,
          oldValue: { assignedReviewerId: null },
          newValue: { assignedReviewerId: context.userId },
          ipAddress: context.ipAddress ?? null,
          userAgent: context.userAgent ?? null
        }
      });
      
      return { success: true, data: result };
      
    } catch (error: any) {
      console.error('Claim script error:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Release a claimed script (back to pool)
   */
  static async releaseScript(
    scriptId: string,
    context: TransitionContext
  ): Promise<TransitionResult> {
    try {
      const script = await prisma.script.findUnique({
        where: { id: scriptId }
      });
      
      if (!script) {
        return { success: false, error: 'Script not found' };
      }
      
      // Only the assigned reviewer or admin can release
      if (script.assignedReviewerId !== context.userId && 
          context.userRole !== UserRole.SUPER_ADMIN) {
        return { 
          success: false, 
          error: 'Only the assigned reviewer or Super Admin can release this script'
        };
      }
      
      const previousReviewerId = script.assignedReviewerId;
      
      const result = await prisma.script.update({
        where: { id: scriptId },
        data: {
          assignedReviewerId: null,
          assignedAt: null
        },
        include: {
          topic: true,
          uploadedBy: { select: { id: true, firstName: true, lastName: true } }
        }
      });
      
      // Log the release action
      await prisma.auditLog.create({
        data: {
          userId: context.userId,
          action: context.userRole === UserRole.SUPER_ADMIN && previousReviewerId !== context.userId 
            ? 'FORCE_RELEASE_SCRIPT' 
            : 'RELEASE_SCRIPT',
          entityType: 'SCRIPT',
          entityId: scriptId,
          oldValue: { assignedReviewerId: previousReviewerId },
          newValue: { assignedReviewerId: null },
          ipAddress: context.ipAddress ?? null,
          userAgent: context.userAgent ?? null
        }
      });
      
      return { success: true, data: result };
      
    } catch (error: any) {
      console.error('Release script error:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Claim a video for review (blocks other reviewers)
   */
  static async claimVideo(
    videoId: string,
    context: TransitionContext
  ): Promise<TransitionResult> {
    try {
      const video = await prisma.video.findUnique({
        where: { id: videoId },
        include: {
          assignedReviewer: {
            select: { id: true, firstName: true, lastName: true }
          }
        }
      });
      
      if (!video) {
        return { success: false, error: 'Video not found' };
      }
      
      // Check if already claimed by someone else
      if (video.assignedReviewerId && video.assignedReviewerId !== context.userId) {
        const reviewer = video.assignedReviewer;
        return { 
          success: false, 
          error: `Video is already being reviewed by ${reviewer?.firstName} ${reviewer?.lastName}. Please select another video.`
        };
      }
      
      // If already claimed by same user, just return success
      if (video.assignedReviewerId === context.userId) {
        return { success: true, data: video };
      }
      
      // Verify user has permission to review at current stage
      const allowedRoles = this.getRolesForVideoStage(video.status);
      if (!allowedRoles.includes(context.userRole)) {
        return { 
          success: false, 
          error: `Your role (${context.userRole}) cannot review videos in ${video.status} status`
        };
      }
      
      // Claim the video
      const result = await prisma.video.update({
        where: { id: videoId },
        data: {
          assignedReviewerId: context.userId,
          assignedAt: new Date()
        },
        include: {
          topic: true,
          script: true,
          uploadedBy: { select: { id: true, firstName: true, lastName: true } },
          assignedReviewer: { select: { id: true, firstName: true, lastName: true } }
        }
      });
      
      // Log the claim action
      await prisma.auditLog.create({
        data: {
          userId: context.userId,
          action: 'CLAIM_VIDEO',
          entityType: 'VIDEO',
          entityId: videoId,
          oldValue: { assignedReviewerId: null },
          newValue: { assignedReviewerId: context.userId },
          ipAddress: context.ipAddress ?? null,
          userAgent: context.userAgent ?? null
        }
      });
      
      return { success: true, data: result };
      
    } catch (error: any) {
      console.error('Claim video error:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Release a claimed video (back to pool)
   */
  static async releaseVideo(
    videoId: string,
    context: TransitionContext
  ): Promise<TransitionResult> {
    try {
      const video = await prisma.video.findUnique({
        where: { id: videoId }
      });
      
      if (!video) {
        return { success: false, error: 'Video not found' };
      }
      
      // Only the assigned reviewer or admin can release
      if (video.assignedReviewerId !== context.userId && 
          context.userRole !== UserRole.SUPER_ADMIN) {
        return { 
          success: false, 
          error: 'Only the assigned reviewer or Super Admin can release this video'
        };
      }
      
      const previousReviewerId = video.assignedReviewerId;
      
      const result = await prisma.video.update({
        where: { id: videoId },
        data: {
          assignedReviewerId: null,
          assignedAt: null
        },
        include: {
          topic: true,
          script: true,
          uploadedBy: { select: { id: true, firstName: true, lastName: true } }
        }
      });
      
      // Log the release action
      await prisma.auditLog.create({
        data: {
          userId: context.userId,
          action: context.userRole === UserRole.SUPER_ADMIN && previousReviewerId !== context.userId 
            ? 'FORCE_RELEASE_VIDEO' 
            : 'RELEASE_VIDEO',
          entityType: 'VIDEO',
          entityId: videoId,
          oldValue: { assignedReviewerId: previousReviewerId },
          newValue: { assignedReviewerId: null },
          ipAddress: context.ipAddress ?? null,
          userAgent: context.userAgent ?? null
        }
      });
      
      return { success: true, data: result };
      
    } catch (error: any) {
      console.error('Release video error:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Helper: Get roles that can review at a script stage
   */
  private static getRolesForScriptStage(status: ScriptStatus): UserRole[] {
    switch (status) {
      case ScriptStatus.MEDICAL_REVIEW:
        return [UserRole.MEDICAL_REVIEWER, UserRole.SUPER_ADMIN];
      case ScriptStatus.BRAND_REVIEW:
        return [UserRole.BRAND_REVIEWER, UserRole.SUPER_ADMIN];
      case ScriptStatus.DOCTOR_REVIEW:
        return [UserRole.DOCTOR_CREATOR, UserRole.SUPER_ADMIN];
      case ScriptStatus.APPROVED:
        return [UserRole.CONTENT_APPROVER, UserRole.SUPER_ADMIN];
      default:
        return [UserRole.SUPER_ADMIN];
    }
  }
  
  /**
   * Helper: Get roles that can review at a video stage
   */
  private static getRolesForVideoStage(status: VideoStatus): UserRole[] {
    switch (status) {
      case VideoStatus.BRAND_REVIEW:
        return [UserRole.BRAND_REVIEWER, UserRole.SUPER_ADMIN];
      case VideoStatus.MEDICAL_REVIEW:
        return [UserRole.MEDICAL_REVIEWER, UserRole.SUPER_ADMIN];
      case VideoStatus.DOCTOR_REVIEW:
        return [UserRole.DOCTOR_CREATOR, UserRole.SUPER_ADMIN];
      case VideoStatus.APPROVED:
        return [UserRole.CONTENT_APPROVER, UserRole.SUPER_ADMIN];
      case VideoStatus.LOCKED:
        return [UserRole.PUBLISHER, UserRole.SUPER_ADMIN];
      default:
        return [UserRole.SUPER_ADMIN];
    }
  }
  
  // ========================================================================
  // QUEUE HELPERS
  // ========================================================================
  
  /**
   * Get scripts in a specific review queue
   */
  static async getScriptQueue(status: ScriptStatus, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    
    const [scripts, total] = await Promise.all([
      prisma.script.findMany({
        where: { status },
        include: {
          topic: true,
          uploadedBy: {
            select: { id: true, firstName: true, lastName: true }
          },
          reviews: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit
      }),
      prisma.script.count({ where: { status } })
    ]);
    
    return {
      scripts,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }
  
  /**
   * Get videos in a specific review queue
   */
  static async getVideoQueue(status: VideoStatus, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    
    const [videos, total] = await Promise.all([
      prisma.video.findMany({
        where: { status },
        include: {
          topic: true,
          script: true,
          uploadedBy: {
            select: { id: true, firstName: true, lastName: true }
          },
          reviews: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit
      }),
      prisma.video.count({ where: { status } })
    ]);
    
    return {
      videos,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }
  
  /**
   * Get queue for a specific role with claim status
   * Returns: available (unclaimed) + myReviews (claimed by me)
   */
  static async getQueueForRole(
    userRole: UserRole, 
    contentType: 'script' | 'video',
    userId?: string
  ) {
    let statuses: ScriptStatus[] | VideoStatus[] = [];
    
    if (contentType === 'script') {
      switch (userRole) {
        case UserRole.MEDICAL_REVIEWER:
          statuses = [ScriptStatus.MEDICAL_REVIEW];
          break;
        case UserRole.BRAND_REVIEWER:
          statuses = [ScriptStatus.BRAND_REVIEW];
          break;
        case UserRole.DOCTOR_CREATOR:
          statuses = [ScriptStatus.DOCTOR_REVIEW];
          break;
        case UserRole.CONTENT_APPROVER:
          statuses = [ScriptStatus.APPROVED];
          break;
        case UserRole.SUPER_ADMIN:
          statuses = [
            ScriptStatus.MEDICAL_REVIEW,
            ScriptStatus.BRAND_REVIEW,
            ScriptStatus.DOCTOR_REVIEW,
            ScriptStatus.APPROVED,
            ScriptStatus.LOCKED
          ];
          break;
        default:
          return { available: [], myReviews: [], total: 0 };
      }
      
      // Get AVAILABLE scripts (unclaimed - anyone can pick)
      const available = await prisma.script.findMany({
        where: { 
          status: { in: statuses as ScriptStatus[] },
          assignedReviewerId: null  // Not claimed by anyone
        },
        include: {
          topic: true,
          uploadedBy: {
            select: { id: true, firstName: true, lastName: true }
          }
        },
        orderBy: { createdAt: 'asc' } // FIFO - oldest first
      });
      
      // Get MY REVIEWS (claimed by current user)
      const myReviews = userId ? await prisma.script.findMany({
        where: { 
          status: { in: statuses as ScriptStatus[] },
          assignedReviewerId: userId  // Claimed by me
        },
        include: {
          topic: true,
          uploadedBy: {
            select: { id: true, firstName: true, lastName: true }
          }
        },
        orderBy: { assignedAt: 'desc' } // Most recent first
      }) : [];
      
      return { 
        available, 
        myReviews, 
        total: available.length + myReviews.length 
      };
      
    } else {
      switch (userRole) {
        case UserRole.BRAND_REVIEWER:
          statuses = [VideoStatus.BRAND_REVIEW];
          break;
        case UserRole.MEDICAL_REVIEWER:
          statuses = [VideoStatus.MEDICAL_REVIEW];
          break;
        case UserRole.DOCTOR_CREATOR:
          statuses = [VideoStatus.DOCTOR_REVIEW];
          break;
        case UserRole.CONTENT_APPROVER:
          statuses = [VideoStatus.APPROVED];
          break;
        case UserRole.PUBLISHER:
          statuses = [VideoStatus.LOCKED];
          break;
        case UserRole.SUPER_ADMIN:
          statuses = [
            VideoStatus.BRAND_REVIEW,
            VideoStatus.MEDICAL_REVIEW,
            VideoStatus.DOCTOR_REVIEW,
            VideoStatus.APPROVED,
            VideoStatus.LOCKED
          ];
          break;
        default:
          return { available: [], myReviews: [], total: 0 };
      }
      
      // Get AVAILABLE videos (unclaimed)
      const available = await prisma.video.findMany({
        where: { 
          status: { in: statuses as VideoStatus[] },
          assignedReviewerId: null
        },
        include: {
          topic: true,
          script: true,
          uploadedBy: {
            select: { id: true, firstName: true, lastName: true }
          }
        },
        orderBy: { createdAt: 'asc' }
      });
      
      // Get MY REVIEWS (claimed by current user)
      const myReviews = userId ? await prisma.video.findMany({
        where: { 
          status: { in: statuses as VideoStatus[] },
          assignedReviewerId: userId
        },
        include: {
          topic: true,
          script: true,
          uploadedBy: {
            select: { id: true, firstName: true, lastName: true }
          }
        },
        orderBy: { assignedAt: 'desc' }
      }) : [];
      
      return { 
        available, 
        myReviews, 
        total: available.length + myReviews.length 
      };
    }
  }
}

export default WorkflowService;
