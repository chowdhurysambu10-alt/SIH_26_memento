import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { challengesService } from '../services/challenges.service';
import { Challenge } from '../types/challenge.types';
import { ChallengeCard } from '../components/challenges/ChallengeCard';
import { ChallengeDetailModal } from '../components/challenges/ChallengeDetailModal';
import { ProposalModal } from '../components/collaboration/ProposalModal';
import { StatCard } from '../components/common/StatCard';
import { Building2, DollarSign, Handshake, CheckCircle2, Sparkles, Filter } from 'lucide-react';

export const IndustryDashboard: React.FC = () => {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [proposalModalOpen, setProposalModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await challengesService.getChallenges();
      setChallenges(res.data);
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#f59e0b', marginBottom: '0.25rem' }}>
            <Building2 size={16} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Corporate CSR & Industry Partner Hub</span>
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>
            {user?.institution?.name || 'Tata Steel CSR Foundation'}
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Discover high-impact societal challenges across Jharkhand eligible for CSR grant funding, pilot site testing, and university R&D incubation.
          </p>
        </div>

        <div className="glass-pill" style={{ color: '#fbbf24' }}>
          <Handshake size={14} /> CSR Partnership Portal
        </div>
      </div>

      {/* Stats */}
      <div className="grid-cols-3">
        <StatCard
          label="Open CSR Opportunities"
          value={challenges.length}
          subtext="Grassroots problems seeking sponsors"
          icon={<Building2 size={20} />}
          glowColor="amber"
        />
        <StatCard
          label="Total CSR Funds Committed"
          value="Rs 42.5 Lakhs"
          subtext="Across 6 university projects"
          icon={<DollarSign size={20} />}
          glowColor="emerald"
        />
        <StatCard
          label="Active Industry Engagements"
          value={2}
          subtext="Dumka water & Jharia dust projects"
          icon={<CheckCircle2 size={20} />}
          glowColor="sapphire"
        />
      </div>

      {/* Opportunities Feed */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Explore Societal Problems for CSR Sponsorship</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Click any problem to submit financial grants, lab equipment, or pilot test sites
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
        onOpenProposalModal={(ch) => {
          setSelectedChallenge(ch);
          setProposalModalOpen(true);
        }}
      />

      <ProposalModal
        challenge={selectedChallenge}
        isOpen={proposalModalOpen}
        onClose={() => setProposalModalOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
};
