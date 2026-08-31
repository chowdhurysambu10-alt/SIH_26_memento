import React, { useState } from 'react';
import { Challenge, challengesApi } from '../api/challenges';
import { useAuth } from '../context/AuthContext';
import { Heart, MapPin, Building2, Tag, Edit } from 'lucide-react';

interface FeedItemProps {
  challenge: Challenge;
  onOpenLightbox: (src: string) => void;
  onEdit?: (challenge: Challenge) => void;
  onSupported?: (id: string, newCount: number) => void;
}

export const FeedItem: React.FC<FeedItemProps> = ({ challenge, onOpenLightbox, onEdit, onSupported }) => {
  const { user, isAuthenticated } = useAuth();
  
  const savedSupports = JSON.parse(localStorage.getItem('supported_challenges') || '{}');
  const [isSupported, setIsSupported] = useState<boolean>(!!savedSupports[challenge.id]);
  const [supportCount, setSupportCount] = useState<number>(Number(challenge.support_count || 0));

  const handleSupport = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert('Please sign in to support this challenge.');
      return;
    }

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
        setSupportCount(res.support_count);
        if (onSupported) onSupported(challenge.id, res.support_count);
      }
    } catch (err) {
      console.warn('Backend support sync failed:', err);
    }
  };

  const isOwner = user && challenge.submitted_by === user.id;

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
            {challenge.institutions.name}
          </span>
        )}

        {challenge.priority_score && (
          <span className="tag tag-hot">
            Priority: {Number(challenge.priority_score).toFixed(1)}
          </span>
        )}

        <span className="status">
          {(challenge.status || 'SUBMITTED').replace('_', ' ').toUpperCase()}
        </span>
      </div>

      <h3>{challenge.title || 'Untitled Challenge'}</h3>
      <p style={{ whiteSpace: 'pre-wrap' }}>{challenge.description}</p>

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
        >
          <Heart size={16} fill={isSupported ? '#ef4444' : 'none'} color={isSupported ? '#ef4444' : 'currentColor'} />
          <span>{isSupported ? 'Supported' : 'Support'} ({supportCount})</span>
        </button>

        {isOwner && onEdit && (
          <button
            type="button"
            className="interaction-btn"
            style={{ marginLeft: 'auto', color: '#2563eb' }}
            onClick={() => onEdit(challenge)}
          >
            <Edit size={15} />
            <span>Edit</span>
          </button>
        )}
      </div>
    </div>
  );
};
