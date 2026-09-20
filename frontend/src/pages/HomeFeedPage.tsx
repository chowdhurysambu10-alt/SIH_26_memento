import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Challenge, challengesApi } from '../api/challenges';
import { SearchBar } from '../components/SearchBar';
import { FeedItem } from '../components/FeedItem';
import { FeedItemSkeleton } from '../components/FeedItemSkeleton';
import { useFeedCache } from '../hooks/useFeedCache';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { Lightbox } from '../components/Lightbox';
import { useAuth } from '../context/AuthContext';
import { Plus } from 'lucide-react';

export const HomeFeedPage: React.FC<{ onNavigateLogin: () => void; onNavigateSubmit: () => void }> = ({ onNavigateLogin, onNavigateSubmit }) => {
  const { isAuthenticated } = useAuth();
  const [sortBy, setSortBy] = useState<'support' | 'recent'>('recent');
  const [page, setPage] = useState<number>(1);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [sharedProblem, setSharedProblem] = useState<Challenge | null>(null);
  const [sharedProblemLoading, setSharedProblemLoading] = useState<boolean>(false);

  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pid = params.get('problemId');
    if (pid) {
      setSharedProblemLoading(true);
      challengesApi.getChallengeById(pid).then((data) => {
        setSharedProblem(data);
      }).catch((err) => {
        console.error('Failed to fetch shared problem:', err);
      }).finally(() => {
        setSharedProblemLoading(false);
        // Clean URL
        const newUrl = window.location.origin + window.location.pathname + window.location.hash;
        window.history.replaceState(window.history.state, '', newUrl);
      });
    }
  }, []);

  const cacheKey = `feed_${sortBy}_${searchQuery}`;
  
  // SWR-like Caching Hook
  const { data: challenges, isLoading, isValidating, error, mutate } = useFeedCache(cacheKey, {
    page: 1, // Only cache the first page inherently, append others
    limit: 10,
    search: searchQuery || undefined,
    sort_by: sortBy,
  });

  // Auto-refresh: poll every 15 s so support counts and new posts appear without a manual reload
  useAutoRefresh(async () => {
    const fresh = await challengesApi.getChallenges({ page: 1, limit: 10, search: searchQuery || undefined, sort_by: sortBy });
    mutate((prev) => {
      const freshIds = new Set(fresh.map((c) => c.id));
      // Keep any extra pages already loaded, but update first-page items
      const rest = prev.filter((c) => !freshIds.has(c.id));
      return [...fresh, ...rest];
    });
  }, 15000);

  // Load more function directly using the API
  const fetchMoreChallenges = async (pageNum: number) => {
    setLoadingMore(true);
    try {
      const cursor = sortBy === 'recent' && challenges.length > 0
        ? btoa(JSON.stringify({ created_at: challenges[challenges.length - 1].created_at }))
        : undefined;

      const newData = await challengesApi.getChallenges({
        page: cursor ? undefined : pageNum,
        limit: 10,
        search: searchQuery || undefined,
        sort_by: sortBy,
        cursor: cursor,
      });

      if (newData.length < 10) {
        setHasMore(false);
      }
      
      mutate((prev) => {
        const existingIds = new Set(prev.map((c) => c.id));
        const newUnique = newData.filter((c) => !existingIds.has(c.id));
        return [...prev, ...newUnique];
      });
    } catch (err: any) {
      console.error('Fetch more error:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setPage(1);
    setHasMore(true);
  }, [sortBy, searchQuery]);

  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q);
  }, []);

  const lastElementRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoading || loadingMore || !hasMore) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loadingMore) {
        setPage((prevPage) => {
          const nextPage = prevPage + 1;
          fetchMoreChallenges(nextPage);
          return nextPage;
        });
      }
    });

    if (node) observer.current.observe(node);
  }, [isLoading, loadingMore, hasMore, sortBy, searchQuery]);

  const handleChallengeSupported = (id: string, newCount: number) => {
    mutate((prev) => {
      const updated = prev.map((c) => (c.id === id ? { ...c, support_count: newCount } : c));
      if (sortBy === 'support') {
        return updated.sort((a, b) => (Number(b.support_count) || 0) - (Number(a.support_count) || 0));
      }
      return updated;
    });
  };

  const handleChallengeDeleted = (id: string) => {
    mutate((prev) => prev.filter((c) => c.id !== id));
  };

  const handleOpenSubmit = () => {
    onNavigateSubmit();
  };

  return (
    <>
      <SearchBar onSearch={handleSearch} />

      <main className="main-layout">
        <div className="feed-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
          <h2>Societal Challenges Updates</h2>

          {/* Sorting Tabs */}
          <div style={{ display: 'flex', gap: '8px', background: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
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
              Most Recent
            </button>
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
              Most Supported
            </button>
          </div>
        </div>

        {sharedProblemLoading && (
          <div className="challenge-list" style={{ marginBottom: '24px' }}>
            <h3 style={{ color: '#0f172a', marginBottom: '12px' }}>Shared Challenge</h3>
            <FeedItemSkeleton />
          </div>
        )}

        {sharedProblem && !sharedProblemLoading && (
          <div className="challenge-list" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ color: '#0f172a', margin: 0 }}>Shared Challenge</h3>
              <button 
                onClick={() => setSharedProblem(null)}
                style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontWeight: 600 }}
              >
                Clear
              </button>
            </div>
            <div style={{ contentVisibility: 'auto', containIntrinsicSize: '0 300px', border: '2px solid #3b82f6', borderRadius: '14px', padding: '2px', background: '#eff6ff' }}>
              <FeedItem
                challenge={sharedProblem}
                onOpenLightbox={(src) => setLightboxSrc(src)}
                onSupported={handleChallengeSupported}
                onDeleted={(id) => {
                  setSharedProblem(null);
                  handleChallengeDeleted(id);
                }}
              />
            </div>
          </div>
        )}

        {isLoading && challenges.length === 0 && (
          <div className="challenge-list">
            <FeedItemSkeleton />
            <FeedItemSkeleton />
            <FeedItemSkeleton />
          </div>
        )}

        {error && !isLoading && (
          <div className="feed-item" style={{ borderColor: '#fca5a5', background: '#fef2f2' }}>
            <p style={{ color: '#b91c1c' }}>{error}</p>
          </div>
        )}

        {!isLoading && !error && challenges.length === 0 && (
          <p style={{ color: '#64748b', textAlign: 'center', padding: '40px' }}>
            No challenges found. Be the first to report a societal issue!
          </p>
        )}

        {challenges.length > 0 && (
          <div className="challenge-list">
            {challenges.map((c) => (
              <div 
                key={c.id}
                style={{ 
                  contentVisibility: 'auto', 
                  containIntrinsicSize: '0 300px'
                }}
              >
                <FeedItem
                  challenge={c}
                  onOpenLightbox={(src) => setLightboxSrc(src)}
                  onSupported={handleChallengeSupported}
                  onDeleted={handleChallengeDeleted}
                />
              </div>
            ))}
            <div style={{ textAlign: 'center', marginTop: '20px' }} ref={lastElementRef}>
              {loadingMore && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <FeedItemSkeleton />
                  <FeedItemSkeleton />
                </div>
              )}
              {!hasMore && challenges.length > 0 && (
                <div style={{ padding: '20px', color: '#94a3b8', fontSize: '14px', fontStyle: 'italic' }}>
                  You've reached the end of the updates.
                </div>
              )}
            </div>
          </div>
        )}
      </main>



      <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </>
  );
};
