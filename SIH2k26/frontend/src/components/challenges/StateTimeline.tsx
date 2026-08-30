import React from 'react';
import { ChallengeStatus } from '../../types/challenge.types';
import { CheckCircle2, Clock, ArrowRight, ShieldCheck, Wrench, Users, Send } from 'lucide-react';

interface StateTimelineProps {
  currentStatus: ChallengeStatus | string;
}

const STEPS: Array<{ id: ChallengeStatus; label: string; icon: React.ReactNode }> = [
  { id: 'submitted', label: '1. Sourced', icon: <Send size={14} /> },
  { id: 'routed', label: '2. AI Routed', icon: <Clock size={14} /> },
  { id: 'team_formed', label: '3. Team Formed', icon: <Users size={14} /> },
  { id: 'in_progress', label: '4. In Progress', icon: <Wrench size={14} /> },
  { id: 'completed', label: '5. Completed', icon: <CheckCircle2 size={14} /> },
  { id: 'validated', label: '6. Validated', icon: <ShieldCheck size={14} /> },
];

export const StateTimeline: React.FC<StateTimelineProps> = ({ currentStatus }) => {
  const getStepIndex = (status: string) => {
    switch (status) {
      case 'submitted': return 0;
      case 'under_review': return 0;
      case 'routed': return 1;
      case 'team_formed': return 2;
      case 'in_progress': return 3;
      case 'completed': return 4;
      case 'validated': return 5;
      default: return 0;
    }
  };

  const currentIndex = getStepIndex(currentStatus);

  return (
    <div
      style={{
        background: 'var(--bg-glass)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem',
        width: '100%',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
          Challenge State Machine Progression
        </span>
        <span className="badge badge-validated" style={{ fontSize: '0.7rem' }}>
          Current: {currentStatus.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
        {/* Horizontal connecting track */}
        <div
          style={{
            position: 'absolute',
            top: '16px',
            left: '20px',
            right: '20px',
            height: '3px',
            background: 'rgba(255, 255, 255, 0.1)',
            zIndex: 0,
          }}
        >
          <div
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, #10b981, #3b82f6)',
              width: `${(currentIndex / (STEPS.length - 1)) * 100}%`,
              transition: 'width 0.4s ease',
            }}
          />
        </div>

        {STEPS.map((step, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;

          const getCircleBackground = () => {
            if (isCurrent) return 'linear-gradient(135deg, #10b981, #059669)';
            if (isCompleted) return '#3b82f6';
            return 'var(--bg-card)';
          };

          return (
            <div
              key={step.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.4rem',
                zIndex: 1,
                position: 'relative',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: getCircleBackground(),
                  border: isCurrent ? '3px solid #6ee7b7' : '2px solid rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isCurrent || isCompleted ? '#ffffff' : 'var(--text-muted)',
                  boxShadow: isCurrent ? '0 0 12px rgba(16, 185, 129, 0.6)' : 'none',
                  transition: 'all 0.3s',
                }}
              >
                {step.icon}
              </div>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: isCurrent ? 700 : 500,
                  color: isCurrent ? 'var(--emerald-500)' : isCompleted ? '#ffffff' : 'var(--text-muted)',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                }}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
