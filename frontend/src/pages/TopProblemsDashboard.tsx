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
  X,
  ThumbsUp,
  ZoomIn,
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
  const [challenges, setChallenges] = useState<DashboardChallenge[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [visibleCount, setVisibleCount] = useState<number>(10);
  const [readMoreChallenge, setReadMoreChallenge] = useState<DashboardChallenge | null>(null);

  // Filter States
  const [district, setDistrict] = useState<string>('All Districts');
  const [category, setCategory] = useState<string>('All Categories');
  const [status, setStatus] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('all');
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

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
    <div className="top-problems-container">
      {/* Hero Header */}
      <div className="top-problems-header-bar">
        <div>
          <div className="top-ranked-badge">
            <Flame size={15} /> Top Ranked Societal Challenges
          </div>
          <h1 className="top-problems-title">Highest Priority Problems</h1>
          <p className="top-problems-subtitle">
            Ranked dynamically by verified citizen votes and regional priority.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline refresh-top-btn"
          onClick={fetchTopProblems}
          aria-label="Refresh top problems"
        >
          <RotateCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="top-problems-filter-grid">
        <div className="filter-select-wrap">
          <label className="filter-label">
            <MapPin size={12} style={{ display: 'inline', marginRight: 4 }} /> District
          </label>
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="input-field select-field"
          >
            <option value="All Districts">All Districts</option>
            <optgroup label="West Bengal">
              {WEST_BENGAL_DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </optgroup>
            <optgroup label="Jharkhand">
              {JHARKHAND_DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        <div className="filter-select-wrap">
          <label className="filter-label">
            <Tag size={12} style={{ display: 'inline', marginRight: 4 }} /> Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input-field select-field"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-select-wrap">
          <label className="filter-label">
            <Filter size={12} style={{ display: 'inline', marginRight: 4 }} /> Lifecycle Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="input-field select-field"
          >
            <option value="all">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="under_action">Under Action / Claimed</option>
            <option value="resolved">Resolved / Completed</option>
          </select>
        </div>

        <div className="filter-select-wrap">
          <label className="filter-label">
            <Clock size={12} style={{ display: 'inline', marginRight: 4 }} /> Time Range
          </label>
          <select
            value={timeRange}
            onChange={(e: any) => setTimeRange(e.target.value)}
            className="input-field select-field"
          >
            <option value="all">All Time</option>
            <option value="week">Past 7 Days</option>
            <option value="month">Past 30 Days</option>
          </select>
        </div>
      </div>

      {/* Challenge List */}
      {loading ? (
        <div className="top-problems-loading">
          <TrendingUp size={32} className="animate-spin" color="#2563eb" style={{ margin: '0 auto 12px' }} />
          <p>Analyzing ranking algorithms & priority scores...</p>
        </div>
      ) : displayedChallenges.length === 0 ? (
        <div className="top-problems-empty">
          <p>No challenges match the selected filters.</p>
        </div>
      ) : (
        <div className="top-problems-list">
          {displayedChallenges.map((challenge, index) => {
            const supports = Number(challenge.support_count) || 0;

            return (
              <div key={challenge.id} className="top-problem-card card-dynamic">
                {/* Ranking Rank Badge */}
                <div className={`rank-badge rank-pos-${index < 3 ? index + 1 : 'other'}`}>
                  #{index + 1}
                </div>

                {/* Content Body */}
                <div className="top-problem-body">
                  <div className="feed-meta" style={{ marginBottom: '8px' }}>
                    <span className="tag tag-district">
                      <MapPin size={11} style={{ display: 'inline', marginRight: 4 }} />
                      {challenge.district || 'Jharkhand'}
                    </span>

                    {challenge.category && (
                      <span className="tag tag-category">
                        <Tag size={11} style={{ display: 'inline', marginRight: 4 }} />
                        {challenge.category}
                      </span>
                    )}

                    {/* Status Badge */}
                    {(() => {
                      const st = (challenge.status || 'SUBMITTED').toLowerCase();
                      const isCompleted = st === 'completed' || st === 'validated' || st === 'resolved';
                      const isInProgress = ['in_progress', 'team_formed', 'under_action', 'routed'].includes(st);
                      const isUnderReview = st === 'under_review';

                      if (isCompleted) {
                        return (
                          <span className="status-badge status-completed">
                            <span className="status-dot dot-green" /> COMPLETED
                          </span>
                        );
                      }

                      if (isInProgress) {
                        return (
                          <span className="status-badge status-inprogress">
                            <span className="status-dot dot-blue" />
                            {st === 'in_progress' ? 'IN PROGRESS' : st.replace('_', ' ').toUpperCase()}
                          </span>
                        );
                      }

                      if (isUnderReview) {
                        return (
                          <span className="status-badge status-under-review">
                            <span className="status-dot dot-yellow" /> UNDER REVIEW
                          </span>
                        );
                      }

                      return (
                        <span className="status-badge status-submitted">
                          <span className="status-dot dot-gray" /> SUBMITTED
                        </span>
                      );
                    })()}
                  </div>

                  {/* Text & Media Row */}
                  <div className="feed-body-layout" style={{ marginBottom: '10px' }}>
                    <div className="feed-text-content">
                      <h3 className="feed-card-title">{challenge.title}</h3>
                      <p className="feed-card-description">
                        {challenge.description && challenge.description.length > 150
                          ? challenge.description.substring(0, 150) + '...'
                          : challenge.description}
                        {challenge.description && challenge.description.length > 150 && (
                          <button
                            type="button"
                            onClick={() => setReadMoreChallenge(challenge)}
                            className="read-more-link"
                          >
                            Read more...
                          </button>
                        )}
                      </p>
                    </div>

                    {challenge.media_urls && challenge.media_urls.length > 0 && (
                      <div className="feed-media-section">
                        <div
                          className="feed-single-media-wrap"
                          onClick={() => setLightboxSrc(challenge.media_urls![0])}
                          title="Tap to view photo"
                        >
                          <img
                            src={challenge.media_urls[0]}
                            alt={challenge.title}
                            className="feed-media-element"
                            loading="lazy"
                          />
                          <div className="enlarge-pill-badge">
                            <ZoomIn size={10} style={{ marginRight: 3 }} /> View
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {challenge.ai_summary && (
                    <div className="ai-summary-callout">
                      <strong>AI Summary: </strong> {challenge.ai_summary}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="feed-interaction-bar" style={{ marginTop: '10px' }}>
                    <button
                      type="button"
                      className="support-action-btn active"
                      onClick={() => handleSupport(challenge.id)}
                    >
                      <ThumbsUp size={15} />
                      <span>Supported</span>
                      <span className="support-badge-counter">{supports}</span>
                    </button>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                      {new Date(challenge.created_at).toLocaleDateString()}
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
                type="button"
                className="btn btn-primary"
                onClick={() => setVisibleCount((prev) => prev + 10)}
                style={{ padding: '12px 32px', fontSize: '14.5px' }}
              >
                Load More Problems ({challenges.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </div>
      )}

      {readMoreChallenge && (
        <div className="modal-overlay" onClick={() => setReadMoreChallenge(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close"
              onClick={() => setReadMoreChallenge(null)}
            >
              <X size={20} />
            </button>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px', color: '#0f172a' }}>
              {readMoreChallenge.title}
            </h3>
            <div style={{ maxHeight: '55vh', overflowY: 'auto', paddingRight: '6px' }}>
              {readMoreChallenge.media_urls && readMoreChallenge.media_urls.length > 0 && (
                <div
                  style={{
                    marginBottom: '16px',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    maxHeight: '260px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    const src = readMoreChallenge.media_urls![0];
                    setReadMoreChallenge(null);
                    setLightboxSrc(src);
                  }}
                >
                  <img
                    src={readMoreChallenge.media_urls[0]}
                    alt={readMoreChallenge.title}
                    style={{ width: '100%', maxHeight: '260px', objectFit: 'cover' }}
                  />
                </div>
              )}
              <p style={{ whiteSpace: 'pre-wrap', color: '#475569', fontSize: '15px', lineHeight: 1.6 }}>
                {readMoreChallenge.description}
              </p>
            </div>
          </div>
        </div>
      )}

      <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </div>
  );
};
