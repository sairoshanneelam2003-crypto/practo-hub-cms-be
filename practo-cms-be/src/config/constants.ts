/**
 * Workflow Transition Rules
 * 
 * IMPORTANT: Rejections go ONE STEP BACK (not to DRAFT)
 * This is the corrected behavior per the implementation guide.
 */

import { ScriptStatus, VideoStatus, UserRole } from '../generated/prisma/index.js';

// ============================================================================
// WORKFLOW ACTIONS
// ============================================================================

export type ScriptAction = 'SUBMIT' | 'APPROVE' | 'REJECT' | 'LOCK' | 'UNLOCK';
export type VideoAction = 'SUBMIT' | 'APPROVE' | 'REJECT' | 'LOCK' | 'PUBLISH' | 'UNLOCK' | 'ARCHIVE';

// ============================================================================
// SCRIPT WORKFLOW TRANSITIONS (CORRECTED FOR ONE-STEP-BACK REJECTION)
// ============================================================================

interface TransitionRule {
  nextState: ScriptStatus | VideoStatus;
  requiredRoles: UserRole[];
}

export const SCRIPT_TRANSITIONS: Record<ScriptStatus, Partial<Record<ScriptAction, TransitionRule>>> = {
  // From DRAFT
  [ScriptStatus.DRAFT]: {
    SUBMIT: {
      nextState: ScriptStatus.MEDICAL_REVIEW,
      requiredRoles: [UserRole.AGENCY_POC]
    }
  },
  
  // From MEDICAL_REVIEW
  [ScriptStatus.MEDICAL_REVIEW]: {
    APPROVE: {
      nextState: ScriptStatus.BRAND_REVIEW,
      requiredRoles: [UserRole.MEDICAL_REVIEWER, UserRole.SUPER_ADMIN]
    },
    REJECT: {
      nextState: ScriptStatus.DRAFT, // Can't go further back
      requiredRoles: [UserRole.MEDICAL_REVIEWER, UserRole.SUPER_ADMIN]
    }
  },
  
  // From BRAND_REVIEW
  [ScriptStatus.BRAND_REVIEW]: {
    APPROVE: {
      nextState: ScriptStatus.DOCTOR_REVIEW,
      requiredRoles: [UserRole.BRAND_REVIEWER, UserRole.SUPER_ADMIN]
    },
    REJECT: {
      nextState: ScriptStatus.MEDICAL_REVIEW, // ONE STEP BACK
      requiredRoles: [UserRole.BRAND_REVIEWER, UserRole.SUPER_ADMIN]
    }
  },
  
  // From DOCTOR_REVIEW
  [ScriptStatus.DOCTOR_REVIEW]: {
    APPROVE: {
      nextState: ScriptStatus.APPROVED, // Moves to APPROVED, waiting for Content Approver to lock
      requiredRoles: [UserRole.DOCTOR_CREATOR, UserRole.SUPER_ADMIN]
    },
    REJECT: {
      nextState: ScriptStatus.BRAND_REVIEW, // ONE STEP BACK
      requiredRoles: [UserRole.DOCTOR_CREATOR, UserRole.SUPER_ADMIN]
    }
  },
  
  // From APPROVED (waiting for Content Approver to lock)
  [ScriptStatus.APPROVED]: {
    LOCK: {
      nextState: ScriptStatus.LOCKED,
      requiredRoles: [UserRole.CONTENT_APPROVER, UserRole.SUPER_ADMIN]
    }
  },
  
  // From LOCKED
  [ScriptStatus.LOCKED]: {
    UNLOCK: {
      nextState: ScriptStatus.APPROVED,
      requiredRoles: [UserRole.SUPER_ADMIN] // Emergency only
    }
  },
  
  // From REJECTED (allow resubmission)
  [ScriptStatus.REJECTED]: {
    SUBMIT: {
      nextState: ScriptStatus.MEDICAL_REVIEW,
      requiredRoles: [UserRole.AGENCY_POC]
    }
  }
};

// ============================================================================
// VIDEO WORKFLOW TRANSITIONS (CORRECTED FOR ONE-STEP-BACK REJECTION)
// ============================================================================

