import React, { useState } from 'react';
import { Challenge, challengesApi } from '../api/challenges';
import { useAuth } from '../context/AuthContext';
import { MapPin, Building2, Tag, X } from 'lucide-react';

interface FeedItemProps {
  challenge: Challenge;
  onOpenLightbox: (src: string) => void;
  onSupported?: (id: string, newCount: number) => void;
}

export const FeedItem: React.FC<FeedItemProps> = ({ challenge, onOpenLightbox, onSupported }) => {
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

      <h3>{challenge.title || 'Untitled Challenge'}</h3>
      <p style={{ whiteSpace: 'pre-wrap', marginBottom: '12px', color: '#475569', fontSize: '14.5px', lineHeight: 1.6 }}>
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

      {challenge.media_urls && challenge.media_urls.length > 0 && (
        <div className="media-row">
          {challenge.media_urls.map((url, idx) => {
            if (!url) return null;
            const isVideo = url.endsWith('.mp4') || url.endsWith('.mov');
            return isVideo ? (
              <video key={idx} src={url} controls className="media-thumb" />
            ) : (
              <img
                key={idx}
                src={url}
                alt="Challenge media"
                className="media-thumb"
                onClick={() => onOpenLightbox(url)}
              />
            );
          })}
        </div>
      )}

      <div className="interaction-row">
        <button
          type="button"
          className={`interaction-btn ${isSupported ? 'support-btn active' : ''}`}
          onClick={handleSupport}
          disabled={isSyncing}
          style={{ opacity: isSyncing ? 0.7 : 1, cursor: isSyncing ? 'not-allowed' : 'pointer' }}
        >
          <span>{isSupported ? 'Supported' : 'Support'} ({supportCount})</span>
        </button>
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
