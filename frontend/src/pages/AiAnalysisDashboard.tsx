import React, { useState, useEffect } from 'react';
import { dashboardsApi, DashboardChallenge } from '../api/dashboards';
import { useAuth } from '../context/AuthContext';
import {
  Cpu,
  Edit3,
  CheckCircle,
  AlertTriangle,
  Clock,
  RotateCw,
  Sparkles,
  Search,
  X,
} from 'lucide-react';

const CATEGORIES_LIST = [
  'Water & Sanitation',
  'Healthcare',
  'Education',
  'Agriculture',
  'Urban Infrastructure',
  'Environment & Forestry',
  'Clean Energy',
  'Rural Livelihoods',
  'Accessibility & Inclusion',
  'Public Administration',
];

export const AiAnalysisDashboard: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [challenges, setChallenges] = useState<DashboardChallenge[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [expandedSummaryId, setExpandedSummaryId] = useState<string | null>(null);

  // Override Modal State
  const [selectedChallenge, setSelectedChallenge] = useState<DashboardChallenge | null>(null);
  const [overrideCategory, setOverrideCategory] = useState<string>('Water & Sanitation');

  const [overrideNotes, setOverrideNotes] = useState<string>('');
  const [savingOverride, setSavingOverride] = useState<boolean>(false);

  const fetchChallenges = async () => {
    setLoading(true);
    try {
      const data = await dashboardsApi.getAiAnalysisChallenges();
      setChallenges(data);
    } catch (err) {
      console.error('Failed to load AI challenges:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, []);

  const openOverrideModal = (c: DashboardChallenge) => {
    setSelectedChallenge(c);
    setOverrideCategory(c.category || 'Water & Sanitation');

    setOverrideNotes('');
  };

  const handleSaveOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChallenge) return;

    if (!isAuthenticated) {
      alert('Please sign in as an Admin/Reviewer to apply manual classification overrides.');
      return;
    }

    setSavingOverride(true);
    try {
      await dashboardsApi.overrideAiClassification(
        selectedChallenge.id,
        overrideCategory,
        overrideNotes
      );

      // Update state locally
      setChallenges((prev) =>
        prev.map((c) =>
          c.id === selectedChallenge.id
            ? {
                ...c,
                category: overrideCategory,

                model_used: 'human_override',
                ai_confidence: 1.0,
              }
            : c
        )
      );

      setSelectedChallenge(null);
      alert('Override saved successfully! Logged in AI Audit Trail.');
    } catch (err: any) {
      alert('Failed to save override: ' + err.message);
    } finally {
      setSavingOverride(false);
    }
  };

  const filteredChallenges = challenges.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      (c.category && c.category.toLowerCase().includes(search.toLowerCase())) ||
      c.district.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '1180px', margin: '0 auto', padding: '24px 20px 80px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#f5f3ff', padding: '6px 14px', borderRadius: '20px', color: '#7c3aed', fontWeight: 600, fontSize: '13px', marginBottom: '8px' }}>
            <Cpu size={16} /> AI Classification & Duplicate Detection Audit
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>
            AI Analysis & Reviewer Override
          </h1>
          <p style={{ color: '#64748b', fontSize: '14.5px', marginTop: '4px' }}>
            Automated Gemma-2 & local Ollama inferences with human-in-the-loop validation.
          </p>
        </div>

        <button
          className="btn btn-outline"
          onClick={fetchChallenges}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <RotateCw size={14} /> Refresh Logs
        </button>
      </div>

      {/* Search Input */}
      <div style={{ marginBottom: '20px', position: 'relative', maxWidth: '400px' }}>
        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        <input
          type="text"
          placeholder="Filter by challenge title, category, or district..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ paddingLeft: '38px', borderRadius: '8px', fontSize: '14px' }}
        />
      </div>

      {/* Table Container */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
            <Sparkles size={32} className="animate-spin" style={{ margin: '0 auto 12px', color: '#7c3aed' }} />
            <p>Fetching AI inference logs...</p>
          </div>
        ) : filteredChallenges.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
            <p>No challenge records found.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600, fontSize: '13px' }}>
                  <th style={{ padding: '14px 18px' }}>Challenge Title</th>
                  <th style={{ padding: '14px 18px' }}>AI Category</th>
                  <th style={{ padding: '14px 18px' }}>Confidence</th>

                  <th style={{ padding: '14px 18px' }}>AI Summary</th>
                  <th style={{ padding: '14px 18px' }}>Model</th>
                  <th style={{ padding: '14px 18px' }}>Status</th>
                  <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredChallenges.map((c) => {
                  const confidence = c.ai_confidence !== undefined ? Number(c.ai_confidence) : 0.88;

                  const model = c.model_used || 'gemma-2';
                  const isExpanded = expandedSummaryId === c.id;

                  // Status logic:
                  // Needs human review if confidence < 0.6, else Analyzed
                  let statusBadge = { label: 'Analyzed', color: '#15803d', bg: '#dcfce7', icon: CheckCircle };
                  if (confidence < 0.6) {
                    statusBadge = { label: 'Needs human review', color: '#b91c1c', bg: '#fee2e2', icon: AlertTriangle };
                  }

                  const IconComp = statusBadge.icon;

                  return (
                    <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                      <td style={{ padding: '16px 18px', fontWeight: 600, color: '#0f172a', maxWidth: '220px' }}>
                        <div>{c.title}</div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{c.district}</div>
                      </td>

                      <td style={{ padding: '16px 18px' }}>
                        <span className="tag tag-category">{c.category || 'Water & Sanitation'}</span>
                      </td>

                      <td style={{ padding: '16px 18px', fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '45px', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${Math.round(confidence * 100)}%`, height: '100%', background: confidence >= 0.7 ? '#16a34a' : '#eab308' }} />
                          </div>
                          <span>{Math.round(confidence * 100)}%</span>
                        </div>
                      </td>



                      <td style={{ padding: '16px 18px', maxWidth: '240px', color: '#475569', fontSize: '13px' }}>
                        {c.ai_summary ? (
                          <div>
                            <span>
                              {isExpanded
                                ? c.ai_summary
                                : c.ai_summary.length > 65
                                ? `${c.ai_summary.substring(0, 65)}...`
                                : c.ai_summary}
                            </span>
                            {c.ai_summary.length > 65 && (
                              <button
                                onClick={() => setExpandedSummaryId(isExpanded ? null : c.id)}
                                style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '12px', fontWeight: 600, cursor: 'pointer', marginLeft: '4px' }}
                              >
                                {isExpanded ? 'Show less' : 'More'}
                              </button>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>Standard classification</span>
                        )}
                      </td>

                      <td style={{ padding: '16px 18px', fontSize: '12.5px', fontFamily: 'monospace' }}>
                        <span
                          style={{
                            background: model === 'human_override' ? '#fdf2f8' : '#f1f5f9',
                            color: model === 'human_override' ? '#be185d' : '#334155',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontWeight: 600,
                          }}
                        >
                          {model}
                        </span>
                      </td>

                      <td style={{ padding: '16px 18px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 600,
                            background: statusBadge.bg,
                            color: statusBadge.color,
                          }}
                        >
                          <IconComp size={13} />
                          {statusBadge.label}
                        </span>
                      </td>

                      <td style={{ padding: '16px 18px', textAlign: 'right' }}>
                        <button
                          className="btn btn-outline"
                          onClick={() => openOverrideModal(c)}
                          style={{ padding: '6px 12px', fontSize: '12.5px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Edit3 size={13} /> Override
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Override Modal */}
      {selectedChallenge && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <button className="modal-close" onClick={() => setSelectedChallenge(null)}>
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px' }}>
              Manual AI Override
            </h3>
            <p style={{ color: '#64748b', fontSize: '13.5px', marginBottom: '20px' }}>
              Override AI assigned category for <strong>"{selectedChallenge.title}"</strong>.
            </p>

            <form onSubmit={handleSaveOverride}>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select value={overrideCategory} onChange={(e) => setOverrideCategory(e.target.value)}>
                  {CATEGORIES_LIST.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>



              <div className="form-group">
                <label className="form-label">Reviewer Notes (Logged in Audit Log)</label>
                <textarea
                  rows={2}
                  placeholder="Reason for manual classification override..."
                  value={overrideNotes}
                  onChange={(e) => setOverrideNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={savingOverride}
                  style={{ padding: '12px' }}
                >
                  {savingOverride ? 'Saving Override...' : 'Confirm Human Override'}
                </button>
                <button
                  type="button"
                  className="btn btn-outline w-100"
                  onClick={() => setSelectedChallenge(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