export const VIDEO_TRANSITIONS: Record<VideoStatus, Partial<Record<VideoAction, TransitionRule>>> = {
  // From DRAFT
  [VideoStatus.DRAFT]: {
    SUBMIT: {
      nextState: VideoStatus.BRAND_REVIEW,
      requiredRoles: [UserRole.AGENCY_POC]
    }
  },
  
  // From BRAND_REVIEW
  [VideoStatus.BRAND_REVIEW]: {
    APPROVE: {
      nextState: VideoStatus.MEDICAL_REVIEW,
      requiredRoles: [UserRole.BRAND_REVIEWER, UserRole.SUPER_ADMIN]
    },
    REJECT: {
      nextState: VideoStatus.DRAFT, // Can't go further back
      requiredRoles: [UserRole.BRAND_REVIEWER, UserRole.SUPER_ADMIN]
    }
  },
  
  // From MEDICAL_REVIEW
  [VideoStatus.MEDICAL_REVIEW]: {
    APPROVE: {
      nextState: VideoStatus.DOCTOR_REVIEW,
      requiredRoles: [UserRole.MEDICAL_REVIEWER, UserRole.SUPER_ADMIN]
    },
    REJECT: {
      nextState: VideoStatus.BRAND_REVIEW, // ONE STEP BACK
      requiredRoles: [UserRole.MEDICAL_REVIEWER, UserRole.SUPER_ADMIN]
    }
  },
  
  // From DOCTOR_REVIEW
  [VideoStatus.DOCTOR_REVIEW]: {
    APPROVE: {
      nextState: VideoStatus.APPROVED, // Moves to APPROVED, waiting for Content Approver to lock
      requiredRoles: [UserRole.DOCTOR_CREATOR, UserRole.SUPER_ADMIN]
    },
    REJECT: {
      nextState: VideoStatus.MEDICAL_REVIEW, // ONE STEP BACK
      requiredRoles: [UserRole.DOCTOR_CREATOR, UserRole.SUPER_ADMIN]
    }
  },
  
  // From APPROVED (waiting for Content Approver to lock)
  [VideoStatus.APPROVED]: {
    LOCK: {
      nextState: VideoStatus.LOCKED,
      requiredRoles: [UserRole.CONTENT_APPROVER, UserRole.SUPER_ADMIN]
    }
  },
  
  // From LOCKED
  [VideoStatus.LOCKED]: {
    PUBLISH: {
      nextState: VideoStatus.PUBLISHED,
      requiredRoles: [UserRole.PUBLISHER, UserRole.SUPER_ADMIN]
    },
    UNLOCK: {
      nextState: VideoStatus.APPROVED,
      requiredRoles: [UserRole.SUPER_ADMIN] // Emergency only
    }
  },
  
  // From PUBLISHED
  [VideoStatus.PUBLISHED]: {
    ARCHIVE: {
      nextState: VideoStatus.ARCHIVED,
      requiredRoles: [UserRole.SUPER_ADMIN, UserRole.CONTENT_APPROVER]
    }
  },
  
  // From ARCHIVED (no transitions allowed)
  [VideoStatus.ARCHIVED]: {},
  
  // From REJECTED (allow resubmission)
  [VideoStatus.REJECTED]: {
    SUBMIT: {
      nextState: VideoStatus.BRAND_REVIEW,
      requiredRoles: [UserRole.AGENCY_POC]
    }
  }
};

// ============================================================================
// LOCK PERMISSIONS
// ============================================================================

export const LOCK_PERMISSIONS = {
  CAN_LOCK_SCRIPT: [UserRole.CONTENT_APPROVER, UserRole.SUPER_ADMIN],
  CAN_LOCK_VIDEO: [UserRole.CONTENT_APPROVER, UserRole.SUPER_ADMIN],
  CAN_UNLOCK: [UserRole.SUPER_ADMIN]
};

// ============================================================================
// WORKFLOW STAGE ORDER (for display purposes)
// ============================================================================

export const SCRIPT_STAGE_ORDER: ScriptStatus[] = [
  ScriptStatus.DRAFT,
  ScriptStatus.MEDICAL_REVIEW,
  ScriptStatus.BRAND_REVIEW,
  ScriptStatus.DOCTOR_REVIEW,
  ScriptStatus.APPROVED,
  ScriptStatus.LOCKED
];

export const VIDEO_STAGE_ORDER: VideoStatus[] = [
  VideoStatus.DRAFT,
  VideoStatus.BRAND_REVIEW,
  VideoStatus.MEDICAL_REVIEW,
  VideoStatus.DOCTOR_REVIEW,
  VideoStatus.APPROVED,
  VideoStatus.LOCKED,
  VideoStatus.PUBLISHED
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the previous stage for rejection (one step back)
 */
export function getPreviousScriptStage(currentStage: ScriptStatus): ScriptStatus | null {
  const index = SCRIPT_STAGE_ORDER.indexOf(currentStage);
  if (index <= 0) return null;
  const prevStage = SCRIPT_STAGE_ORDER[index - 1];
  return prevStage !== undefined ? prevStage : null;
}

export function getPreviousVideoStage(currentStage: VideoStatus): VideoStatus | null {
  const index = VIDEO_STAGE_ORDER.indexOf(currentStage);
  if (index <= 0) return null;
  const prevStage = VIDEO_STAGE_ORDER[index - 1];
  return prevStage !== undefined ? prevStage : null;
}

/**
 * Check if a transition is valid
 */
export function isValidScriptTransition(
  currentStatus: ScriptStatus,
  action: ScriptAction,
  userRole: UserRole
): { valid: boolean; nextState?: ScriptStatus; error?: string } {
  const stateTransitions = SCRIPT_TRANSITIONS[currentStatus];
  if (!stateTransitions) {
    return { valid: false, error: `No transitions defined for state: ${currentStatus}` };
  }

  const transition = stateTransitions[action];
  if (!transition) {
    return { valid: false, error: `Action ${action} not allowed from state: ${currentStatus}` };
  }

  if (!transition.requiredRoles.includes(userRole)) {
    return { 
      valid: false, 
      error: `Role ${userRole} cannot perform ${action} on ${currentStatus}. Required: ${transition.requiredRoles.join(', ')}`
    };
  }

  return { valid: true, nextState: transition.nextState as ScriptStatus };
}

export function isValidVideoTransition(
  currentStatus: VideoStatus,
  action: VideoAction,
  userRole: UserRole
): { valid: boolean; nextState?: VideoStatus; error?: string } {
  const stateTransitions = VIDEO_TRANSITIONS[currentStatus];
  if (!stateTransitions) {
    return { valid: false, error: `No transitions defined for state: ${currentStatus}` };
  }

  const transition = stateTransitions[action];
  if (!transition) {
    return { valid: false, error: `Action ${action} not allowed from state: ${currentStatus}` };
  }

  if (!transition.requiredRoles.includes(userRole)) {
    return { 
      valid: false, 
      error: `Role ${userRole} cannot perform ${action} on ${currentStatus}. Required: ${transition.requiredRoles.join(', ')}`
    };
  }

  return { valid: true, nextState: transition.nextState as VideoStatus };
}

