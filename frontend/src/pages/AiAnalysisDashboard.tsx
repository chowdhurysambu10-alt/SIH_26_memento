import React, { useState, useEffect } from 'react';
import { dashboardsApi, DashboardChallenge } from '../api/dashboards';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
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

// Pure code hierarchy — mirrors the backend ChallengesService.getHierarchicalScore()
// Water > Healthcare > Energy > Urban > Environment > Agriculture > Rural > Education > Accessibility > Admin
const HIERARCHICAL_SCORES: Record<string, number> = {
  'water & sanitation': 95,
  'water': 95,
  'healthcare': 92,
  'clean energy': 80,
  'energy': 80,
  'urban infrastructure': 77,
  'urban_development': 77,
  'environment & forestry': 74,
  'environment': 74,
  'agriculture': 68,
  'rural livelihoods': 65,
  'rural_livelihoods': 65,
  'education': 58,
  'accessibility & inclusion': 54,
  'accessibility': 54,
  'public administration': 50,
  'public_administration': 50,
};

function getHierarchicalScore(category: string): number {
  if (!category) return 50;
  const key = category.toLowerCase().trim();
  return HIERARCHICAL_SCORES[key] ?? 50;
}


export const AiAnalysisDashboard: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { showAlert } = useUI();
  const [challenges, setChallenges] = useState<DashboardChallenge[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterAnalysisStatus, setFilterAnalysisStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('importance_desc');
  const [expandedSummaryId, setExpandedSummaryId] = useState<string | null>(null);

  // Override Modal State
  const [selectedChallenge, setSelectedChallenge] = useState<DashboardChallenge | null>(null);
  const [overrideCategory, setOverrideCategory] = useState<string>('Water & Sanitation');
  const [overridePriority, setOverridePriority] = useState<number>(50);

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
    setOverridePriority(c.priority_score || 50);

    setOverrideNotes('');
  };

  const handleSaveOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChallenge) return;

    if (!isAuthenticated) {
      showAlert('Please sign in as an Admin/Reviewer to apply manual classification overrides.', 'error');
      return;
    }

    setSavingOverride(true);
    try {
      await dashboardsApi.overrideAiClassification(
        selectedChallenge.id,
        overrideCategory,
        overrideNotes,
        overridePriority
      );

      // Update state locally
      setChallenges((prev) =>
        prev.map((c) =>
          c.id === selectedChallenge.id
            ? {
                ...c,
                category: overrideCategory,
                priority_score: overridePriority,
                model_used: 'human_override',
                ai_confidence: 1.0,
              }
            : c
        )
      );

      setSelectedChallenge(null);
      showAlert('Override saved successfully! Logged in AI Audit Trail.', 'success');
    } catch (err: any) {
      showAlert('Failed to save override: ' + err.message, 'error');
    } finally {
      setSavingOverride(false);
    }
  };

  const filteredAndSortedChallenges = challenges
    .filter((c) => {
      // 1. Text Search
      if (search) {
        const query = search.toLowerCase();
        if (
          !c.title.toLowerCase().includes(query) &&
          !(c.category && c.category.toLowerCase().includes(query)) &&
          !c.district.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      // 2. Category Filter
      if (filterCategory !== 'all' && c.category !== filterCategory) {
        return false;
      }

      // 3. AI Analysis Status Filter
      if (filterAnalysisStatus !== 'all') {
        const hasAiAnalysis = c.ai_confidence !== undefined && c.ai_confidence !== null;
        const confidence = c.ai_confidence !== undefined ? Number(c.ai_confidence) : 0.88;
        
        let status = 'Analyzed';
        if (!hasAiAnalysis) status = 'Not Analyzed';

        if (filterAnalysisStatus !== status) return false;
      }

      return true;
    })
    .sort((a, b) => {
      const importanceA = a.priority_score || getHierarchicalScore(a.category || '');
      const importanceB = b.priority_score || getHierarchicalScore(b.category || '');
      
      const hierarchicalA = getHierarchicalScore(a.category || '');
      const hierarchicalB = getHierarchicalScore(b.category || '');
      
      const supportA = a.support_count || 0;
      const supportB = b.support_count || 0;

      switch (sortBy) {
        case 'importance_desc': return importanceB - importanceA;
        case 'importance_asc': return importanceA - importanceB;
        case 'hierarchical_desc': return hierarchicalB - hierarchicalA;
        case 'support_desc': return supportB - supportA;
        default: return 0;
      }
    });

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
            Automated Gemma-2 inferences with human-in-the-loop validation.
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

      {/* Controls Container (Search, Filters, Sort) */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 300px' }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search by title, category, or district..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '38px', borderRadius: '8px', fontSize: '14px', width: '100%', border: '1px solid #cbd5e1' }}
          />
        </div>
        
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', background: '#fff', outline: 'none', minWidth: '150px' }}
        >
          <option value="all">All Categories</option>
          {CATEGORIES_LIST.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select
          value={filterAnalysisStatus}
          onChange={(e) => setFilterAnalysisStatus(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', background: '#fff', outline: 'none', minWidth: '150px' }}
        >
          <option value="all">All AI Statuses</option>
          <option value="Analyzed">Analyzed</option>
          <option value="Not Analyzed">Not Analyzed</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', background: '#fff', outline: 'none', minWidth: '180px' }}
        >
          <option value="importance_desc">Sort: Highest Importance</option>
          <option value="importance_asc">Sort: Lowest Importance</option>
          <option value="hierarchical_desc">Sort: Hierarchical Score</option>
          <option value="support_desc">Sort: Most Supported</option>
        </select>
      </div>

      {/* Table Container */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
            <Sparkles size={32} className="animate-spin" style={{ margin: '0 auto 12px', color: '#7c3aed' }} />
            <p>Fetching AI inference logs...</p>
          </div>
        ) : filteredAndSortedChallenges.length === 0 ? (
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
                  <th style={{ padding: '14px 18px' }}>Importance</th>
                  <th style={{ padding: '14px 18px' }}>Support Count</th>
                  <th style={{ padding: '14px 18px' }}>Hierarchical Score</th>
                  <th style={{ padding: '14px 18px' }}>Status</th>
                  <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedChallenges.map((c) => {
                  const confidence = c.ai_confidence !== undefined ? Number(c.ai_confidence) : 0.88;

                  const model = c.model_used || 'gemma-2';
                  const isExpanded = expandedSummaryId === c.id;

                  // Hierarchical Score: pure code, determined by category name
                  const hierarchicalScore = getHierarchicalScore(c.category || '');

                  // Importance: stored in priority_score (already computed via formula on backend)
                  const importance = c.priority_score || hierarchicalScore;

                  // Status: not analyzed if no ai_confidence stored
                  const hasAiAnalysis = c.ai_confidence !== undefined && c.ai_confidence !== null;
                  let statusBadge = { label: 'Analyzed', color: '#15803d', bg: '#dcfce7', icon: CheckCircle };
                  if (!hasAiAnalysis) {
                    statusBadge = { label: 'Not Analyzed', color: '#92400e', bg: '#fef3c7', icon: Clock };
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

                      {/* IMPORTANCE: hierarchical base + AI severity + support boost */}
                      <td style={{ padding: '16px 18px', fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '45px', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${importance}%`, height: '100%', background: importance >= 75 ? '#16a34a' : importance >= 50 ? '#eab308' : '#ef4444' }} />
                          </div>
                          <span>{importance}</span>
                        </div>
                      </td>

                      <td style={{ padding: '16px 18px', fontWeight: 600, color: '#334155' }}>
                        {c.support_count || 0}
                      </td>

                      {/* HIERARCHICAL SCORE: pure code, fixed by category policy */}
                      <td style={{ padding: '16px 18px', fontWeight: 700, color: '#4f46e5' }}>
                        {hierarchicalScore}
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

              <div className="form-group" style={{ marginTop: '16px' }}>
                <label className="form-label">Hierarchical Score (Priority)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  className="input-field"
                  value={overridePriority}
                  onChange={(e) => setOverridePriority(Number(e.target.value))}
                />
              </div>

              <div className="form-group" style={{ marginTop: '16px' }}>
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
