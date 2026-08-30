import React, { useState } from 'react';
import { Milestone } from '../../types/collaboration.types';
import { Modal } from '../common/Modal';
import { collaborationService } from '../../services/collaboration.service';
import { useNotifications } from '../../context/NotificationContext';
import { CheckCircle2, XCircle, ExternalLink, MessageSquare } from 'lucide-react';

interface MilestoneApproveModalProps {
  milestone: Milestone | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const MilestoneApproveModal: React.FC<MilestoneApproveModalProps> = ({
  milestone,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { addToast } = useNotifications();
  const [approvalNotes, setApprovalNotes] = useState('All technical metrics tested and verified compliant with project requirements.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!milestone) return null;

  const handleAction = async (status: 'approved' | 'rejected') => {
    setIsSubmitting(true);
    try {
      await collaborationService.approveMilestone(milestone.id, {
        approval_status: status,
        approval_notes: approvalNotes,
      });

      addToast({
        title: status === 'approved' ? 'Milestone Approved!' : 'Milestone Rejected',
        message: status === 'approved' ? 'Deliverable verified and milestone marked COMPLETED.' : 'Revision feedback sent to team.',
        type: status === 'approved' ? 'success' : 'warning',
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      addToast({ title: 'Error', message: err.message, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Review & Grade Deliverable"
      subtitle={milestone.title}
      maxWidth="580px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Deliverable Link Preview */}
        {milestone.deliverable_url ? (
          <div style={{ background: 'var(--bg-glass)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
              Submitted Deliverable Asset:
            </span>
            <a
              href={milestone.deliverable_url}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: '#38bdf8',
                fontSize: '0.9rem',
                fontWeight: 600,
                wordBreak: 'break-all',
              }}
            >
              <ExternalLink size={14} /> {milestone.deliverable_url}
            </a>
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)' }}>No deliverable URL linked.</p>
        )}

        <div className="form-group">
          <label className="form-label">
            <MessageSquare size={16} color="#f59e0b" />
            <span>Faculty Review Notes / Grading Assessment</span>
          </label>
          <textarea
            className="form-textarea"
            rows={3}
            value={approvalNotes}
            onChange={(e) => setApprovalNotes(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleAction('rejected')}
            className="btn btn-danger"
            style={{ gap: '0.4rem' }}
          >
            <XCircle size={16} />
            <span>Request Revision</span>
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleAction('approved')}
            className="btn btn-primary"
            style={{ gap: '0.4rem' }}
          >
            <CheckCircle2 size={16} />
            <span>Approve & Complete Milestone</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
