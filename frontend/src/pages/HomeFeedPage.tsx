import React, { useState, useEffect } from 'react';
import { Challenge, challengesApi } from '../api/challenges';
import { SearchBar } from '../components/SearchBar';
import { FeedItem } from '../components/FeedItem';
import { SubmitModal } from '../components/SubmitModal';
import { Lightbox } from '../components/Lightbox';
import { useAuth } from '../context/AuthContext';
import { Plus } from 'lucide-react';

export const HomeFeedPage: React.FC<{ onNavigateLogin: () => void }> = ({ onNavigateLogin }) => {
  const { isAuthenticated } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [sortBy, setSortBy] = useState<'support' | 'priority' | 'recent'>('support');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [submitModalOpen, setSubmitModalOpen] = useState<boolean>(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const fetchChallenges = async (searchQuery?: string, customSort?: 'support' | 'priority' | 'recent') => {
    setLoading(true);
    setError('');
    const activeSort = customSort || sortBy;
    try {
      const data = await challengesApi.getChallenges({
        page: 1,
        limit: 30,
        search: searchQuery || undefined,
      });

      // Sort client-side and ensure most supported / highest priority ordering
      const sorted = [...data].sort((a, b) => {
        if (activeSort === 'priority') {
          return (Number(b.priority_score) || 0) - (Number(a.priority_score) || 0);
        }
        if (activeSort === 'recent') {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        // Default: Most supported first
        const sDiff = (Number(b.support_count) || 0) - (Number(a.support_count) || 0);
        if (sDiff !== 0) return sDiff;
        return (Number(b.priority_score) || 0) - (Number(a.priority_score) || 0);
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
          const diff = (Number(b.support_count) || 0) - (Number(a.support_count) || 0);
          if (diff !== 0) return diff;
          return (Number(b.priority_score) || 0) - (Number(a.priority_score) || 0);
        });
      }
      return updated;
    });
  };

  const handleOpenSubmit = () => {
    if (!isAuthenticated) {
      alert('Please sign in to submit a challenge.');
      onNavigateLogin();
      return;
    }
    setSubmitModalOpen(true);
  };

  return (
    <>
      <SearchBar onSearch={(q) => fetchChallenges(q)} />

      <main className="main-layout">
        <div className="feed-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
          <h2>Societal Challenges Feed</h2>

          {/* Sorting Tabs */}
          <div style={{ display: 'flex', gap: '8px', background: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
            <button
              className="btn"
              onClick={() => setSortBy('support')}
              style={{
                padding: '6px 14px',
                fontSize: '13px',
                borderRadius: '8px',
                background: sortBy === 'support' ? '#ffffff' : 'transparent',
                color: sortBy === 'support' ? '#2563eb' : '#64748b',
                fontWeight: sortBy === 'support' ? 700 : 500,
                boxShadow: sortBy === 'support' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              🔥 Most Supported
            </button>
            <button
              className="btn"
              onClick={() => setSortBy('priority')}
              style={{
                padding: '6px 14px',
                fontSize: '13px',
                borderRadius: '8px',
                background: sortBy === 'priority' ? '#ffffff' : 'transparent',
                color: sortBy === 'priority' ? '#2563eb' : '#64748b',
                fontWeight: sortBy === 'priority' ? 700 : 500,
                boxShadow: sortBy === 'priority' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              ⚡ Highest Priority
            </button>
            <button
              className="btn"
              onClick={() => setSortBy('recent')}
              style={{
                padding: '6px 14px',
                fontSize: '13px',
                borderRadius: '8px',
                background: sortBy === 'recent' ? '#ffffff' : 'transparent',
                color: sortBy === 'recent' ? '#2563eb' : '#64748b',
                fontWeight: sortBy === 'recent' ? 700 : 500,
                boxShadow: sortBy === 'recent' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              🕒 Most Recent
            </button>
          </div>
        </div>

        {loading && <p style={{ color: '#64748b', textAlign: 'center', padding: '40px' }}>Loading challenges...</p>}

        {error && (
          <div className="feed-item" style={{ borderColor: '#fca5a5', background: '#fef2f2' }}>
            <p style={{ color: '#b91c1c' }}>{error}</p>
          </div>
        )}

        {!loading && !error && challenges.length === 0 && (
          <p style={{ color: '#64748b', textAlign: 'center', padding: '40px' }}>
            No challenges found. Be the first to report a societal issue!
          </p>
        )}

        {!loading && challenges.length > 0 && (
          <div className="challenge-list">
            {challenges.map((c) => (
              <FeedItem
                key={c.id}
                challenge={c}
                onOpenLightbox={(src) => setLightboxSrc(src)}
                onSupported={handleChallengeSupported}
              />
            ))}
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      <button
        className="btn btn-primary floating-action-btn"
        title="Post a Challenge"
        onClick={handleOpenSubmit}
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

      <SubmitModal
        isOpen={submitModalOpen}
        onClose={() => setSubmitModalOpen(false)}
        onSuccess={() => fetchChallenges()}
      />

      <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </>
  );
};
