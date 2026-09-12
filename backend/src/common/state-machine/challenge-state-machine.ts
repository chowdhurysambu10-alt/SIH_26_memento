import { BadRequestException } from '@nestjs/common';
import { ChallengeStatus } from '../constants/challenge-status.enum';
import { UserRole } from '../constants/roles.enum';

export interface StateTransitionResult {
  from: ChallengeStatus;
  to: ChallengeStatus;
  allowed: boolean;
  reason?: string;
}

export class ChallengeStateMachine {
  private static readonly VALID_TRANSITIONS: Record<ChallengeStatus, ChallengeStatus[]> = {
    [ChallengeStatus.SUBMITTED]: [
      ChallengeStatus.UNDER_REVIEW,
      ChallengeStatus.ROUTED, // AI auto-routing or fast-track
      ChallengeStatus.IN_PROGRESS, // Direct admin approval into action
      ChallengeStatus.TEAM_FORMED, // Direct institution claim
    ],
    [ChallengeStatus.UNDER_REVIEW]: [
      ChallengeStatus.ROUTED,
      ChallengeStatus.SUBMITTED, // Sent back for clarification
      ChallengeStatus.IN_PROGRESS,
      ChallengeStatus.TEAM_FORMED,
    ],
    [ChallengeStatus.ROUTED]: [
      ChallengeStatus.TEAM_FORMED,
      ChallengeStatus.IN_PROGRESS,
      ChallengeStatus.UNDER_REVIEW, // Re-routing if university rejects
    ],
    [ChallengeStatus.TEAM_FORMED]: [
      ChallengeStatus.IN_PROGRESS,
      ChallengeStatus.ROUTED, // Team disbanded
      ChallengeStatus.COMPLETED,
    ],
    [ChallengeStatus.IN_PROGRESS]: [
      ChallengeStatus.COMPLETED,
    ],
    [ChallengeStatus.COMPLETED]: [
      ChallengeStatus.VALIDATED,
      ChallengeStatus.IN_PROGRESS, // Rejected validation, sent back for revision
    ],
    [ChallengeStatus.VALIDATED]: [], // Terminal state
  };

  /**
   * Validates if a transition from current status to target status is permitted.
   */
  public static canTransition(from: ChallengeStatus, to: ChallengeStatus, role?: UserRole): StateTransitionResult {
    // Super admin or admin can force any transition for recovery/override
    if (role === UserRole.SUPER_ADMIN || role === UserRole.GOVT_VIEWER || (role as any) === 'admin' || (role as any) === 'super_admin') {
      return { from, to, allowed: true };
    }

    if (from === to) {
      return { from, to, allowed: true };
    }

    const allowedNextStates = this.VALID_TRANSITIONS[from] || [];
    if (!allowedNextStates.includes(to)) {
      return {
        from,
        to,
        allowed: false,
        reason: `Invalid state transition from '${from}' to '${to}'. Allowed transitions: [${allowedNextStates.join(', ')}].`,
      };
    }

    return { from, to, allowed: true };
  }

  /**
   * Asserts transition validity and throws BadRequestException if invalid.
   */
  public static assertValidTransition(from: ChallengeStatus, to: ChallengeStatus, role?: UserRole): void {
    const result = this.canTransition(from, to, role);
    if (!result.allowed) {
      throw new BadRequestException({
        statusCode: 400,
        message: result.reason,
        errorCode: 'INVALID_STATE_TRANSITION',
      });
    }
  }
}
