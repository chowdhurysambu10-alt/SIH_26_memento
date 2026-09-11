import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  Sparkles,
  MapPin,
  CheckCircle2,
  ChevronRight,
  Clock,
  ThumbsUp,
  Lightbulb,
} from 'lucide-react';
import { NavTab } from '../components/Header';
import { analyticsApi, OverviewAnalytics } from '../api/analytics';
import { challengesApi, Challenge } from '../api/challenges';

interface LandingPageProps {
  onNavigate: (tab: NavTab) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<OverviewAnalytics | null>(null);
  const [featuredChallenge, setFeaturedChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadRealDatabaseData = async () => {
      try {
        const [overviewData, challengeList] = await Promise.all([
          analyticsApi.getOverview().catch(() => null),
          challengesApi.getChallenges({ limit: 5 }).catch(() => [] as Challenge[]),
        ]);

        if (isMounted) {
          if (overviewData) {
            setStats(overviewData);
          }
          if (challengeList && challengeList.length > 0) {
            const sorted = [...challengeList].sort((a, b) => (b.support_count || 0) - (a.support_count || 0));
            setFeaturedChallenge(sorted[0]);
          } else {
            setFeaturedChallenge(null);
          }
        }
      } catch (err) {
        console.error('Failed to load real landing page data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadRealDatabaseData();
    return () => {
      isMounted = false;
    };
  }, []);

  const totalDistricts = stats?.districtBreakdown ? Object.keys(stats.districtBreakdown).length : 0;
  const totalChallenges = stats?.totals?.challenges ?? 0;
  const totalInstitutions = stats?.totals?.institutions ?? 0;
  const totalTeams = stats?.totals?.activeTeams ?? 0;

  return (
    <div className="landing-container">
      <style>{`
        .landing-container {
          min-height: calc(100vh - 70px);
          background: #ffffff;
          color: #0f172a;
          position: relative;
          overflow-x: hidden;
        }

        /* Subtle animated background glow */
        .landing-bg-orb-1 {
          position: absolute;
          top: -60px;
          left: 10%;
          width: 480px;
          height: 480px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(219, 234, 254, 0.55) 0%, rgba(239, 246, 255, 0) 70%);
          filter: blur(50px);
          pointer-events: none;
          animation: floatOrb 12s ease-in-out infinite alternate;
          z-index: 0;
        }

        .landing-bg-orb-2 {
          position: absolute;
          top: 200px;
          right: 5%;
          width: 420px;
          height: 420px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(224, 231, 255, 0.5) 0%, rgba(243, 232, 255, 0) 70%);
          filter: blur(50px);
          pointer-events: none;
          animation: floatOrb 14s ease-in-out infinite alternate-reverse;
          z-index: 0;
        }

        @keyframes floatOrb {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(20px, 30px) scale(1.05); }
          100% { transform: translate(-15px, 15px) scale(0.97); }
        }

        @keyframes floatHeroCard {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }

        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-in {
          animation: fadeInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .hero-section {
          position: relative;
          z-index: 1;
          max-width: 1200px;
          margin: 0 auto;
          padding: 56px 24px 48px;
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 48px;
          align-items: center;
        }

        @media (max-width: 968px) {
          .hero-section {
            grid-template-columns: 1fr;
            padding: 36px 20px 40px;
            text-align: center;
          }
        }

        .badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 9999px;
          font-size: 13px;
          font-weight: 600;
          color: #1d4ed8;
          margin-bottom: 20px;
        }

        .pulse-beacon {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #2563eb;
          animation: pulseDot 2s infinite ease-in-out;
        }

        .hero-title {
          font-size: 48px;
          line-height: 1.18;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -1.2px;
          margin-bottom: 16px;
        }

        .hero-title-accent {
          background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        @media (max-width: 640px) {
          .hero-title {
            font-size: 34px;
          }
        }

        .hero-subtitle {
          font-size: 17px;
          line-height: 1.6;
          color: #475569;
          margin-bottom: 28px;
          max-width: 540px;
        }

        .btn-primary-action {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: #2563eb;
          color: #ffffff;
          padding: 13px 28px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 15.5px;
          border: none;
          cursor: pointer;
          transition: all 0.25s ease;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);
        }

        .btn-primary-action:hover {
          background: #1d4ed8;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(37, 99, 235, 0.35);
        }

        /* Floating Hero Card */
        .hero-card-wrapper {
          position: relative;
          animation: floatHeroCard 6s ease-in-out infinite;
        }

        .hero-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: 24px;
          box-shadow: 0 16px 36px -10px rgba(15, 23, 42, 0.08);
          position: relative;
        }

        .card-header-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 12px;
          border-bottom: 1px solid #f1f5f9;
          margin-bottom: 16px;
        }

        .live-status-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #f0fdf4;
          color: #15803d;
          border: 1px solid #bbf7d0;
          padding: 4px 10px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 600;
          text-transform: capitalize;
        }

        .workflow-step-pill {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          margin-bottom: 8px;
        }

        /* Section layout */
        .section-wrap {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px 24px 48px;
          position: relative;
          z-index: 1;
        }

        /* Stats strip */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 36px;
        }

        .stat-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 20px;
          text-align: center;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.02);
          transition: transform 0.2s ease;
        }

        .stat-card:hover {
          transform: translateY(-3px);
          border-color: #cbd5e1;
        }

        .stat-number {
          font-size: 34px;
          font-weight: 800;
          color: #2563eb;
          line-height: 1.1;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 13.5px;
          font-weight: 500;
          color: #64748b;
        }

        /* Simple 3-step workflow row */
        .simple-steps {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 20px;
          margin: 20px 0;
        }

        .simple-step-item {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 20px;
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }

        .step-circle {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: #eff6ff;
          color: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 14px;
          flex-shrink: 0;
        }

        .simple-step-title {
          font-size: 15px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 2px;
        }

        .simple-step-desc {
          font-size: 13px;
          color: #64748b;
          line-height: 1.4;
        }
      `}</style>

      {/* Subtle Background Glow */}
      <div className="landing-bg-orb-1" />
      <div className="landing-bg-orb-2" />

      {/* 1. HERO SECTION */}
      <section className="hero-section animate-fade-in">
        <div className="hero-content">
          <div className="badge-pill">
            <span className="pulse-beacon" />
            <span>Smart India Hackathon 2026</span>
          </div>

          <h1 className="hero-title">
            Real Problems <br /> Real People
            <span className="hero-title-accent"> Real Solutions</span>
          </h1>

          <p className="hero-subtitle">
            {/* A collaborative platform connecting citizens, universities, and industry partners to solve real-world community challenges. */}
          </p>

          <div>
            <button
              className="btn-primary-action"
              onClick={() => onNavigate('feed')}
            >
              Explore Live Feed <ArrowRight size={18} />
            </button>
          </div>
        </div>

        {/* Hero Interactive Real Database Card */}
        <div className="hero-card-wrapper">
          <div className="hero-card">
            <div className="card-header-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#ef4444' }} />
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#f59e0b' }} />
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#10b981' }} />
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginLeft: '6px' }}>
                  Live Challenge
                </span>
              </div>
              <div className="live-status-pill">
                <span className="pulse-beacon" style={{ background: featuredChallenge ? '#16a34a' : '#2563eb' }} />
                {featuredChallenge ? (featuredChallenge.status ? featuredChallenge.status.replace(/_/g, ' ') : 'Live') : 'Connected'}
              </div>
            </div>

            {loading ? (
              <div style={{ padding: '32px 0', textAlign: 'center', color: '#64748b' }}>
                <Clock size={22} className="animate-spin" style={{ margin: '0 auto 8px', color: '#2563eb' }} />
                <p style={{ fontSize: '13px' }}>Loading real records...</p>
              </div>
            ) : featuredChallenge ? (
              /* REAL CHALLENGE FROM DATABASE */
              <div>
                {featuredChallenge.media_urls && featuredChallenge.media_urls.length > 0 && (
                  <div style={{ width: '100%', height: '130px', borderRadius: '10px', overflow: 'hidden', marginBottom: '12px', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    <img
                      src={featuredChallenge.media_urls[0]}
                      alt={featuredChallenge.title}
                      style={{ width: '100%', height: '130px', objectFit: 'cover' }}
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  {featuredChallenge.district && (
                    <span style={{ fontSize: '11px', background: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: '5px', fontWeight: 600 }}>
                      <MapPin size={10} style={{ display: 'inline', marginRight: 3 }} /> {featuredChallenge.district}
                    </span>
                  )}
                  {featuredChallenge.categories?.name && (
                    <span style={{ fontSize: '11px', background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '5px', fontWeight: 600 }}>
                      {featuredChallenge.categories.name}
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '6px', lineHeight: 1.3 }}>
                  {featuredChallenge.title}
                </h3>

                <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.45, marginBottom: '12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {featuredChallenge.description}
                </p>

                <div className="workflow-step-pill">
                  <Sparkles size={15} color="#2563eb" />
                  <div style={{ fontSize: '12px', flex: 1, color: '#1e40af' }}>
                    <strong>Status:</strong> {featuredChallenge.institutions?.name || (featuredChallenge.assigned_institution_id ? 'Institution Adopted' : 'Open for Institution Claim')}
                  </div>
                </div>

                <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#64748b', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: '#2563eb' }}>
                    <ThumbsUp size={12} /> {featuredChallenge.support_count ?? 0} Upvotes
                  </span>
                  <span
                    style={{ color: '#2563eb', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}
                    onClick={() => onNavigate('feed')}
                  >
                    View in Feed <ChevronRight size={13} />
                  </span>
                </div>
              </div>
            ) : (
              /* REAL DATABASE EMPTY STATE */
              <div style={{ textAlign: 'center', padding: '16px 8px' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                  <Lightbulb size={20} />
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                  Database Ready
                </h3>
                <p style={{ fontSize: '12.5px', color: '#64748b', lineHeight: 1.4, marginBottom: '14px' }}>
                  No challenges submitted yet.
                </p>
                <button
                  className="btn-primary-action"
                  style={{ width: '100%', justifyContent: 'center', fontSize: '13.5px', padding: '9px 14px' }}
                  onClick={() => onNavigate('submit')}
                >
                  Submit Challenge
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 2. REAL DATABASE METRICS */}
      <section className="section-wrap" style={{ paddingTop: 0 }}>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{loading ? '...' : totalDistricts}</div>
            <div className="stat-label">Districts with Reports</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{loading ? '...' : totalChallenges}</div>
            <div className="stat-label">Challenges in Database</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{loading ? '...' : totalInstitutions}</div>
            <div className="stat-label">Academic Institutions</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{loading ? '...' : totalTeams}</div>
            <div className="stat-label">Active Project Teams</div>
          </div>
        </div>

        {/* Simple 3-step overview (No unrequired walls of text) */}
        <div className="simple-steps">
          <div className="simple-step-item">
            <div className="step-circle">1</div>
            <div>
              <div className="simple-step-title">Crowdsource</div>
              <div className="simple-step-desc">Citizens submit local problems with photos & GPS.</div>
            </div>
          </div>

          <div className="simple-step-item">
            <div className="step-circle">2</div>
            <div>
              <div className="simple-step-title">AI Routing</div>
              <div className="simple-step-desc">Automated categorization & priority verification.</div>
            </div>
          </div>

          <div className="simple-step-item">
            <div className="step-circle">3</div>
            <div>
              <div className="simple-step-title">Collaborative R&D</div>
              <div className="simple-step-desc">Universities & industry partners deploy solutions.</div>
            </div>
          </div>
        </div>
      </section>

      {/* Clean Minimal Footer */}
      <footer style={{ borderTop: '1px solid #f1f5f9', padding: '24px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px', background: '#ffffff' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ fontWeight: 700, color: '#2563eb', fontSize: '16px' }}>
            Memento
          </div>
          <div>
            Societal Innovation & Problem Crowdsourcing Platform
          </div>
          <div style={{ display: 'flex', gap: '16px', color: '#64748b' }}>
            <span style={{ cursor: 'pointer' }} onClick={() => onNavigate('feed')}>Feed</span>
            <span style={{ cursor: 'pointer' }} onClick={() => onNavigate('statistics')}>Statistics</span>
            <span style={{ cursor: 'pointer' }} onClick={() => onNavigate('community')}>Community</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
