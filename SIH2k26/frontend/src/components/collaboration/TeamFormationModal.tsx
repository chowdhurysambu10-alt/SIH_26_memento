import React, { useState } from 'react';
import { Challenge } from '../../types/challenge.types';
import { Modal } from '../common/Modal';
import { collaborationService } from '../../services/collaboration.service';
import { useNotifications } from '../../context/NotificationContext';
import { MOCK_INSTITUTIONS, DEMO_USERS } from '../../services/mockData';
import { Users, GraduationCap, Briefcase, Plus, Check } from 'lucide-react';

interface TeamFormationModalProps {
  challenge: Challenge | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const TeamFormationModal: React.FC<TeamFormationModalProps> = ({
  challenge,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { addToast } = useNotifications();
  const [selectedUniversity, setSelectedUniversity] = useState(challenge?.assigned_institution_id || MOCK_INSTITUTIONS[0].id);
  const [facultyName, setFacultyName] = useState('Dr. Amit Verma (Associate Professor, Chemical Engg)');
  const [studentName, setStudentName] = useState('Ananya Roy (B.Tech Final Year Lead Contributor)');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!challenge) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await collaborationService.createTeam({
        challenge_id: challenge.id,
        university_id: selectedUniversity,
        faculty_ids: [DEMO_USERS.faculty.id],
        student_ids: [DEMO_USERS.student.id],
      });

      addToast({
        title: 'Project Team Formed!',
        message: `Allocated research mentors and students for "${challenge.title.slice(0, 30)}...". Challenge advanced to TEAM_FORMED.`,
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
      title="Form Academic Project Team"
      subtitle={`Assign faculty mentors & student researchers to ${challenge.title.slice(0, 40)}...`}
      maxWidth="600px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div className="form-group">
          <label className="form-label">
            <GraduationCap size={16} color="#3b82f6" />
            <span>Lead University / Institute</span>
          </label>
          <select
            className="form-select"
            value={selectedUniversity}
            onChange={(e) => setSelectedUniversity(e.target.value)}
          >
            {MOCK_INSTITUTIONS.filter((i) => i.type === 'university').map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.district})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">
            <Briefcase size={16} color="#8b5cf6" />
            <span>Faculty Lead Researcher</span>
          </label>
          <input
            type="text"
            className="form-input"
            value={facultyName}
            onChange={(e) => setFacultyName(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            <Users size={16} color="#ec4899" />
            <span>Student Contributors</span>
          </label>
          <input
            type="text"
            className="form-input"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            required
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Students will be notified and granted deliverable submission access in their workspace.
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ gap: '0.4rem' }}>
            <Check size={16} />
            <span>{isSubmitting ? 'Forming Team...' : 'Form Team & Notify Researchers'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
