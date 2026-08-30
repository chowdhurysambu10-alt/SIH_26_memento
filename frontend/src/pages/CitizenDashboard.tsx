import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { challengesService } from '../services/challenges.service';
import { Challenge } from '../types/challenge.types';
import { ChallengeCard } from '../components/challenges/ChallengeCard';
import { ChallengeDetailModal } from '../components/challenges/ChallengeDetailModal';
import { StatCard } from '../components/common/StatCard';
import { PlusCircle, Layers, CheckCircle2, Clock, MapPin, Sparkles } from 'lucide-react';

interface CitizenDashboardProps {
  onNavigate: (page: string) => void;
}

export const CitizenDashboard: React.FC<CitizenDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const loadMyChallenges = async () => {
    setLoading(true);
    try {
      const res = await challengesService.getChallenges();
      setChallenges(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyChallenges();
  }, []);

  const totalSubmitted = challenges.length;
  const inProgressCount = challenges.filter((c) => c.status === 'in_progress' || c.status === 'team_formed' || c.status === 'routed').length;
  const resolvedCount = challenges.filter((c) => c.status === 'completed' || c.status === 'validated').length;

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem 4rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981', marginBottom: '0.25rem' }}>
            <Sparkles size={16} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Citizen Civic Workspace</span>
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Welcome, {user?.name || 'Rajesh Soren'}</h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Track your lodged societal challenges, monitor university AI routing, and view field resolution updates in {user?.district || 'Dumka'}.
          </p>
        </div>

        <button
          onClick={() => onNavigate('citizen-new')}
          className="btn btn-primary btn-lg"
          style={{ gap: '0.5rem' }}
        >
          <PlusCircle size={18} />
          <span>Submit New Problem</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid-cols-3">
        <StatCard
          label="My Lodged Issues"
          value={totalSubmitted}
          subtext="Grassroots problems filed"
          icon={<Layers size={20} />}
          glowColor="emerald"
        />
        <StatCard
          label="In Research & Engineering"
          value={inProgressCount}
          subtext="Routed to university labs"
          icon={<Clock size={20} />}
          glowColor="sapphire"
        />
        <StatCard
          label="Resolved on Ground"
          value={resolvedCount}
          subtext="Validated solutions deployed"
          icon={<CheckCircle2 size={20} />}
          glowColor="purple"
        />
      </div>

      {/* My Submissions Feed */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>My Submitted Challenges</h3>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{challenges.length} Records</span>
        </div>

        {challenges.length > 0 ? (
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
        ) : (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'var(--bg-glass)', borderRadius: 'var(--radius-lg)' }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>You haven't submitted any problems yet.</p>
            <button onClick={() => onNavigate('citizen-new')} className="btn btn-primary">
              Lodge Your First Challenge
            </button>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <ChallengeDetailModal
        challenge={selectedChallenge}
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        onRefresh={loadMyChallenges}
      />
    </div>
  );
};
