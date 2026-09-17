import React, { useState, useEffect } from 'react';
import { dashboardsApi, DashboardChallenge, TopProblemsFilter } from '../api/dashboards';
import { challengesApi } from '../api/challenges';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
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
import { Lightbox } from '../components/Lightbox';

import { WEST_BENGAL_DISTRICTS, JHARKHAND_DISTRICTS } from '../constants/districts';

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
  const { showAlert } = useUI();
  const [challenges, setChallenges] = useState<DashboardChallenge[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [visibleCount, setVisibleCount] = useState<number>(10);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Filter States
  const [district, setDistrict] = useState<string>('All Districts');
  const [category, setCategory] = useState<string>('All Categories');
  const [status, setStatus] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('all');
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const [isFilterExpanded, setIsFilterExpanded] = useState<boolean>(false);

  const activeFilterCount =
    (district !== 'All Districts' ? 1 : 0) +
    (category !== 'All Categories' ? 1 : 0) +
    (status !== 'all' ? 1 : 0) +
    (timeRange !== 'all' ? 1 : 0);

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
      showAlert('Please sign in to support this challenge.', 'error');
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={fetchTopProblems}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '13.5px',
              padding: '0 14px',
              height: '38px',
              lineHeight: 1,
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            <RotateCw size={14} style={{ display: 'block', flexShrink: 0 }} />
            <span style={{ lineHeight: 1 }}>Refresh</span>
          </button>

          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '13.5px',
              padding: '0 14px',
              height: '38px',
              lineHeight: 1,
              borderRadius: '8px',
              background: isFilterExpanded ? '#eff6ff' : '#ffffff',
              borderColor: isFilterExpanded ? '#2563eb' : '#e2e8f0',
              color: isFilterExpanded ? '#2563eb' : '#0f172a',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <Filter size={14} style={{ display: 'block', flexShrink: 0 }} color={isFilterExpanded ? '#2563eb' : '#475569'} />
            <span style={{ lineHeight: 1 }}>Filter</span>
            {activeFilterCount > 0 && (
              <span
                style={{
                  background: '#2563eb',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '10px',
                  lineHeight: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: '2px',
                }}
              >
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div
        className={`top-problems-filter-bar ${isFilterExpanded ? 'expanded' : 'collapsed'}`}
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '18px 20px',
          marginBottom: '28px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
          alignItems: 'center',
        }}
      >
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
            <MapPin size={12} style={{ display: 'inline', marginRight: 4 }} /> District
          </label>
          <select value={district} onChange={(e) => setDistrict(e.target.value)} style={{ padding: '8px 12px', fontSize: '13.5px' }}>
            <option value="All Districts">All Districts</option>
            <optgroup label="West Bengal">
              {WEST_BENGAL_DISTRICTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </optgroup>
            <optgroup label="Jharkhand">
              {JHARKHAND_DISTRICTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </optgroup>
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
                {/* Ranking Rank (#1, #2, #3...) */}
                {(() => {
                  let badgeBg = '#f1f5f9';
                  let badgeColor = '#475569';
                  let badgeBorder = '1px solid #e2e8f0';
                  let badgeShadow = 'none';

                  if (index === 0) {
                    badgeBg = 'linear-gradient(135deg, #fef08a 0%, #facc15 100%)';
                    badgeColor = '#78350f';
                    badgeBorder = '1px solid #eab308';
                    badgeShadow = '0 2px 6px rgba(234, 179, 8, 0.3)';
                  } else if (index === 1) {
                    badgeBg = 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)';
                    badgeColor = '#334155';
                    badgeBorder = '1px solid #cbd5e1';
                    badgeShadow = '0 2px 6px rgba(100, 116, 139, 0.2)';
                  } else if (index === 2) {
                    badgeBg = 'linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%)';
                    badgeColor = '#9a3412';
                    badgeBorder = '1px solid #fdba74';
                    badgeShadow = '0 2px 6px rgba(249, 115, 22, 0.25)';
                  }

                  return (
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        background: badgeBg,
                        color: badgeColor,
                        border: badgeBorder,
                        boxShadow: badgeShadow,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: '16px',
                        flexShrink: 0,
                        letterSpacing: '-0.5px',
                      }}
                      title={`Rank #${index + 1}`}
                    >
                      #{index + 1}
                    </div>
                  );
                })()}

                {/* Content */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
                    <span className="tag tag-new">
                      <MapPin size={11} style={{ display: 'inline', marginRight: 4 }} />
                      {challenge.district || 'Jharkhand'}
                    </span>

                    {challenge.location_text && (
                      <a 
                        href={challenge.location_text.startsWith('http') ? challenge.location_text : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(challenge.location_text)}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        style={{ display: 'inline-flex', alignItems: 'center', background: '#eff6ff', color: '#2563eb', padding: '4px 10px', borderRadius: '16px', fontSize: '11.5px', fontWeight: 600, textDecoration: 'none' }}
                      >
                        <MapPin size={11} style={{ marginRight: 4 }} />
                        View Exact Location
                      </a>
                    )}

                    {challenge.category && (
                      <span className="tag tag-category">
                        <Tag size={11} style={{ display: 'inline', marginRight: 4 }} />
                        {challenge.category}
                      </span>
                    )}

                    {/* Highlighted Status Badge */}
                    {(() => {
                      const st = (challenge.status || 'SUBMITTED').toLowerCase();
                      const isCompleted = st === 'completed' || st === 'validated' || st === 'resolved';
                      const isInProgress = ['in_progress', 'team_formed', 'under_action', 'routed'].includes(st);
                      const isUnderReview = st === 'under_review';

                      if (isCompleted) {
                        return (
                          <span
                            style={{
                              marginLeft: 'auto',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '4px 12px',
                              borderRadius: '20px',
                              fontSize: '11.5px',
                              fontWeight: 800,
                              background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                              color: '#065f46',
                              border: '1px solid #6ee7b7',
                              boxShadow: '0 2px 5px rgba(16, 185, 129, 0.2)',
                              letterSpacing: '0.6px',
                              textTransform: 'uppercase',
                            }}
                          >
                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 4px #10b981' }} />
                            COMPLETED
                          </span>
                        );
                      }

                      if (isInProgress) {
                        return (
                          <span
                            style={{
                              marginLeft: 'auto',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '4px 12px',
                              borderRadius: '20px',
                              fontSize: '11.5px',
                              fontWeight: 800,
                              background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                              color: '#1d4ed8',
                              border: '1px solid #93c5fd',
                              boxShadow: '0 2px 5px rgba(37, 99, 235, 0.15)',
                              letterSpacing: '0.6px',
                              textTransform: 'uppercase',
                            }}
                          >
                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#2563eb', boxShadow: '0 0 4px #2563eb' }} />
                            {st === 'in_progress' ? 'IN PROGRESS' : st.replace('_', ' ').toUpperCase()}
                          </span>
                        );
                      }

                      if (isUnderReview) {
                        return (
                          <span
                            style={{
                              marginLeft: 'auto',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '4px 12px',
                              borderRadius: '20px',
                              fontSize: '11.5px',
                              fontWeight: 800,
                              background: 'linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)',
                              color: '#854d0e',
                              border: '1px solid #fde047',
                              boxShadow: '0 2px 5px rgba(202, 138, 4, 0.15)',
                              letterSpacing: '0.6px',
                              textTransform: 'uppercase',
                            }}
                          >
                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#eab308' }} />
                            UNDER REVIEW
                          </span>
                        );
                      }

                      return (
                        <span
                          style={{
                            marginLeft: 'auto',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            background: '#f8fafc',
                            color: '#475569',
                            border: '1px solid #cbd5e1',
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase',
                          }}
                        >
                          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#94a3b8' }} />
                          SUBMITTED
                        </span>
                      );
                    })()}
                  </div>

                  {/* Side-by-side row: Description on left, smaller photo on right */}
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: '12px' }}>
                    <div style={{ flex: '1 1 280px', minWidth: 0 }}>
                      <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>
                        {challenge.title}
                      </h3>
                      <p style={{ color: '#475569', fontSize: '14.5px', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
                        {challenge.description && challenge.description.length > 150 && !expandedIds.has(challenge.id)
                          ? challenge.description.substring(0, 150) + '...'
                          : challenge.description}
                        {challenge.description && challenge.description.length > 150 && (
                          <button 
                            onClick={() => {
                              setExpandedIds(prev => {
                                const next = new Set(prev);
                                if (next.has(challenge.id)) next.delete(challenge.id);
                                else next.add(challenge.id);
                                return next;
                              });
                            }}
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
                            {expandedIds.has(challenge.id) ? 'Show less' : 'Read more...'}
                          </button>
                        )}
                      </p>
                    </div>

                    {challenge.media_urls && challenge.media_urls.length > 0 && (
                      <div style={{ flexShrink: 0, alignSelf: 'flex-start' }}>
                        <div
                          style={{
                            position: 'relative',
                            width: '200px',
                            height: '135px',
                            borderRadius: '10px',
                            overflow: 'hidden',
                            border: '1px solid #e2e8f0',
                            background: '#f1f5f9',
                            cursor: 'pointer',
                            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)',
                          }}
                          onClick={() => setLightboxSrc(challenge.media_urls![0])}
                          title="Click to view full photo"
                        >
                          <img
                            src={challenge.media_urls[0]}
                            alt={challenge.title}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              display: 'block',
                              transition: 'transform 0.25s ease',
                            }}
                            onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                            onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                          />
                          <div style={{
                            position: 'absolute',
                            bottom: '6px',
                            right: '6px',
                            background: 'rgba(15, 23, 42, 0.75)',
                            color: '#fff',
                            fontSize: '10px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backdropFilter: 'blur(4px)',
                            fontWeight: 500,
                            pointerEvents: 'none'
                          }}>
                            Enlarge
                          </div>
                        </div>
                      </div>
                    )}
                  </div>


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



      <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </div>
  );
};
