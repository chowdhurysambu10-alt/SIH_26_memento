import { ChallengeStateMachine } from './challenge-state-machine';
import { ChallengeStatus } from '../constants/challenge-status.enum';
import { UserRole } from '../constants/roles.enum';
import { BadRequestException } from '@nestjs/common';

describe('ChallengeStateMachine', () => {
  it('should allow valid sequential progression', () => {
    expect(ChallengeStateMachine.canTransition(ChallengeStatus.SUBMITTED, ChallengeStatus.UNDER_REVIEW).allowed).toBe(true);
    expect(ChallengeStateMachine.canTransition(ChallengeStatus.UNDER_REVIEW, ChallengeStatus.ROUTED).allowed).toBe(true);
    expect(ChallengeStateMachine.canTransition(ChallengeStatus.ROUTED, ChallengeStatus.TEAM_FORMED).allowed).toBe(true);
    expect(ChallengeStateMachine.canTransition(ChallengeStatus.TEAM_FORMED, ChallengeStatus.IN_PROGRESS).allowed).toBe(true);
    expect(ChallengeStateMachine.canTransition(ChallengeStatus.IN_PROGRESS, ChallengeStatus.COMPLETED).allowed).toBe(true);
    expect(ChallengeStateMachine.canTransition(ChallengeStatus.COMPLETED, ChallengeStatus.VALIDATED).allowed).toBe(true);
  });

  it('should reject invalid jumps across the lifecycle', () => {
    // Cannot jump from submitted directly to completed
    const result1 = ChallengeStateMachine.canTransition(ChallengeStatus.SUBMITTED, ChallengeStatus.COMPLETED);
    expect(result1.allowed).toBe(false);
    expect(result1.reason).toContain("Invalid state transition from 'submitted' to 'completed'");

    // Cannot jump from routed directly to completed
    const result2 = ChallengeStateMachine.canTransition(ChallengeStatus.ROUTED, ChallengeStatus.COMPLETED);
    expect(result2.allowed).toBe(false);

    // Cannot jump backwards from completed to submitted
    const result3 = ChallengeStateMachine.canTransition(ChallengeStatus.COMPLETED, ChallengeStatus.SUBMITTED);
    expect(result3.allowed).toBe(false);
  });

  it('should throw BadRequestException with custom error code on assertValidTransition', () => {
    expect(() => {
      ChallengeStateMachine.assertValidTransition(ChallengeStatus.SUBMITTED, ChallengeStatus.COMPLETED);
    }).toThrow(BadRequestException);

    try {
      ChallengeStateMachine.assertValidTransition(ChallengeStatus.SUBMITTED, ChallengeStatus.VALIDATED);
    } catch (err: any) {
      expect(err.getResponse()).toEqual({
        statusCode: 400,
        message: expect.stringContaining('Invalid state transition'),
        errorCode: 'INVALID_STATE_TRANSITION',
      });
    }
  });

  it('should allow super admin to override transitions if needed', () => {
    const result = ChallengeStateMachine.canTransition(
      ChallengeStatus.SUBMITTED,
      ChallengeStatus.COMPLETED,
      UserRole.SUPER_ADMIN,
    );
    expect(result.allowed).toBe(true);
  });
});
