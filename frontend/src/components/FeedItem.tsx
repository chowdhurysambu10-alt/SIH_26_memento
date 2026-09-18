import React, { useState } from 'react';
import { Challenge, challengesApi } from '../api/challenges';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { MapPin, Building2, Tag, X, Trash2, ThumbsUp, Share2, Eye } from 'lucide-react';

interface FeedItemProps {
  challenge: Challenge;
  onOpenLightbox: (src: string) => void;
  onSupported?: (id: string, newCount: number) => void;
  onDeleted?: (id: string) => void;
}

export const FeedItem: React.FC<FeedItemProps> = ({ challenge, onOpenLightbox, onSupported, onDeleted }) => {
  const { user, isAuthenticated } = useAuth();
  const { showAlert, showConfirm } = useUI();
  
  const savedSupports = JSON.parse(localStorage.getItem('supported_challenges') || '{}');
  const [isSupported, setIsSupported] = useState<boolean>(!!savedSupports[challenge.id]);
  const [supportCount, setSupportCount] = useState<number>(Number(challenge.support_count || 0));
  const [isReadMoreOpen, setIsReadMoreOpen] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const savedWatchlist = JSON.parse(localStorage.getItem('civic_watchlist') || '[]');
  const [isWatched, setIsWatched] = useState<boolean>(savedWatchlist.includes(challenge.id));

  const handleWatchToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    const currentList = JSON.parse(localStorage.getItem('civic_watchlist') || '[]');
    let newList;
    if (isWatched) {
      newList = currentList.filter((id: string) => id !== challenge.id);
      showAlert('Removed from watchlist', 'info');
    } else {
      newList = [...currentList, challenge.id];
      showAlert('Added to watchlist. Track it in your Overview tab!', 'success');
    }
    localStorage.setItem('civic_watchlist', JSON.stringify(newList));
    setIsWatched(!isWatched);
  };

  // Keep local state in sync with parent props
  React.useEffect(() => {
    setSupportCount(Number(challenge.support_count || 0));
  }, [challenge.support_count]);

  const maxDescriptionLength = 150;
  const isLongDescription = challenge.description && challenge.description.length > maxDescriptionLength;
  const displayDescription = (isLongDescription && !isReadMoreOpen)
    ? challenge.description.substring(0, maxDescriptionLength) + '...'
    : challenge.description;

  const handleSupport = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showAlert('Please sign in to support this challenge.', 'error');
      return;
    }
    if (isSyncing) return;

    setIsSyncing(true);
    const nextState = !isSupported;
    const nextCount = nextState ? supportCount + 1 : Math.max(0, supportCount - 1);
    setIsSupported(nextState);
    setSupportCount(nextCount);

    const updated = { ...savedSupports, [challenge.id]: nextState };
    localStorage.setItem('supported_challenges', JSON.stringify(updated));

    if (onSupported) {
      onSupported(challenge.id, nextCount);
    }

    try {
      const res = await challengesApi.supportChallenge(challenge.id);
      if (res && res.support_count !== undefined) {
        setIsSupported(res.is_supported);
        setSupportCount(res.support_count);
        
        // update local storage with actual db truth
        const updatedFromDB = { ...savedSupports, [challenge.id]: res.is_supported };
        localStorage.setItem('supported_challenges', JSON.stringify(updatedFromDB));

        if (onSupported) onSupported(challenge.id, res.support_count);
      }
    } catch (err) {
      console.warn('Backend support sync failed:', err);
      // Revert on failure
      setIsSupported(!nextState);
      setSupportCount(supportCount);
      if (onSupported) onSupported(challenge.id, supportCount);
    } finally {
      setIsSyncing(false);
    }
  };

  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const canDelete =
    isAuthenticated &&
    user &&
    (user.id === challenge.submitted_by ||
      (challenge as any).user_id === user.id ||
      user.role === 'super_admin' ||
      user.role === 'govt_viewer' ||
      (user.role as any) === 'admin');

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!(await showConfirm(`Are you sure you want to permanently delete "${challenge.title || 'this complaint'}"? This action cannot be undone.`))) {
      return;
    }
    setIsDeleting(true);
    try {
      await challengesApi.deleteChallenge(challenge.id);
      if (onDeleted) {
        onDeleted(challenge.id);
      }
    } catch (err: any) {
      console.error('Failed to delete complaint:', err);
      showAlert(err.message || 'Failed to delete challenge. Please try again.', 'error');
      setIsDeleting(false);
    }
  };

  return (
    <div className="feed-item">
      <div className="feed-meta">
        <span className="tag tag-new">
          <MapPin size={12} style={{ display: 'inline', marginRight: 4 }} />
          {challenge.district || 'Jharkhand'}
        </span>

        {challenge.location_text && (
          <a 
            href={challenge.location_text.startsWith('http') ? challenge.location_text : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(challenge.location_text)}`} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="tag tag-new"
            style={{ display: 'inline-flex', alignItems: 'center', background: '#eff6ff', color: '#2563eb', textDecoration: 'none', cursor: 'pointer' }}
          >
            <MapPin size={12} style={{ marginRight: 4 }} />
            Exact Location
          </a>
        )}

        {challenge.categories?.name && (
          <span className="tag tag-category">
            <Tag size={12} style={{ display: 'inline', marginRight: 4 }} />
            {challenge.categories.name}
          </span>
        )}

        {challenge.institutions?.name && challenge.assigned_institution_id && challenge.status !== 'submitted' && challenge.status !== 'under_review' && (
          <span className="tag tag-category" style={{ background: '#ecfdf5', color: '#065f46' }}>
            <Building2 size={12} style={{ display: 'inline', marginRight: 4 }} />
            Assigned to: {challenge.institutions.name}
          </span>
        )}

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

      {(() => {
        const rawMedia: any = challenge.media_urls;
        const mediaList: string[] = Array.isArray(rawMedia)
          ? rawMedia.filter((x): x is string => typeof x === 'string' && x.length > 0)
          : (typeof rawMedia === 'string' && rawMedia.length > 0
              ? (rawMedia.startsWith('[') ? JSON.parse(rawMedia) : [rawMedia])
              : []);

        const hasMedia = mediaList.length > 0;

        return (
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: '8px' }}>
            {/* Left Side: Title & Description */}
            <div style={{ flex: '1 1 280px', minWidth: 0 }}>
              <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                {challenge.title || 'Untitled Challenge'}
              </h3>
              <div style={{ whiteSpace: 'pre-wrap', margin: 0, color: '#475569', fontSize: '14.5px', lineHeight: 1.6 }}>
                <span>{displayDescription}</span>
                {isLongDescription && !isReadMoreOpen && (
                  <button 
                    onClick={(e) => { e.preventDefault(); setIsReadMoreOpen(true); }}
                    style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontWeight: 600, marginLeft: '4px', padding: 0 }}
                  >
                    <span>Read more...</span>
                  </button>
                )}
                {isLongDescription && isReadMoreOpen && (
                  <button 
                    onClick={(e) => { e.preventDefault(); setIsReadMoreOpen(false); }}
                    style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontWeight: 600, marginLeft: '4px', padding: 0 }}
                  >
                    <span>Show less</span>
                  </button>
                )}
              </div>
            </div>

            {/* Right Side: Smaller Photo */}
            {hasMedia && (
              <div style={{ flexShrink: 0, alignSelf: 'flex-start' }}>
                {mediaList.length === 1 ? (
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
                    onClick={() => onOpenLightbox(mediaList[0])}
                    title="Click to view full photo"
                  >
                    {mediaList[0].endsWith('.mp4') || mediaList[0].endsWith('.mov') || mediaList[0].endsWith('.webm') ? (
                      <video
                        src={mediaList[0]}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <img
                        src={mediaList[0]}
                        alt={challenge.title || 'Evidence media'}
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
                    )}
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
                ) : (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {mediaList.slice(0, 2).map((url, idx) => (
                      <div
                        key={idx}
                        style={{
                          position: 'relative',
                          width: '105px',
                          height: '105px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          border: '1px solid #e2e8f0',
                          background: '#f1f5f9',
                          cursor: 'pointer',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                        }}
                        onClick={() => onOpenLightbox(url)}
                        title="Click to view full photo"
                      >
                        <img
                          src={url}
                          alt={`Evidence media ${idx + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.2s' }}
                          onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                          onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })()}

      <div className="interaction-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          type="button"
          className={`interaction-btn ${isSupported ? 'support-btn active' : ''}`}
          onClick={handleSupport}
          disabled={isSyncing}
          style={{ opacity: isSyncing ? 0.7 : 1, cursor: isSyncing ? 'not-allowed' : 'pointer' }}
        >
          <ThumbsUp size={16} fill={isSupported ? 'currentColor' : 'none'} />
          <span>{isSupported ? 'Supported' : 'Support'} ({supportCount})</span>
        </button>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            className="interaction-btn"
            onClick={(e) => {
              e.preventDefault();
              const shareUrl = `${window.location.origin}/?problemId=${challenge.id}#feed`;
              if (navigator.share) {
                navigator.share({ title: challenge.title, url: shareUrl });
              } else {
                navigator.clipboard.writeText(shareUrl);
                showAlert('Link copied to clipboard!', 'success');
              }
            }}
          >
            <Share2 size={16} />
            <span>Share</span>
          </button>

          <button
            type="button"
            className={`interaction-btn ${isWatched ? 'support-btn active' : ''}`}
            onClick={handleWatchToggle}
          >
            <Eye size={16} fill={isWatched ? 'currentColor' : 'none'} />
            <span>{isWatched ? 'Watching' : 'Watchlist'}</span>
          </button>

          {canDelete && (
            <button
              type="button"
              className="interaction-btn"
              onClick={handleDelete}
              disabled={isDeleting}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#fef2f2',
                color: '#ef4444',
                border: '1px solid #fecaca',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: isDeleting ? 'not-allowed' : 'pointer',
                opacity: isDeleting ? 0.6 : 1,
                transition: 'all 0.2s ease',
              }}
              title="Delete this complaint"
            >
              <Trash2 size={14} />
              <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
            </button>
          )}
        </div>
      </div>


    </div>
  );
};
