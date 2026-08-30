import React from 'react';
import { AiClassification } from '../../types/challenge.types';
import { Sparkles, Brain, Cpu, Tag, CopyCheck, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface AiExplanationCardProps {
  classification?: AiClassification;
  assignedInstitutionName?: string;
}

export const AiExplanationCard: React.FC<AiExplanationCardProps> = ({
  classification,
  assignedInstitutionName,
}) => {
  if (!classification) return null;

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #10b981, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
            }}
          >
            <Brain size={18} />
          </div>
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span>AI Triage & Deduplication Engine</span>
              <Sparkles size={14} color="#10b981" />
            </h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Provider: {classification.providerUsed || 'Google AI Studio Gemma 2 9B'}
            </span>
          </div>
        </div>

        <div className="glass-pill" style={{ color: '#34d399', fontSize: '0.78rem' }}>
          <Cpu size={13} /> Automated Triage
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
        {/* Category */}
        <div style={{ background: 'var(--bg-glass)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
            Classified Category
          </span>
          <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#38bdf8' }}>
            {classification.categoryName}
          </span>
        </div>

        {/* Priority Score */}
        <div style={{ background: 'var(--bg-glass)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
            Calculated Severity Score
          </span>
          <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#f59e0b' }}>
            {classification.priorityScore}/100
          </span>
        </div>

        {/* Deduplication check */}
        <div style={{ background: 'var(--bg-glass)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
            Duplicate Similarity
          </span>
          <span style={{ fontSize: '0.92rem', fontWeight: 700, color: classification.duplicateCandidateId ? '#f43f5e' : '#34d399', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <CheckCircle2 size={14} />
            {classification.duplicateCandidateId ? 'Duplicate Detected' : 'Unique (New Problem)'}
          </span>
        </div>
      </div>

      {/* Rationale */}
      {classification.rationale && (
        <div style={{ marginBottom: '0.85rem' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
            AI Routing Rationale & Impact Assessment:
          </span>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', background: 'rgba(0, 0, 0, 0.25)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', lineHeight: 1.45, borderLeft: '3px solid var(--emerald-500)' }}>
            {classification.rationale}
          </p>
        </div>
      )}

      {/* Keywords */}
      {classification.recommendedKeywords && classification.recommendedKeywords.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            <Tag size={12} /> Keywords:
          </span>
          {classification.recommendedKeywords.map((kw, i) => (
            <span
              key={i}
              style={{
                fontSize: '0.75rem',
                background: 'rgba(255, 255, 255, 0.08)',
                padding: '0.15rem 0.5rem',
                borderRadius: 'var(--radius-full)',
                color: 'var(--text-secondary)',
              }}
            >
              #{kw}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
