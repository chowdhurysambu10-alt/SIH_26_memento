import React, { useState, useEffect } from 'react';
import { Challenge } from '../../types/challenge.types';
import { ProjectTeam, Milestone, IndustryEngagement } from '../../types/collaboration.types';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Modal } from '../common/Modal';
import { StatusBadge } from '../common/StatusBadge';
import { PriorityIndicator } from '../common/PriorityIndicator';
import { AiExplanationCard } from '../common/AiExplanationCard';
import { StateTimeline } from './StateTimeline';
import { collaborationService } from '../../services/collaboration.service';
import { challengesService } from '../../services/challenges.service';
import {
  MapPin,
  Building2,
  Calendar,
  Users,
  CheckCircle2,
  PlusCircle,
  FileText,
  DollarSign,
  ExternalLink,
  Shield,
  Briefcase,
  Layers,
  Sparkles,
  Check,
  AlertCircle
} from 'lucide-react';

interface ChallengeDetailModalProps {
  challenge: Challenge | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
  onOpenTeamModal?: (challenge: Challenge) => void;
  onOpenMilestoneModal?: (teamId: string) => void;
  onOpenSubmitModal?: (milestoneId: string) => void;
  onOpenApproveModal?: (milestone: Milestone) => void;
  onOpenProposalModal?: (challenge: Challenge) => void;
  onOpenAiOverrideModal?: (challenge: Challenge) => void;
}

