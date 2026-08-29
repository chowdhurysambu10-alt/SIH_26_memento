import React, { useState, useEffect } from 'react';
import { challengesService } from '../services/challenges.service';
import { analyticsService } from '../services/analytics.service';
import { Challenge } from '../types/challenge.types';
import { AnalyticsOverview, DistrictAnalytics, InstitutionLeaderboardItem } from '../types/analytics.types';
import { JharkhandMap } from '../components/gis/JharkhandMap';
import { ChallengeCard } from '../components/challenges/ChallengeCard';
import { StatCard } from '../components/common/StatCard';
import { ChallengeDetailModal } from '../components/challenges/ChallengeDetailModal';
import { TeamFormationModal } from '../components/collaboration/TeamFormationModal';
import { ProposalModal } from '../components/collaboration/ProposalModal';
import { AiOverrideModal } from '../components/admin/AiOverrideModal';
import { MOCK_CATEGORIES, JHARKHAND_DISTRICTS } from '../services/mockData';
import {
  Sparkles,
  Compass,
  PlusCircle,
  Search,
  Filter,
  CheckCircle2,
  Users,
  Building2,
  DollarSign,
  Layers,
  ArrowRight,
  TrendingUp,
  Activity,
  Award,
  Zap
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [districtData, setDistrictData] = useState<DistrictAnalytics[]>([]);
  const [leaderboard, setLeaderboard] = useState<InstitutionLeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modals
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [proposalModalOpen, setProposalModalOpen] = useState(false);
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [chData, ovData, dstData, instData] = await Promise.all([
        challengesService.getChallenges({
          search: searchQuery || undefined,
          category_slug: selectedCategory || undefined,
          district: selectedDistrict || undefined,
          status: selectedStatus !== 'all' ? selectedStatus : undefined,
        }),
        analyticsService.getOverview(),
        analyticsService.getByDistrict(),
        analyticsService.getInstitutions(),
      ]);

      setChallenges(chData.data);
      setAnalytics(ovData);
      setDistrictData(dstData);
      setLeaderboard(instData);
    } catch (err) {
      console.error('Failed to load homepage data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchQuery, selectedCategory, selectedDistrict, selectedStatus]);

  const handleCardClick = (ch: Challenge) => {
    setSelectedChallenge(ch);
    setDetailModalOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem', paddingBottom: '4rem' }}>
      {/* 1. HERO SECTION */}
      <section
        style={{
          position: 'relative',
          padding: '4.5rem 0 3.5rem',
          background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.05) 0%, rgba(9, 13, 22, 0) 100%)',
          borderBottom: '1px solid var(--border-subtle)',
          overflow: 'hidden',
        }}
      >
        <div className="container" style={{ textAlign: 'center', maxWidth: '980px' }}>
          <div className="glass-pill" style={{ marginBottom: '1.25rem', color: '#34d399' }}>
            <Sparkles size={14} /> Smart India Hackathon 2026 Statewide Solution
          </div>

          <h1 style={{ marginBottom: '1.25rem', lineHeight: 1.15 }}>
            Crowdsourcing & Solving Societal Challenges Across{' '}
            <span className="text-gradient-emerald">Jharkhand</span> With{' '}
            <span className="text-gradient-sapphire">Google AI Studio</span>
          </h1>

          <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', marginBottom: '2.25rem', lineHeight: 1.6 }}>
            Directly bridge grassroots citizens and panchayats with premier universities like BIT Sindri and NIT Jamshedpur, powered by Gemma 2 AI deduplication and CSR funding partnerships.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => onNavigate('citizen-new')}
              className="btn btn-primary btn-lg"
              style={{ gap: '0.6rem' }}
            >
              <PlusCircle size={20} />
              <span>Submit a Problem</span>
            </button>

            <button
              onClick={() => {
                const el = document.getElementById('challenges-feed');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="btn btn-secondary btn-lg"
              style={{ gap: '0.6rem' }}
            >
              <Compass size={20} />
              <span>Explore Open Challenges</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. LIVE IMPACT METRICS */}
      <section className="container">
        <div className="grid-cols-4">
          <StatCard
            label="Total Challenges Lodged"
            value={analytics?.total_challenges || 148}
            subtext="From 24 Jharkhand districts"
            icon={<Layers size={22} />}
            trend="+18% this month"
            glowColor="emerald"
          />
          <StatCard
            label="Active Research Teams"
            value={analytics?.active_teams || 34}
            subtext="Faculty mentors & students"
            icon={<Users size={22} />}
            trend="+6 teams formed"
            glowColor="sapphire"
          />
          <StatCard
            label="Verified Solutions"
            value={analytics?.resolved_challenges || 16}
            subtext="On-ground deployed"
            icon={<CheckCircle2 size={22} />}
            trend="100% Govt verified"
            glowColor="purple"
          />
          <StatCard
            label="Committed CSR Grants"
            value={`Rs ${( (analytics?.csr_funding_committed || 4250000) / 100000 ).toFixed(1)} Lakhs`}
            subtext="Tata Steel & CCL CSR"
            icon={<DollarSign size={22} />}
            trend="Active funding"
            glowColor="amber"
          />
        </div>
      </section>

      {/* 3. INTERACTIVE 24-DISTRICT GIS HEATMAP */}
      <section className="container">
        <JharkhandMap
          districtData={districtData}
          selectedDistrict={selectedDistrict}
          onSelectDistrict={(d) => setSelectedDistrict(d)}
        />
      </section>

      {/* 4. 10 PRE-SEEDED DOMAIN EXPLORER */}
      <section className="container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>10 Core Societal Focus Domains</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Grassroots categories classified and auto-routed by Google AI Studio Gemma 2 models
            </p>
          </div>
          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory(null)}
              className="btn btn-ghost btn-sm"
              style={{ color: 'var(--emerald-500)' }}
            >
              Clear Category Filter
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem' }}>
          {MOCK_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.slug;
            return (
              <div
                key={cat.id}
                onClick={() => setSelectedCategory(isSelected ? null : cat.slug)}
                className="glass-panel"
                style={{
                  padding: '1.25rem',
                  cursor: 'pointer',
                  border: isSelected ? '2px solid var(--emerald-500)' : '1px solid var(--border-subtle)',
                  background: isSelected ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-card)',
                  transition: 'all 0.25s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '1.05rem', fontWeight: 700, color: isSelected ? 'var(--emerald-500)' : 'var(--text-primary)' }}>
                    {cat.name}
                  </span>
                  <Zap size={15} color={isSelected ? '#10b981' : '#64748b'} />
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginTop: 'auto' }}>
                  {cat.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. PUBLIC CHALLENGE DISCOVERY FEED */}
      <section id="challenges-feed" className="container">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Public Societal Challenge Feed</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Showing {challenges.length} active civic issues awaiting collaboration & resolution
              </p>
            </div>

            {/* Quick Filters */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              {/* Search Bar */}
              <div style={{ position: 'relative', minWidth: '240px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search challenges..."
                  className="form-input"
                  style={{ paddingLeft: '2.25rem', fontSize: '0.85rem' }}
                />
              </div>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="form-select"
                style={{ fontSize: '0.85rem', width: 'auto' }}
              >
                <option value="all">All Lifecycle States</option>
                <option value="submitted">Submitted</option>
                <option value="routed">AI Routed</option>
                <option value="team_formed">Team Formed</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="validated">Govt Validated</option>
              </select>

              {/* District Filter */}
              <select
                value={selectedDistrict || ''}
                onChange={(e) => setSelectedDistrict(e.target.value || null)}
                className="form-select"
                style={{ fontSize: '0.85rem', width: 'auto' }}
              >
                <option value="">All 24 Districts</option>
                {JHARKHAND_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Challenge Cards Grid */}
        {challenges.length > 0 ? (
          <div className="grid-cols-3">
            {challenges.map((ch) => (
              <ChallengeCard key={ch.id} challenge={ch} onSelect={handleCardClick} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'var(--bg-glass)', borderRadius: 'var(--radius-lg)' }}>
            <Compass size={40} style={{ margin: '0 auto 1rem', color: 'var(--text-muted)', opacity: 0.5 }} />
            <h4 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>No Challenges Found</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Try resetting your search or filter parameters.
            </p>
          </div>
        )}
      </section>

      {/* 6. INSTITUTIONAL LEADERBOARD */}
      <section className="container">
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f59e0b', marginBottom: '0.25rem' }}>
                <Award size={18} />
                <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Academic Excellence</span>
              </div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Top Contributing Universities in Jharkhand</h3>
            </div>
            <span className="glass-pill" style={{ color: '#10b981', fontSize: '0.8rem' }}>
              <TrendingUp size={14} /> Live Ranking
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {leaderboard.map((item, idx) => (
              <div
                key={item.id}
                style={{
                  background: 'var(--bg-glass)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.6rem',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: idx === 0 ? '#f59e0b' : idx === 1 ? '#94a3b8' : '#3b82f6',
                    color: '#090d16',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  #{idx + 1}
                </span>

                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', paddingRight: '2rem' }}>
                  {item.name}
                </h4>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  District: {item.district}
                </span>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Assigned:</span>
                    <strong style={{ fontSize: '1rem', color: '#ffffff', display: 'block' }}>{item.assigned_challenges_count}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Completed:</span>
                    <strong style={{ fontSize: '1rem', color: '#4ade80', display: 'block' }}>{item.completed_challenges_count}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MODALS */}
      <ChallengeDetailModal
        challenge={selectedChallenge}
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        onRefresh={loadData}
        onOpenTeamModal={(ch) => {
          setSelectedChallenge(ch);
          setTeamModalOpen(true);
        }}
        onOpenProposalModal={(ch) => {
          setSelectedChallenge(ch);
          setProposalModalOpen(true);
        }}
        onOpenAiOverrideModal={(ch) => {
          setSelectedChallenge(ch);
          setOverrideModalOpen(true);
        }}
      />

      <TeamFormationModal
        challenge={selectedChallenge}
        isOpen={teamModalOpen}
        onClose={() => setTeamModalOpen(false)}
        onSuccess={loadData}
      />

      <ProposalModal
        challenge={selectedChallenge}
        isOpen={proposalModalOpen}
        onClose={() => setProposalModalOpen(false)}
        onSuccess={loadData}
      />

      <AiOverrideModal
        challenge={selectedChallenge}
        isOpen={overrideModalOpen}
        onClose={() => setOverrideModalOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
};
