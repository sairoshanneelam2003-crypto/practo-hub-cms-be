/**
 * Role-Based Access Control (RBAC) Configuration
 * 
 * Defines exact permissions for each role as per Practo Hub CMS technical documents.
 * Updated to match the complete schema with proper workflow stages.
 */

import { UserRole, ScriptStatus, VideoStatus } from '../generated/prisma/index.js';

// ============================================================================
// PERMISSION TYPES
// ============================================================================

export type Permission = 
  // Super Admin permissions
  | 'create_user'
  | 'edit_user'
  | 'deactivate_user'
  | 'assign_role'
  | 'view_logs'
  | 'view_analytics'
  | 'force_move_workflow'
  | 'unlock_content'
  
  // Topic management
  | 'create_topic'
  | 'edit_topic'
  | 'delete_topic'
  | 'assign_topic'
  | 'view_all_topics'
  
  // Medical Reviewer permissions
  | 'review_script'
  | 'comment_script'
  | 'approve_script'
  | 'reject_script'
  | 'review_video'
  | 'comment_video'
  | 'approve_video'
  | 'reject_video'
  | 'view_script_versions'
  | 'view_doctor_profiles'
  
  // Doctor Creator permissions
  | 'upload_pointers'
  | 'request_script_changes'
  | 'request_video_changes'
  | 'view_own_content'
  | 'view_assigned_topics'
  
  // Agency POC permissions
  | 'view_doctor_notes'
  | 'upload_script'
  | 'upload_script_revision'
  | 'upload_video'
  | 'submit_for_review'
  
  // Content Approver permissions
  | 'lock_script'
  | 'lock_video'
  | 'view_approval_chain'
  
  // Viewer permissions
  | 'view_content'
  | 'comment'
  
  // Publisher permissions
  | 'publish_content'
  | 'unpublish_content'
  | 'archive_content'
  | 'edit_metadata';

// Re-export UserRole as Role for backward compatibility
export type Role = UserRole;

// ============================================================================
// ROLE PERMISSIONS MAPPING
// ============================================================================

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: [
    // User management
    'create_user',
    'edit_user',
    'deactivate_user',
    'assign_role',
    'view_logs',
    'view_analytics',
    'force_move_workflow',
    'unlock_content',
    // Topic management
    'create_topic',
    'edit_topic',
    'delete_topic',
    'assign_topic',
    'view_all_topics',
    // Full access to all content operations
    'review_script',
    'comment_script',
    'approve_script',
    'reject_script',
    'review_video',
    'comment_video',
    'approve_video',
    'reject_video',
    'lock_script',
    'lock_video',
    'publish_content',
    'unpublish_content',
    'archive_content',
    'view_content',
    'view_approval_chain'
  ],

  MEDICAL_REVIEWER: [
    'assign_topic',
    'view_all_topics',
    'review_script',
    'comment_script',
    'approve_script',
    'reject_script',
    'review_video',
    'comment_video',
    'approve_video',
    'reject_video',
    'view_script_versions',
    'view_doctor_profiles',
    'view_content'
  ],

  BRAND_REVIEWER: [
    'view_all_topics',
    'review_script',
    'comment_script',
    'approve_script',
    'reject_script',
    'review_video',
    'comment_video',
    'approve_video',
    'reject_video',
    'view_content'
  ],

  DOCTOR_CREATOR: [
    'upload_pointers',
    'approve_script',
    'reject_script',
    'request_script_changes',
    'approve_video',
    'reject_video',
    'request_video_changes',
    'view_own_content',
    'view_assigned_topics',
    'comment_script',
    'comment_video'
  ],

  AGENCY_POC: [
    'view_assigned_topics',
    'view_doctor_notes',
    'upload_script',
    'upload_script_revision',
    'upload_video',
    'submit_for_review',
    'view_content',
    'comment_script',
    'comment_video'
  ],

  CONTENT_APPROVER: [
    'view_all_topics',
    'approve_script',
    'reject_script',
    'approve_video',
    'reject_video',
    'lock_script',
    'lock_video',
    'view_approval_chain',
    'view_content'
  ],

  VIEWER: [
    'view_content',
    'comment'
  ],

  PUBLISHER: [
    'view_all_topics',
    'publish_content',
    'unpublish_content',
    'archive_content',
    'edit_metadata',
    'view_content'
  ]
};

// ============================================================================
// WORKFLOW STAGE PERMISSIONS
// ============================================================================

/**
 * Maps which roles can review content at each workflow stage
 */
export const SCRIPT_STAGE_REVIEWERS: Record<ScriptStatus, UserRole[]> = {
  [ScriptStatus.DRAFT]: [UserRole.AGENCY_POC],
  [ScriptStatus.MEDICAL_REVIEW]: [UserRole.MEDICAL_REVIEWER, UserRole.SUPER_ADMIN],
  [ScriptStatus.BRAND_REVIEW]: [UserRole.BRAND_REVIEWER, UserRole.SUPER_ADMIN],
  [ScriptStatus.DOCTOR_REVIEW]: [UserRole.DOCTOR_CREATOR, UserRole.SUPER_ADMIN],
  [ScriptStatus.APPROVED]: [UserRole.CONTENT_APPROVER, UserRole.SUPER_ADMIN], // Waiting for lock
  [ScriptStatus.LOCKED]: [UserRole.SUPER_ADMIN], // Only super admin can unlock
  [ScriptStatus.REJECTED]: [UserRole.AGENCY_POC]
};

export const VIDEO_STAGE_REVIEWERS: Record<VideoStatus, UserRole[]> = {
  [VideoStatus.DRAFT]: [UserRole.AGENCY_POC],
  [VideoStatus.BRAND_REVIEW]: [UserRole.BRAND_REVIEWER, UserRole.SUPER_ADMIN],
  [VideoStatus.MEDICAL_REVIEW]: [UserRole.MEDICAL_REVIEWER, UserRole.SUPER_ADMIN],
  [VideoStatus.DOCTOR_REVIEW]: [UserRole.DOCTOR_CREATOR, UserRole.SUPER_ADMIN],
  [VideoStatus.APPROVED]: [UserRole.CONTENT_APPROVER, UserRole.SUPER_ADMIN], // Waiting for lock
  [VideoStatus.LOCKED]: [UserRole.PUBLISHER, UserRole.SUPER_ADMIN],
  [VideoStatus.PUBLISHED]: [UserRole.SUPER_ADMIN],
  [VideoStatus.ARCHIVED]: [UserRole.SUPER_ADMIN],
  [VideoStatus.REJECTED]: [UserRole.AGENCY_POC]
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a user has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Get all permissions for a role
 */
export function getUserPermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if a role can review scripts at a specific stage
 */
export function canReviewScriptAtStage(role: UserRole, stage: ScriptStatus): boolean {
  return SCRIPT_STAGE_REVIEWERS[stage]?.includes(role) ?? false;
}

/**
 * Check if a role can review videos at a specific stage
 */
export function canReviewVideoAtStage(role: UserRole, stage: VideoStatus): boolean {
  return VIDEO_STAGE_REVIEWERS[stage]?.includes(role) ?? false;
}
