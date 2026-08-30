import React, { useState } from 'react';
import { Challenge } from '../../types/challenge.types';
import { Modal } from '../common/Modal';
import { challengesService } from '../../services/challenges.service';
import { useNotifications } from '../../context/NotificationContext';
import { MOCK_INSTITUTIONS } from '../../services/mockData';
import { Shield, Building2, Flame, AlertCircle, Check } from 'lucide-react';

interface AiOverrideModalProps {
  challenge: Challenge | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AiOverrideModal: React.FC<AiOverrideModalProps> = ({
  challenge,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { addToast } = useNotifications();
  const [assignedInstitutionId, setAssignedInstitutionId] = useState(challenge?.assigned_institution_id || MOCK_INSTITUTIONS[0].id);
  const [priorityScore, setPriorityScore] = useState<number>(challenge?.priority_score || 85);
  const [overrideReason, setOverrideReason] = useState('Re-routing based on state departmental priority and specialized research lab equipment availability.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!challenge) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await challengesService.overrideRouting(challenge.id, {
        assigned_institution_id: assignedInstitutionId,
        priority_score: priorityScore,
        override_reason: overrideReason,
      });

      addToast({
        title: 'AI Routing Overridden!',
        message: 'Successfully reassigned university and updated severity score. Action logged in audit trail.',
        type: 'success',
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
      title="Administrative AI Routing & Severity Override"
      subtitle={`Authorized for Super Admin & State Government Monitors (${challenge.title.slice(0, 35)}...)`}
      maxWidth="600px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ background: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244, 63, 94, 0.3)', padding: '0.85rem', borderRadius: 'var(--radius-md)', display: 'flex', gap: '0.65rem' }}>
          <Shield size={18} color="#f43f5e" style={{ flexShrink: 0, marginTop: '2px' }} />
          <p style={{ fontSize: '0.82rem', color: '#fca5a5', lineHeight: 1.4 }}>
            Manual overrides bypass the Gemma AI Studio auto-routing triage. All re-assignments are recorded in the immutable statewide PostgreSQL audit log.
          </p>
        </div>

        <div className="form-group">
          <label className="form-label">
            <Building2 size={16} color="#3b82f6" />
            <span>Re-Assign Lead Institution</span>
          </label>
          <select
            className="form-select"
            value={assignedInstitutionId}
            onChange={(e) => setAssignedInstitutionId(e.target.value)}
          >
            {MOCK_INSTITUTIONS.map((inst) => (
              <option key={inst.id} value={inst.id}>
                {inst.name} ({inst.district}) - {inst.type.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">
            <Flame size={16} color="#f59e0b" />
            <span>Override Severity Priority Score (1 - 100): {priorityScore}</span>
          </label>
          <input
            type="range"
            min="1"
            max="100"
            value={priorityScore}
            onChange={(e) => setPriorityScore(parseInt(e.target.value))}
            style={{ width: '100%', accentColor: '#10b981' }}
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            <span>Mandatory Override Justification / Department Memo *</span>
          </label>
          <textarea
            className="form-textarea"
            rows={3}
            value={overrideReason}
            onChange={(e) => setOverrideReason(e.target.value)}
            required
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ gap: '0.4rem' }}>
            <Check size={16} />
            <span>{isSubmitting ? 'Applying Override...' : 'Apply Administrative Override'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
