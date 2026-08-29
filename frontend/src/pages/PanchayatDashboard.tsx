import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { challengesService } from '../services/challenges.service';
import { usersService } from '../services/users.service';
import { Challenge } from '../types/challenge.types';
import { User } from '../types/auth.types';
import { ChallengeCard } from '../components/challenges/ChallengeCard';
import { ChallengeDetailModal } from '../components/challenges/ChallengeDetailModal';
import { StatCard } from '../components/common/StatCard';
import { Landmark, MapPin, Users, CheckCircle, Clock, Shield, Filter } from 'lucide-react';

export const PanchayatDashboard: React.FC = () => {
  const { user } = useAuth();
  const district = user?.district || 'Dumka';
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [districtUsers, setDistrictUsers] = useState<User[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [chRes, uRes] = await Promise.all([
        challengesService.getChallenges({ district }),
        usersService.getUsers({ district }),
      ]);
      setChallenges(chRes.data);
      setDistrictUsers(uRes);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [district]);

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem 4rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#06b6d4', marginBottom: '0.25rem' }}>
            <Landmark size={16} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>PRI / ULB Local Governance Console</span>
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Panchayat Bhavan - {district} District</h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Review and monitor local civic submissions, track institutional routing to universities, and endorse village priorities.
          </p>
        </div>

        <div className="glass-pill" style={{ fontSize: '0.85rem' }}>
          <MapPin size={14} color="#10b981" /> Jurisdiction: {district} District, Jharkhand
        </div>
      </div>

      {/* Stats */}
      <div className="grid-cols-3">
        <StatCard
          label="District Sourced Issues"
          value={challenges.length}
          subtext={`In ${district} jurisdiction`}
          icon={<Landmark size={20} />}
          glowColor="sapphire"
        />
        <StatCard
          label="Assigned to Universities"
          value={challenges.filter((c) => c.status === 'routed' || c.status === 'team_formed' || c.status === 'in_progress').length}
          subtext="Under technical development"
          icon={<Clock size={20} />}
          glowColor="emerald"
        />
        <StatCard
          label="Verified Local Citizens"
          value={districtUsers.length}
          subtext="Active community reporters"
          icon={<Users size={20} />}
          glowColor="amber"
        />
      </div>

      {/* Challenges Feed */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Societal Challenges in {district}</h3>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{challenges.length} Active in Block</span>
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

      {/* Detail Modal */}
      <ChallengeDetailModal
        challenge={selectedChallenge}
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        onRefresh={loadData}
      />
    </div>
  );
};