export const ChallengeDetailModal: React.FC<ChallengeDetailModalProps> = ({
  challenge,
  isOpen,
  onClose,
  onRefresh,
  onOpenTeamModal,
  onOpenMilestoneModal,
  onOpenSubmitModal,
  onOpenApproveModal,
  onOpenProposalModal,
  onOpenAiOverrideModal,
}) => {
  const { role, user } = useAuth();
  const { addToast } = useNotifications();
  const [activeTab, setActiveTab] = useState<'overview' | 'ai' | 'team' | 'milestones' | 'csr'>('overview');
  const [team, setTeam] = useState<ProjectTeam | null>(null);
  const [engagements, setEngagements] = useState<IndustryEngagement[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (challenge && isOpen) {
      setLoading(true);
      Promise.all([
        collaborationService.getTeamByChallengeId(challenge.id),
        collaborationService.getEngagementsByChallengeId(challenge.id),
      ])
        .then(([teamData, engData]) => {
          setTeam(teamData);
          setEngagements(engData);
        })
        .finally(() => setLoading(false));
    }
  }, [challenge?.id, isOpen]);

  if (!challenge) return null;

  const handleValidateSolution = async () => {
    try {
      await challengesService.updateStatus(challenge.id, 'validated', 'Solution verified by Government Authority inspection.');
      addToast({ title: 'Challenge Validated!', message: 'The societal solution has been formally verified and approved statewide.', type: 'success' });
      if (onRefresh) onRefresh();
      onClose();
    } catch (err: any) {
      addToast({ title: 'Validation Failed', message: err.message, type: 'error' });
    }
  };

  const handleAcceptEngagement = async (engagementId: string) => {
    try {
      await collaborationService.updateEngagementStatus(engagementId, 'accepted');
      addToast({ title: 'CSR Proposal Accepted!', message: 'Funding agreement accepted. Industry partner notified.', type: 'success' });
      const updated = await collaborationService.getEngagementsByChallengeId(challenge.id);
      setEngagements(updated);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      addToast({ title: 'Error', message: err.message, type: 'error' });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={challenge.title}
      subtitle={`ID: ${challenge.id.slice(0, 18)}... • ${challenge.district} District`}
      maxWidth="840px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* State Timeline */}
        <StateTimeline currentStatus={challenge.status} />

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '0.5rem',
            overflowX: 'auto',
          }}
        >
          <button
            onClick={() => setActiveTab('overview')}
            className={`btn btn-sm ${activeTab === 'overview' ? 'btn-primary' : 'btn-ghost'}`}
          >
            <FileText size={14} /> Problem Overview
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`btn btn-sm ${activeTab === 'ai' ? 'btn-sapphire' : 'btn-ghost'}`}
          >
            <Sparkles size={14} /> AI Triage & Rationale
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`btn btn-sm ${activeTab === 'team' ? 'btn-primary' : 'btn-ghost'}`}
          >
            <Users size={14} /> Project Team ({team ? 'Active' : 'Not Formed'})
          </button>
          <button
            onClick={() => setActiveTab('milestones')}
            className={`btn btn-sm ${activeTab === 'milestones' ? 'btn-primary' : 'btn-ghost'}`}
          >
            <Layers size={14} /> Milestones & Deliverables ({team?.milestones?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('csr')}
            className={`btn btn-sm ${activeTab === 'csr' ? 'btn-amber' : 'btn-ghost'}`}
          >
            <DollarSign size={14} /> Industry CSR ({engagements.length})
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Top metadata grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
              <div style={{ background: 'var(--bg-glass)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Lifecycle Status</span>
                <StatusBadge status={challenge.status} />
              </div>

              <div style={{ background: 'var(--bg-glass)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Priority / Severity</span>
                <PriorityIndicator score={challenge.priority_score} />
              </div>

              <div style={{ background: 'var(--bg-glass)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Location / District</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <MapPin size={14} color="#10b981" /> {challenge.location_text || challenge.district}
                </span>
              </div>

              <div style={{ background: 'var(--bg-glass)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Assigned Institution</span>
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Building2 size={14} /> {challenge.institutions?.name || 'BIT Sindri'}
                </span>
              </div>
            </div>

            {/* Problem Description */}
            <div>
              <h5 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.45rem', color: 'var(--text-primary)' }}>
                Grassroots Problem Statement
              </h5>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.6, background: 'rgba(0, 0, 0, 0.2)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                {challenge.description}
              </p>
            </div>

            {/* Media Attachment */}
            {challenge.media_urls && challenge.media_urls.length > 0 && (
              <div>
                <h5 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.45rem', color: 'var(--text-primary)' }}>
                  On-Ground Photo Evidence
                </h5>
                <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto' }}>
                  {challenge.media_urls.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt="Field evidence"
                      style={{ width: '220px', height: '140px', objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: AI TRIAGE */}
        {activeTab === 'ai' && (
          <AiExplanationCard
            classification={challenge.ai_classification}
            assignedInstitutionName={challenge.institutions?.name}
          />
        )}

        {/* TAB 3: PROJECT TEAM */}
        {activeTab === 'team' && (
          <div>
            {team ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ background: 'var(--bg-glass)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Assigned University:</span>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#38bdf8', marginTop: '0.2rem' }}>
                    {team.university?.name || challenge.institutions?.name || 'Birsa Institute of Technology (BIT) Sindri'}
                  </h4>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {/* Faculty */}
                  <div style={{ background: 'var(--bg-glass)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <h5 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#a78bfa' }}>
                      <Briefcase size={16} /> Faculty Lead Mentor
                    </h5>
                    <div style={{ fontSize: '0.85rem' }}>
                      <strong>Dr. Amit Verma</strong>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Associate Professor, Chemical Engg</p>
                    </div>
                  </div>

                  {/* Students */}
                  <div style={{ background: 'var(--bg-glass)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <h5 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#f472b6' }}>
                      <Users size={16} /> Student Researchers
                    </h5>
                    <div style={{ fontSize: '0.85rem' }}>
                      <strong>Ananya Roy</strong> (Lead Contributor)
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Final Year B.Tech Research Scholar</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', background: 'var(--bg-glass)', borderRadius: 'var(--radius-lg)' }}>
                <Users size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.5, color: '#3b82f6' }} />
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.35rem' }}>No Project Team Formed Yet</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                  University administration needs to allocate faculty mentors and student researchers to kick off milestone execution.
                </p>
                {(role === 'university_admin' || role === 'super_admin' || role === 'faculty') && onOpenTeamModal && (
                  <button onClick={() => onOpenTeamModal(challenge)} className="btn btn-primary btn-sm">
                    <PlusCircle size={15} /> Form Project Team Now
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: MILESTONES */}
        {activeTab === 'milestones' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Project Deliverable Timeline</span>
              {(role === 'university_admin' || role === 'faculty' || role === 'super_admin') && team && onOpenMilestoneModal && (
                <button onClick={() => onOpenMilestoneModal(team.id)} className="btn btn-secondary btn-sm">
                  <PlusCircle size={14} /> Add Milestone
                </button>
              )}
            </div>

            {team?.milestones && team.milestones.length > 0 ? (
              team.milestones.map((m, idx) => (
                <div
                  key={m.id}
                  style={{
                    background: 'var(--bg-glass)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h5 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {idx + 1}. {m.title}
                    </h5>
                    <span className={`badge badge-${m.status}`}>
                      {m.status.toUpperCase()}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                    {m.description}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.6rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Calendar size={12} /> Due: {m.due_date ? new Date(m.due_date).toLocaleDateString() : 'TBD'}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {m.deliverable_url && (
                        <a
                          href={m.deliverable_url}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-ghost btn-sm"
                          style={{ fontSize: '0.78rem', color: '#38bdf8', gap: '0.25rem' }}
                        >
                          <ExternalLink size={12} /> View Deliverable
                        </a>
                      )}

                      {/* Student submit button */}
                      {(role === 'student' || role === 'faculty') && m.status !== 'completed' && onOpenSubmitModal && (
                        <button onClick={() => onOpenSubmitModal(m.id)} className="btn btn-primary btn-sm" style={{ fontSize: '0.78rem' }}>
                          Submit Deliverable
                        </button>
                      )}

                      {/* Dean/Faculty approve button */}
                      {(role === 'university_admin' || role === 'faculty' || role === 'super_admin' || role === 'govt_viewer') &&
                        m.status === 'submitted' &&
                        onOpenApproveModal && (
                          <button onClick={() => onOpenApproveModal(m)} className="btn btn-amber btn-sm" style={{ fontSize: '0.78rem' }}>
                            <Check size={13} /> Review & Approve
                          </button>
                        )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                <p>No project milestones logged yet.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: CSR PROPOSALS */}
        {activeTab === 'csr' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Corporate Sponsorships & Equipment Grants</span>
              {role === 'industry_partner' && onOpenProposalModal && (
                <button onClick={() => onOpenProposalModal(challenge)} className="btn btn-amber btn-sm">
                  <PlusCircle size={14} /> Submit CSR Offer
                </button>
              )}
            </div>

            {engagements.length > 0 ? (
              engagements.map((eng) => (
                <div
                  key={eng.id}
                  style={{
                    background: 'var(--bg-glass)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Building2 size={16} /> {eng.industry?.name || 'Tata Steel CSR Foundation'}
                    </span>
                    <span className={`badge ${eng.status === 'accepted' ? 'badge-validated' : 'badge-under_review'}`}>
                      {eng.status.toUpperCase()}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {eng.proposal_notes}
                  </p>

                  {(role === 'university_admin' || role === 'super_admin') && eng.status === 'pending' && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                      <button onClick={() => handleAcceptEngagement(eng.id)} className="btn btn-primary btn-sm">
                        <Check size={14} /> Accept CSR Funding Offer
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                <p>No industry proposals received yet for this problem.</p>
                {role === 'industry_partner' && onOpenProposalModal && (
                  <button onClick={() => onOpenProposalModal(challenge)} className="btn btn-amber btn-sm" style={{ marginTop: '1rem' }}>
                    Be the First Sponsor
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Global Action Bar */}
        <div
          style={{
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {(role === 'super_admin' || role === 'govt_viewer') && onOpenAiOverrideModal && (
              <button onClick={() => onOpenAiOverrideModal(challenge)} className="btn btn-secondary btn-sm" style={{ fontSize: '0.82rem' }}>
                <Shield size={14} color="#f43f5e" /> Override AI Routing
              </button>
            )}

            {(role === 'govt_viewer' || role === 'super_admin') && challenge.status === 'completed' && (
              <button onClick={handleValidateSolution} className="btn btn-primary btn-sm" style={{ fontSize: '0.82rem' }}>
                <CheckCircle2 size={14} /> Validate Solution On-Ground
              </button>
            )}
          </div>

          <button onClick={onClose} className="btn btn-secondary btn-sm">
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
