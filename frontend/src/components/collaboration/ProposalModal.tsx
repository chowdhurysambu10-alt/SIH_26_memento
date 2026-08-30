import React, { useState } from 'react';
import { Challenge } from '../../types/challenge.types';
import { Modal } from '../common/Modal';
import { collaborationService } from '../../services/collaboration.service';
import { useNotifications } from '../../context/NotificationContext';
import { Building2, DollarSign, Wrench, GraduationCap, Check } from 'lucide-react';

interface ProposalModalProps {
  challenge: Challenge | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ProposalModal: React.FC<ProposalModalProps> = ({
  challenge,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { addToast } = useNotifications();
  const [engagementType, setEngagementType] = useState('funding');
  const [amountOrResources, setAmountOrResources] = useState('Rs 5,00,000');
  const [notes, setNotes] = useState('Tata Steel CSR Foundation offers financial sponsorship for fabrication and community testing in Jharkhand.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!challenge) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await collaborationService.createEngagement({
        challenge_id: challenge.id,
        engagement_type: engagementType,
        proposal_notes: `${amountOrResources} - ${notes}`,
      });

      addToast({
        title: 'CSR Proposal Dispatched!',
        message: 'Your funding & support offer has been routed to the university research dean.',
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
      title="Submit Corporate CSR / Industry Offer"
      subtitle={`Sponsor innovation for ${challenge.title.slice(0, 40)}...`}
      maxWidth="580px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div className="form-group">
          <label className="form-label">
            <Building2 size={16} color="#f59e0b" />
            <span>Engagement Type</span>
          </label>
          <select
            className="form-select"
            value={engagementType}
            onChange={(e) => setEngagementType(e.target.value)}
          >
            <option value="funding">CSR Direct Financial Grant</option>
            <option value="mentorship">Technical Mentorship & Industry Labs</option>
            <option value="technology">Equipment & Raw Material Supply</option>
            <option value="internships">Student R&D Internships & Hiring</option>
            <option value="pilot_testing">On-Field Industrial Pilot Testing Site</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">
            <DollarSign size={16} color="#10b981" />
            <span>Committed Value / Budget / Resources</span>
          </label>
          <input
            type="text"
            className="form-input"
            value={amountOrResources}
            onChange={(e) => setAmountOrResources(e.target.value)}
            placeholder="e.g. Rs 5,00,000 Grant or 10 IoT Filtration Test Kits"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            Proposal Details & Letter of Intent
          </label>
          <textarea
            className="form-textarea"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            required
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className="btn btn-amber" style={{ gap: '0.4rem' }}>
            <Check size={16} />
            <span>{isSubmitting ? 'Sending...' : 'Send CSR Sponsorship Proposal'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
