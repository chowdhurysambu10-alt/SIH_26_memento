import React from 'react';
import { Challenge } from '../../types/challenge.types';
import { StatusBadge } from '../common/StatusBadge';
import { PriorityIndicator } from '../common/PriorityIndicator';
import { MapPin, Building2, Calendar, ArrowRight, Sparkles } from 'lucide-react';

interface ChallengeCardProps {
  challenge: Challenge;
  onSelect: (challenge: Challenge) => void;
}

export const ChallengeCard: React.FC<ChallengeCardProps> = ({ challenge, onSelect }) => {
  const imageUrl = challenge.media_urls?.[0] || 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80';

  return (
    <div
      className="glass-panel glass-panel-hover"
      onClick={() => onSelect(challenge)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        cursor: 'pointer',
        height: '100%',
      }}
    >
      {/* Thumbnail Header with Badges */}
      <div style={{ position: 'relative', height: '180px', width: '100%', overflow: 'hidden', background: '#0f172a' }}>
        <img
          src={imageUrl}
          alt={challenge.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.3s ease',
          }}
          className="hover:scale-105"
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.2) 0%, rgba(9, 13, 22, 0.85) 100%)',
          }}
        />

        {/* Top Badges */}
        <div style={{ position: 'absolute', top: '12px', left: '12px', right: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <StatusBadge status={challenge.status} />
          <PriorityIndicator score={challenge.priority_score} showLabel={false} />
        </div>

        {/* Bottom District & Category Chips */}
        <div style={{ position: 'absolute', bottom: '10px', left: '12px', right: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="glass-pill" style={{ background: 'rgba(0, 0, 0, 0.65)', fontSize: '0.75rem', padding: '0.2rem 0.55rem' }}>
            <MapPin size={12} color="#10b981" />
            <span>{challenge.district}</span>
          </div>

          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              background: 'rgba(59, 130, 246, 0.3)',
              color: '#93c5fd',
              padding: '0.2rem 0.6rem',
              borderRadius: 'var(--radius-full)',
              border: '1px solid rgba(59, 130, 246, 0.4)',
            }}
          >
            {challenge.categories?.name || challenge.ai_classification?.categoryName || 'Civic Problem'}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1, gap: '0.75rem' }}>
        <h4
          style={{
            fontSize: '1.05rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            lineHeight: 1.35,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {challenge.title}
        </h4>

        <p
          style={{
            fontSize: '0.84rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            marginBottom: 'auto',
          }}
        >
          {challenge.description}
        </p>

        {/* Assigned University */}
        <div
          style={{
            background: 'var(--bg-glass)',
            padding: '0.6rem 0.75rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
          }}
        >
          <Building2 size={14} color="#3b82f6" />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)', fontWeight: 500 }}>
            {challenge.institutions?.name || 'Assigned to BIT Sindri'}
          </span>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Calendar size={12} /> {new Date(challenge.created_at).toLocaleDateString()}
          </span>

          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.82rem', fontWeight: 600, color: 'var(--emerald-500)' }}>
            View Details <ArrowRight size={14} />
          </span>
        </div>
      </div>
    </div>
  );
};
