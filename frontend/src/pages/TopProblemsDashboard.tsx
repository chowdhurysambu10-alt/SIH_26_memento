import React, { useState, useEffect } from 'react';
import { dashboardsApi, DashboardChallenge, TopProblemsFilter } from '../api/dashboards';
import { challengesApi } from '../api/challenges';
import { useAuth } from '../context/AuthContext';
import {
  Flame,
  Filter,
  MapPin,
  Tag,
  Clock,

  TrendingUp,
  RotateCw,
  Award,
  X,
} from 'lucide-react';

const DISTRICTS = [
  'All Districts',
  'Ranchi',
  'Dhanbad',
  'East Singhbhum (Jamshedpur)',
  'Bokaro',
  'Hazaribagh',
  'Deoghar',
  'Dumka',
  'Giridih',
  'Palamu',
  'Ramgarh',
];

const CATEGORIES = [
  'All Categories',
  'Water & Sanitation',
  'Healthcare',
  'Education',
  'Agriculture',
  'Urban Infrastructure',
  'Environment & Forestry',
  'Clean Energy',
  'Rural Livelihoods',
  'Accessibility & Inclusion',
  'Public Administration',
];

export const TopProblemsDashboard: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [challenges, setChallenges] = useState<DashboardChallenge[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [visibleCount, setVisibleCount] = useState<number>(10);
  const [readMoreChallenge, setReadMoreChallenge] = useState<DashboardChallenge | null>(null);

  // Filter States
  const [district, setDistrict] = useState<string>('All Districts');
  const [category, setCategory] = useState<string>('All Categories');
  const [status, setStatus] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('all');

  const fetchTopProblems = async () => {
    setLoading(true);
    try {
      const filter: TopProblemsFilter = {
        district: district !== 'All Districts' ? district : undefined,
        category: category !== 'All Categories' ? category : undefined,
        status: status !== 'all' ? status : undefined,
        timeRange,
      };
      const data = await dashboardsApi.getTopProblems(filter);
      setChallenges(data);
    } catch (err) {
      console.error('Failed to fetch top problems:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopProblems();
  }, [district, category, status, timeRange]);

  const handleSupport = async (id: string) => {
    if (!isAuthenticated) {
      alert('Please sign in to support this challenge.');
      return;
    }

    try {
      const res = await challengesApi.supportChallenge(id);
      const newCount = res?.support_count;

      setChallenges((prev) => {
        const updated = prev.map((c) => {
          if (c.id === id) {
            return {
              ...c,
              support_count: newCount !== undefined ? newCount : (Number(c.support_count) || 0) + 1,
            };
          }
          return c;
        });

        // Re-sort: highest priority score & support count
        return updated.sort((a, b) => {
          return (Number(b.support_count) || 0) - (Number(a.support_count) || 0);
        });
      });
    } catch (err) {
      console.warn('Support toggle failed:', err);
    }
  };

  const displayedChallenges = challenges.slice(0, visibleCount);

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '24px 20px 80px' }}>
      {/* Hero Header */}
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#eff6ff', padding: '6px 14px', borderRadius: '20px', color: '#2563eb', fontWeight: 600, fontSize: '13px', marginBottom: '8px' }}>
            <Flame size={16} /> Top Ranked Societal Challenges
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
            Highest Priority Problems in Jharkhand
          </h1>
          <p style={{ color: '#64748b', fontSize: '14.5px', marginTop: '4px' }}>
            Ranked by verified community upvotes.
          </p>
        </div>

        <button
          className="btn btn-outline"
          onClick={fetchTopProblems}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13.5px' }}
        >
          <RotateCw size={14} /> Refresh
        </button>
      </div>

      {/* Filter Bar */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '18px 20px',
          marginBottom: '28px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
          alignItems: 'center',
        }}
      >
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
            <MapPin size={12} style={{ display: 'inline', marginRight: 4 }} /> District
          </label>
          <select value={district} onChange={(e) => setDistrict(e.target.value)} style={{ padding: '8px 12px', fontSize: '13.5px' }}>
            {DISTRICTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
            <Tag size={12} style={{ display: 'inline', marginRight: 4 }} /> Category
          </label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ padding: '8px 12px', fontSize: '13.5px' }}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
            <Filter size={12} style={{ display: 'inline', marginRight: 4 }} /> Lifecycle Status
          </label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ padding: '8px 12px', fontSize: '13.5px' }}>
            <option value="all">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="under_action">Under Action / Claimed</option>
            <option value="resolved">Resolved / Completed</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
            <Clock size={12} style={{ display: 'inline', marginRight: 4 }} /> Time Range
          </label>
          <select value={timeRange} onChange={(e: any) => setTimeRange(e.target.value)} style={{ padding: '8px 12px', fontSize: '13.5px' }}>
            <option value="all">All Time</option>
            <option value="week">Past 7 Days</option>
            <option value="month">Past 30 Days</option>
          </select>
        </div>
      </div>

      {/* Challenge List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
          <TrendingUp size={32} className="animate-spin" style={{ margin: '0 auto 12px', color: '#2563eb' }} />
          <p>Analyzing ranking algorithms...</p>
        </div>
      ) : displayedChallenges.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
          <p style={{ color: '#64748b', fontSize: '15px' }}>No challenges match the selected filters.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {displayedChallenges.map((challenge, index) => {

            const supports = Number(challenge.support_count) || 0;

            return (
              <div
                key={challenge.id}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '24px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                  display: 'flex',
                  gap: '20px',
                  alignItems: 'flex-start',
                  position: 'relative',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
              >
                {/* Ranking Rank */}
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: index < 3 ? '#fef3c7' : '#f1f5f9',
                    color: index < 3 ? '#b45309' : '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '17px',
                    flexShrink: 0,
                  }}
                >
                  {index < 3 ? <Award size={20} /> : `#${index + 1}`}
                </div>

                {/* Content */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
                    <span className="tag tag-new">
                      <MapPin size={11} style={{ display: 'inline', marginRight: 4 }} />
                      {challenge.district || 'Jharkhand'}
                    </span>

                    {challenge.category && (
                      <span className="tag tag-category">
                        <Tag size={11} style={{ display: 'inline', marginRight: 4 }} />
                        {challenge.category}
                      </span>
                    )}



                    <span className="status" style={{ marginLeft: 'auto' }}>
                      {(challenge.status || 'SUBMITTED').replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                    {challenge.title}
                  </h3>

                  <p style={{ color: '#475569', fontSize: '14.5px', lineHeight: 1.6, marginBottom: '12px', whiteSpace: 'pre-wrap' }}>
                    {challenge.description && challenge.description.length > 150 
                      ? challenge.description.substring(0, 150) + '...'
                      : challenge.description}
                    {challenge.description && challenge.description.length > 150 && (
                      <button 
                        onClick={() => setReadMoreChallenge(challenge)}
                        style={{ 
                          background: 'none', 
                          border: 'none', 
                          color: '#2563eb', 
                          cursor: 'pointer', 
                          fontWeight: 600, 
                          marginLeft: '4px',
                          padding: 0 
                        }}
                      >
                        Read more...
                      </button>
                    )}
                  </p>

                  {challenge.ai_summary && (
                    <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', borderLeft: '3px solid #2563eb', fontSize: '13px', color: '#334155', marginBottom: '14px' }}>
                      <strong>AI Summary: </strong> {challenge.ai_summary}
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                    <button
                      className="interaction-btn"
                      onClick={() => handleSupport(challenge.id)}
                      style={{ color: '#ef4444' }}
                    >

                      <span>Support ({supports})</span>
                    </button>
                    <span style={{ fontSize: '12.5px', color: '#94a3b8' }}>
                      Submitted {new Date(challenge.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Load More Button */}
          {visibleCount < challenges.length && (
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <button
                className="btn btn-primary"
                onClick={() => setVisibleCount((prev) => prev + 10)}
                style={{ padding: '12px 32px', fontSize: '15px' }}
              >
                Load More Problems ({challenges.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </div>
      )}

      {readMoreChallenge && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <button className="modal-close" onClick={() => setReadMoreChallenge(null)}>
              <X size={20} />
            </button>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px', color: '#0f172a' }}>
              {readMoreChallenge.title}
            </h3>
            <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '8px' }}>
              <p style={{ whiteSpace: 'pre-wrap', color: '#475569', fontSize: '15px', lineHeight: 1.6 }}>
                {readMoreChallenge.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
