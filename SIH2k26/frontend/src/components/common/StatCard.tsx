import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: React.ReactNode;
  trend?: string;
  glowColor?: 'emerald' | 'sapphire' | 'amber' | 'purple';
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  icon,
  trend,
  glowColor = 'emerald',
}) => {
  const getGlowStyle = () => {
    switch (glowColor) {
      case 'sapphire': return 'rgba(59, 130, 246, 0.15)';
      case 'amber': return 'rgba(245, 158, 11, 0.15)';
      case 'purple': return 'rgba(139, 92, 246, 0.15)';
      default: return 'rgba(16, 185, 129, 0.15)';
    }
  };

  const getIconColor = () => {
    switch (glowColor) {
      case 'sapphire': return '#3b82f6';
      case 'amber': return '#f59e0b';
      case 'purple': return '#8b5cf6';
      default: return '#10b981';
    }
  };

  return (
    <div
      className="glass-panel glass-panel-hover"
      style={{
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          {label}
        </span>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: 'var(--radius-md)',
            background: getGlowStyle(),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: getIconColor(),
          }}
        >
          {icon}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem' }}>
        <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
          {value}
        </h2>
        {trend && (
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#10b981' }}>
            {trend}
          </span>
        )}
      </div>

      {subtext && (
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 'auto' }}>
          {subtext}
        </p>
      )}
    </div>
  );
};
