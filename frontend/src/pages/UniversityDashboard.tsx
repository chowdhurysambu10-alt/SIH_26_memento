import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { challengesService } from '../services/challenges.service';
import { collaborationService } from '../services/collaboration.service';
import { Challenge } from '../types/challenge.types';
import { Milestone } from '../types/collaboration.types';
import { ChallengeCard } from '../components/challenges/ChallengeCard';
import { ChallengeDetailModal } from '../components/challenges/ChallengeDetailModal';
import { TeamFormationModal } from '../components/collaboration/TeamFormationModal';
import { MilestoneApproveModal } from '../components/collaboration/MilestoneApproveModal';
import { StatCard } from '../components/common/StatCard';
import { MOCK_INSTITUTIONS } from '../services/mockData';
import {
  GraduationCap,
  Users,
  Layers,
  CheckCircle2,
  PlusCircle,
  Clock,
  DollarSign,
  Building2,
  Sparkles
} from 'lucide-react';

export const UniversityDashboard: React.FC = () => {
  const { user } = useAuth();
  const instId = user?.org_id || MOCK_INSTITUTIONS[0].id;
  const instName = user?.institution?.name || 'Birsa Institute of Technology (BIT) Sindri';

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await challengesService.getChallenges({ assigned_institution_id: instId });
      setChallenges(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [instId]);

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem 4rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#3b82f6', marginBottom: '0.25rem' }}>
            <GraduationCap size={16} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Academic Research & Innovation Portal</span>
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{instName}</h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Manage challenges auto-routed by Google AI Studio, form student-faculty research teams, and approve project deliverables.
          </p>
        </div>

        <div className="glass-pill" style={{ color: '#38bdf8' }}>
          <Building2 size={14} /> University Innovation Cell
        </div>
      </div>

      {/* Stats */}
      <div className="grid-cols-4">
        <StatCard
          label="AI Routed Challenges"
          value={challenges.length}
          subtext="Assigned by domain match"
          icon={<Layers size={20} />}
          glowColor="sapphire"
        />
        <StatCard
          label="Active Project Teams"
          value={challenges.filter((c) => c.status === 'team_formed' || c.status === 'in_progress').length}
          subtext="Faculty & student mentors"
          icon={<Users size={20} />}
          glowColor="emerald"
        />
        <StatCard
          label="Milestones in Review"
          value={1}
          subtext="Awaiting dean approval"
          icon={<Clock size={20} />}
          glowColor="amber"
        />
        <StatCard
          label="CSR Sponsorships"
          value="Rs 5.5L"
          subtext="Tata Steel CSR Grant"
          icon={<DollarSign size={20} />}
          glowColor="purple"
        />
      </div>

      {/* Routed Challenges Feed */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Institution Research Queue</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Click any challenge to form project teams, manage deliverables, or accept CSR offers
            </p>
          </div>
        </div>

        <div className="grid-cols-3">
          {challenges.map((ch) => (
            <ChallengeCard
              key={ch.id}
              challenge={ch}
              onSelect={(c) => {
                setSelectedChallenge(c);
                setDetailOpen(true);
              }}
            />
          ))}
        </div>
      </div>

      {/* Modals */}
      <ChallengeDetailModal
        challenge={selectedChallenge}
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        onRefresh={loadData}
        onOpenTeamModal={(ch) => {
          setSelectedChallenge(ch);
          setTeamModalOpen(true);
        }}
        onOpenApproveModal={(m) => {
          setSelectedMilestone(m);
          setApproveModalOpen(true);
        }}
      />

      <TeamFormationModal
        challenge={selectedChallenge}
        isOpen={teamModalOpen}
        onClose={() => setTeamModalOpen(false)}
        onSuccess={loadData}
      />

      <MilestoneApproveModal
        milestone={selectedMilestone}
        isOpen={approveModalOpen}
        onClose={() => setApproveModalOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
};
