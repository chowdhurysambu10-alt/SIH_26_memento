import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { challengesService } from '../services/challenges.service';
import { Challenge } from '../types/challenge.types';
import { ChallengeCard } from '../components/challenges/ChallengeCard';
import { ChallengeDetailModal } from '../components/challenges/ChallengeDetailModal';
import { MilestoneSubmitModal } from '../components/collaboration/MilestoneSubmitModal';
import { StatCard } from '../components/common/StatCard';
import { UserCheck, Layers, UploadCloud, CheckCircle2, BookOpen, Clock } from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await challengesService.getChallenges();
      // Scoped student projects
      setChallenges(res.data.filter((c) => c.status === 'in_progress' || c.status === 'team_formed' || c.status === 'completed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem 4rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#ec4899', marginBottom: '0.25rem' }}>
            <UserCheck size={16} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Student Innovation Workspace</span>
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Welcome, {user?.name || 'Ananya Roy'}</h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Work on assigned university engineering projects, submit milestone deliverables, and track faculty review status.
          </p>
        </div>

        <div className="glass-pill" style={{ color: '#f472b6' }}>
          <BookOpen size={14} /> BIT Sindri Research Contributor
        </div>
      </div>

      {/* Stats */}
      <div className="grid-cols-3">
        <StatCard
          label="Assigned Projects"
          value={challenges.length}
          subtext="Active societal challenges"
          icon={<Layers size={20} />}
          glowColor="sapphire"
        />
        <StatCard
          label="Deliverables Submitted"
          value={2}
          subtext="Lab assays & CAD prototypes"
          icon={<UploadCloud size={20} />}
          glowColor="emerald"
        />
        <StatCard
          label="Approved Milestones"
          value={1}
          subtext="Faculty verified"
          icon={<CheckCircle2 size={20} />}
          glowColor="purple"
        />
      </div>

      {/* Projects List */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>My Assigned Research Projects</h3>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{challenges.length} Active</span>
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
        onOpenSubmitModal={(mId) => {
          setSelectedMilestoneId(mId);
          setSubmitModalOpen(true);
        }}
      />

      <MilestoneSubmitModal
        milestoneId={selectedMilestoneId}
        isOpen={submitModalOpen}
        onClose={() => setSubmitModalOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
};
