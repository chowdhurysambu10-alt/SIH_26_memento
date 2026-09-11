import React, { useState } from 'react';
import { Challenge, challengesApi } from '../api/challenges';
import { useAuth } from '../context/AuthContext';
import { MapPin, Building2, Tag, X, Trash2 } from 'lucide-react';

interface FeedItemProps {
  challenge: Challenge;
  onOpenLightbox: (src: string) => void;
  onSupported?: (id: string, newCount: number) => void;
  onDeleted?: (id: string) => void;
}

export const FeedItem: React.FC<FeedItemProps> = ({ challenge, onOpenLightbox, onSupported, onDeleted }) => {
  const { user, isAuthenticated } = useAuth();
  
  const savedSupports = JSON.parse(localStorage.getItem('supported_challenges') || '{}');
  const [isSupported, setIsSupported] = useState<boolean>(!!savedSupports[challenge.id]);
  const [supportCount, setSupportCount] = useState<number>(Number(challenge.support_count || 0));
  const [isReadMoreOpen, setIsReadMoreOpen] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Keep local state in sync with parent props
  React.useEffect(() => {
    setSupportCount(Number(challenge.support_count || 0));
  }, [challenge.support_count]);

  const maxDescriptionLength = 150;
  const isLongDescription = challenge.description && challenge.description.length > maxDescriptionLength;
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
    if (!window.confirm(`Are you sure you want to permanently delete "${challenge.title || 'this complaint'}"? This action cannot be undone.`)) {
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

  return (
    <div className="feed-item">
      <div className="feed-meta">
        <span className="tag tag-new">
          <MapPin size={12} style={{ display: 'inline', marginRight: 4 }} />
          {challenge.district || 'Jharkhand'}
        </span>

        {challenge.categories?.name && (
          <span className="tag tag-category">
            <Tag size={12} style={{ display: 'inline', marginRight: 4 }} />
            {challenge.categories.name}
          </span>
        )}

        {challenge.institutions?.name && (
          <span className="tag tag-category" style={{ background: '#ecfdf5', color: '#065f46' }}>
            <Building2 size={12} style={{ display: 'inline', marginRight: 4 }} />
            Nearest Institution: {challenge.institutions.name}
          </span>
        )}

        <span className="status">
          {(challenge.status || 'SUBMITTED').replace('_', ' ').toUpperCase()}
        </span>
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
              <p style={{ whiteSpace: 'pre-wrap', margin: 0, color: '#475569', fontSize: '14.5px', lineHeight: 1.6 }}>
                {displayDescription}
                {isLongDescription && (
                  <button 
                    onClick={() => setIsReadMoreOpen(true)}
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
          <span>{isSupported ? 'Supported' : 'Support'} ({supportCount})</span>
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

      {isReadMoreOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <button className="modal-close" onClick={() => setIsReadMoreOpen(false)}>
              <X size={20} />
            </button>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px', color: '#0f172a' }}>
              {challenge.title}
            </h3>
            <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '8px' }}>
              <p style={{ whiteSpace: 'pre-wrap', color: '#475569', fontSize: '15px', lineHeight: 1.6 }}>
                {challenge.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
