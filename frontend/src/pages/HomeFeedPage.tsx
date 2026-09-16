import React, { useState, useEffect } from 'react';
import { Challenge, challengesApi } from '../api/challenges';
import { SearchBar } from '../components/SearchBar';
import { FeedItem } from '../components/FeedItem';
import { Lightbox } from '../components/Lightbox';
import { useAuth } from '../context/AuthContext';
import { Flame, Clock, RefreshCw, AlertCircle } from 'lucide-react';

export const HomeFeedPage: React.FC<{
  onNavigateLogin: () => void;
  onNavigateSubmit: () => void;
}> = ({ onNavigateLogin, onNavigateSubmit }) => {
  const { isAuthenticated } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [sortBy, setSortBy] = useState<'support' | 'recent'>('support');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [currentSearch, setCurrentSearch] = useState<string>('');
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const fetchChallenges = async (searchQuery?: string, customSort?: 'support' | 'recent') => {
    setLoading(true);
    setError('');
    const activeSort = customSort || sortBy;
    if (searchQuery !== undefined) {
      setCurrentSearch(searchQuery);
    }
    const queryToUse = searchQuery !== undefined ? searchQuery : currentSearch;

    try {
      const data = await challengesApi.getChallenges({
        page: 1,
        limit: 40,
        search: queryToUse || undefined,
      });

      const sorted = [...data].sort((a, b) => {
        if (activeSort === 'recent') {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        return (Number(b.support_count) || 0) - (Number(a.support_count) || 0);
      });

      setChallenges(sorted);
    } catch (err: any) {
      console.error('Fetch feed error:', err);
      setError(err.message || 'Could not connect to backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenges(undefined, sortBy);
  }, [sortBy]);

  const handleChallengeSupported = (id: string, newCount: number) => {
    setChallenges((prev) => {
      const updated = prev.map((c) => (c.id === id ? { ...c, support_count: newCount } : c));
      if (sortBy === 'support') {
        return updated.sort((a, b) => {
          return (Number(b.support_count) || 0) - (Number(a.support_count) || 0);
        });
      }
      return updated;
    });
  };

  const handleChallengeDeleted = (id: string) => {
    setChallenges((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="feed-page-wrapper">
      <SearchBar onSearch={(q) => fetchChallenges(q)} />

      <main className="main-layout">
        <div className="feed-header-bar">
          <div>
            <h2 className="feed-heading">Societal Challenges Feed</h2>
            <p className="feed-subheading">
              Real community issues crowdsourced across districts in Jharkhand.
            </p>
          </div>

          {/* Sorting Switcher Pills */}
          <div className="sort-pills-container">
            <button
              type="button"
              className={`sort-pill-btn ${sortBy === 'support' ? 'active' : ''}`}
              onClick={() => setSortBy('support')}
            >
              <Flame size={14} /> Most Supported
            </button>

            <button
              type="button"
              className={`sort-pill-btn ${sortBy === 'recent' ? 'active' : ''}`}
              onClick={() => setSortBy('recent')}
            >
              <Clock size={14} /> Most Recent
            </button>

            <button
              type="button"
              className="refresh-feed-btn"
              onClick={() => fetchChallenges(currentSearch, sortBy)}
              title="Refresh feed"
              aria-label="Refresh feed"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {loading && (
          <div className="feed-loading-state">
            <RefreshCw size={24} className="animate-spin" color="#2563eb" style={{ margin: '0 auto 10px' }} />
            <p>Fetching latest challenges from database...</p>
          </div>
        )}

        {error && (
          <div className="feed-error-box">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <div>
              <strong>Failed to load challenges</strong>
              <p style={{ margin: '4px 0 0', fontSize: '13px' }}>{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && challenges.length === 0 && (
          <div className="feed-empty-box">
            <Flame size={36} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
            <h3>No challenges found</h3>
            <p>
              {currentSearch
                ? `No problems match "${currentSearch}". Try a different keyword or district.`
                : 'Be the first to report a societal issue in your locality!'}
            </p>
            <button
              className="btn btn-primary"
              style={{ marginTop: '16px' }}
              onClick={onNavigateSubmit}
            >
              Submit First Challenge
            </button>
          </div>
        )}

        {!loading && challenges.length > 0 && (
          <div className="challenge-list">
            {challenges.map((c) => (
              <FeedItem
                key={c.id}
                challenge={c}
                onOpenLightbox={(src) => setLightboxSrc(src)}
                onSupported={handleChallengeSupported}
                onDeleted={handleChallengeDeleted}
              />
            ))}
          </div>
        )}
      </main>

      <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </div>
  );
};
