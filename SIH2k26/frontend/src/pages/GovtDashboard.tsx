import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { challengesService } from '../services/challenges.service';
import { analyticsService } from '../services/analytics.service';
import { Challenge } from '../types/challenge.types';
import { AnalyticsOverview, DistrictAnalytics } from '../types/analytics.types';
import { JharkhandMap } from '../components/gis/JharkhandMap';
import { ChallengeCard } from '../components/challenges/ChallengeCard';
import { ChallengeDetailModal } from '../components/challenges/ChallengeDetailModal';
import { AiOverrideModal } from '../components/admin/AiOverrideModal';
import { StatCard } from '../components/common/StatCard';
import { Shield, MapPin, Activity, CheckCircle2, Layers, DollarSign, Filter } from 'lucide-react';

export const GovtDashboard: React.FC = () => {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [districtData, setDistrictData] = useState<DistrictAnalytics[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [chRes, ovRes, dstRes] = await Promise.all([
        challengesService.getChallenges({ district: selectedDistrict || undefined }),
        analyticsService.getOverview(),
        analyticsService.getByDistrict(),
      ]);
      setChallenges(chRes.data);
      setAnalytics(ovRes);
      setDistrictData(dstRes);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDistrict]);

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem 4rem', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#14b8a6', marginBottom: '0.25rem' }}>
            <Shield size={16} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>State Government Authority Command Center</span>
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Jharkhand Statewide Innovation Monitoring</h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Real-time geospatial intelligence, university resolution oversight, AI routing overrides, and solution validation across 24 districts.
          </p>
        </div>

        <div className="glass-pill" style={{ color: '#2dd4bf' }}>
          <Activity size={14} /> Department of Planning & Development
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid-cols-4">
        <StatCard
          label="Total Statewide Problems"
          value={analytics?.total_challenges || 148}
          subtext="Crowdsourced from citizens & PRI"
          icon={<Layers size={20} />}
          glowColor="emerald"
        />
        <StatCard
          label="In Technical Development"
          value={(analytics?.by_status.routed || 42) + (analytics?.by_status.in_progress || 26)}
          subtext="Active university teams"
          icon={<Activity size={20} />}
          glowColor="sapphire"
        />
        <StatCard
          label="Validated Solutions"
          value={analytics?.resolved_challenges || 16}
          subtext="On-ground verified"
          icon={<CheckCircle2 size={20} />}
          glowColor="purple"
        />
        <StatCard
          label="Corporate CSR Deployed"
          value="Rs 42.5L"
          subtext="Tata Steel & CCL matching"
          icon={<DollarSign size={20} />}
          glowColor="amber"
        />
      </div>

      {/* Interactive GIS Heatmap */}
      <JharkhandMap
        districtData={districtData}
        selectedDistrict={selectedDistrict}
        onSelectDistrict={(d) => setSelectedDistrict(d)}
      />

      {/* Filtered District Feed */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>
              {selectedDistrict ? `Challenges in ${selectedDistrict} District` : 'Statewide Challenge Feed'}
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Click any challenge to inspect full AI analysis, re-route university labs, or validate solutions
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
        onOpenAiOverrideModal={(ch) => {
          setSelectedChallenge(ch);
          setOverrideOpen(true);
        }}
      />

      <AiOverrideModal
        challenge={selectedChallenge}
        isOpen={overrideOpen}
        onClose={() => setOverrideOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
};
