import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { collaborationService } from '../../services/collaboration.service';
import { useNotifications } from '../../context/NotificationContext';
import { Upload, Link2, FileCheck, Check } from 'lucide-react';

interface MilestoneSubmitModalProps {
  milestoneId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const MilestoneSubmitModal: React.FC<MilestoneSubmitModalProps> = ({
  milestoneId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { addToast } = useNotifications();
  const [deliverableUrl, setDeliverableUrl] = useState('https://wwmskwauqxinghdwlwde.supabase.co/storage/v1/object/public/challenge-media/prototype_design_v1.pdf');
  const [notes, setNotes] = useState('Completed field lab trial and published CAD model / verification report.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!milestoneId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await collaborationService.submitMilestone(milestoneId, deliverableUrl);
      addToast({
        title: 'Deliverable Submitted!',
        message: 'Your report/repository has been sent to faculty mentors and dean for review.',
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
      title="Submit Milestone Deliverable"
      subtitle="Upload research report, CAD drawings, prototype video, or GitHub code repository."
      maxWidth="560px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div className="form-group">
          <label className="form-label">
            <Link2 size={16} color="#3b82f6" />
            <span>Deliverable Public URL (PDF / GitHub / Video) *</span>
          </label>
          <input
            type="url"
            className="form-input"
            value={deliverableUrl}
            onChange={(e) => setDeliverableUrl(e.target.value)}
            placeholder="https://..."
            required
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Supabase Storage public URL, GitHub repo link, or Google Drive folder.
          </span>
        </div>

        <div className="form-group">
          <label className="form-label">
            <FileCheck size={16} color="#10b981" />
            <span>Deliverable Summary Notes</span>
          </label>
          <textarea
            className="form-textarea"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ gap: '0.4rem' }}>
            <Check size={16} />
            <span>{isSubmitting ? 'Submitting...' : 'Submit Deliverable for Review'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
