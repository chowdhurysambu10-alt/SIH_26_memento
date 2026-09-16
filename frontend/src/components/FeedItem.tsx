import React, { useState } from 'react';
import { Challenge, challengesApi } from '../api/challenges';
import { useAuth } from '../context/AuthContext';
import { MapPin, Building2, Tag, X, Trash2, ThumbsUp, ZoomIn, Eye } from 'lucide-react';

interface FeedItemProps {
  challenge: Challenge;
  onOpenLightbox: (src: string) => void;
  onSupported?: (id: string, newCount: number) => void;
  onDeleted?: (id: string) => void;
}

export const FeedItem: React.FC<FeedItemProps> = ({
  challenge,
  onOpenLightbox,
  onSupported,
  onDeleted,
}) => {
  const { user, isAuthenticated } = useAuth();

  const savedSupports = JSON.parse(localStorage.getItem('supported_challenges') || '{}');
  const [isSupported, setIsSupported] = useState<boolean>(!!savedSupports[challenge.id]);
  const [supportCount, setSupportCount] = useState<number>(Number(challenge.support_count || 0));
  const [isReadMoreOpen, setIsReadMoreOpen] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isUpvoteBouncing, setIsUpvoteBouncing] = useState(false);

  // Keep local state in sync with parent props
  React.useEffect(() => {
    setSupportCount(Number(challenge.support_count || 0));
  }, [challenge.support_count]);

  const maxDescriptionLength = 150;
  const isLongDescription =
    challenge.description && challenge.description.length > maxDescriptionLength;
  const displayDescription = isLongDescription
    ? challenge.description.substring(0, maxDescriptionLength) + '...'
    : challenge.description;

  const handleSupport = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert('Please sign in to support this challenge.');
      return;
    }
    if (isSyncing) return;

    setIsSyncing(true);
    setIsUpvoteBouncing(true);
    setTimeout(() => setIsUpvoteBouncing(false), 400);

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

        const updatedFromDB = { ...savedSupports, [challenge.id]: res.is_supported };
        localStorage.setItem('supported_challenges', JSON.stringify(updatedFromDB));

        if (onSupported) onSupported(challenge.id, res.support_count);
      }
    } catch (err) {
      console.warn('Backend support sync failed:', err);
      setIsSupported(!nextState);
      setSupportCount(supportCount);
      if (onSupported) onSupported(challenge.id, supportCount);
    } finally {
      setIsSyncing(false);
    }
  };

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
    if (
      !window.confirm(
        `Are you sure you want to permanently delete "${
          challenge.title || 'this complaint'
        }"? This action cannot be undone.`
      )
    ) {
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
      alert(err.message || 'Failed to delete challenge. Please try again.');
      setIsDeleting(false);
    }
  };

  const rawMedia: any = challenge.media_urls;
  const mediaList: string[] = Array.isArray(rawMedia)
    ? rawMedia.filter((x): x is string => typeof x === 'string' && x.length > 0)
    : typeof rawMedia === 'string' && rawMedia.length > 0
    ? rawMedia.startsWith('[')
      ? JSON.parse(rawMedia)
      : [rawMedia]
    : [];

  const hasMedia = mediaList.length > 0;

  return (
    <article className="feed-item card-dynamic">
      {/* Feed Card Header / Metadata */}
      <div className="feed-meta">
        <span className="tag tag-district">
          <MapPin size={11} style={{ display: 'inline', marginRight: 4 }} />
          {challenge.district || 'Jharkhand'}
        </span>

        {challenge.categories?.name && (
          <span className="tag tag-category">
            <Tag size={11} style={{ display: 'inline', marginRight: 4 }} />
            {challenge.categories.name}
          </span>
        )}

        {challenge.institutions?.name && (
          <span className="tag tag-institution">
            <Building2 size={11} style={{ display: 'inline', marginRight: 4 }} />
            {challenge.institutions.name}
          </span>
        )}

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

      {/* Main Content: Title, Description & Responsive Media */}
      <div className="feed-body-layout">
        <div className="feed-text-content">
          <h3 className="feed-card-title">{challenge.title || 'Untitled Challenge'}</h3>
          <p className="feed-card-description">
            {displayDescription}
            {isLongDescription && (
              <button
                type="button"
                onClick={() => setIsReadMoreOpen(true)}
                className="read-more-link"
              >
                Read more...
              </button>
            )}
          </p>
        </div>

        {/* Media Preview (Responsive on Phone & Desktop) */}
        {hasMedia && (
          <div className="feed-media-section">
            {mediaList.length === 1 ? (
              <div
                className="feed-single-media-wrap"
                onClick={() => onOpenLightbox(mediaList[0])}
                title="Tap to view full photo"
              >
                {mediaList[0].endsWith('.mp4') ||
                mediaList[0].endsWith('.mov') ||
                mediaList[0].endsWith('.webm') ? (
                  <video
                    src={mediaList[0]}
                    className="feed-media-element"
                    playsInline
                    muted
                  />
                ) : (
                  <img
                    src={mediaList[0]}
                    alt={challenge.title || 'Evidence media'}
                    className="feed-media-element"
                    loading="lazy"
                  />
                )}
                <div className="enlarge-pill-badge">
                  <ZoomIn size={10} style={{ marginRight: 3 }} /> View
                </div>
              </div>
            ) : (
              <div className="feed-multi-media-wrap">
                {mediaList.slice(0, 2).map((url, idx) => (
                  <div
                    key={idx}
                    className="feed-multi-thumb"
                    onClick={() => onOpenLightbox(url)}
                    title="Tap to view photo"
                  >
                    <img
                      src={url}
                      alt={`Evidence media ${idx + 1}`}
                      className="feed-media-element"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer / Interaction Bar */}
      <div className="feed-interaction-bar">
        <button
          type="button"
          className={`support-action-btn ${isSupported ? 'active' : ''} ${
            isUpvoteBouncing ? 'bounce-anim' : ''
          }`}
          onClick={handleSupport}
          disabled={isSyncing}
          aria-label="Support this challenge"
        >
          <ThumbsUp size={15} strokeWidth={isSupported ? 2.5 : 1.8} />
          <span>{isSupported ? 'Supported' : 'Support'}</span>
          <span className="support-badge-counter">{supportCount}</span>
        </button>

        <div className="feed-action-right">
          {canDelete && (
            <button
              type="button"
              className="delete-action-btn"
              onClick={handleDelete}
              disabled={isDeleting}
              title="Delete this complaint"
            >
              <Trash2 size={14} />
              <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Read More Modal */}
      {isReadMoreOpen && (
        <div className="modal-overlay" onClick={() => setIsReadMoreOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close"
              onClick={() => setIsReadMoreOpen(false)}
              aria-label="Close"
            >
              <X size={20} />
            </button>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px', color: '#0f172a' }}>
              {challenge.title}
            </h3>
            {hasMedia && (
              <div
                style={{
                  marginBottom: '16px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  maxHeight: '260px',
                  cursor: 'pointer',
                }}
                onClick={() => {
                  setIsReadMoreOpen(false);
                  onOpenLightbox(mediaList[0]);
                }}
              >
                <img
                  src={mediaList[0]}
                  alt={challenge.title}
                  style={{ width: '100%', maxHeight: '260px', objectFit: 'cover' }}
                />
              </div>
            )}
            <div style={{ maxHeight: '50vh', overflowY: 'auto', paddingRight: '6px' }}>
              <p style={{ whiteSpace: 'pre-wrap', color: '#475569', fontSize: '15px', lineHeight: 1.6 }}>
                {challenge.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </article>
  );
};
