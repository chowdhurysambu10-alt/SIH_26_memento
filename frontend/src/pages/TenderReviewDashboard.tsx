import React, { useEffect, useState } from 'react';
import { adminApi } from '../api/admin';
import { dashboardsApi, DashboardChallenge } from '../api/dashboards';
import { useUI } from '../context/UIContext';
import { Building2, CheckCircle, ChevronDown, ChevronUp, FileText, MapPin, X } from 'lucide-react';

export const TenderReviewDashboard: React.FC = () => {
  const { showAlert, setGlobalLoading } = useUI();
  const [challenges, setChallenges] = useState<DashboardChallenge[]>([]);
  const [expandedChallengeId, setExpandedChallengeId] = useState<string | null>(null);
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProposals, setLoadingProposals] = useState(false);
  const [viewProposalModal, setViewProposalModal] = useState<any | null>(null);

  const fetchChallenges = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getAllChallenges();
      // Show challenges that are open for bids (submitted or routed) or under review
      setChallenges(data.filter((c: any) => c.status === 'submitted' || c.status === 'routed' || c.status === 'under_review'));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, []);

  const loadProposals = async (challengeId: string) => {
    setLoadingProposals(true);
    try {
      const data = await dashboardsApi.getChallengeProposals(challengeId);
      setProposals(data);
    } catch (e: any) {
      showAlert('Failed to load proposals: ' + e.message, 'error');
    } finally {
      setLoadingProposals(false);
    }
  };

  const handleToggleChallenge = (c: DashboardChallenge) => {
    if (expandedChallengeId === c.id) {
      setExpandedChallengeId(null);
      setProposals([]);
    } else {
      setExpandedChallengeId(c.id);
      loadProposals(c.id);
    }
  };

  const handleApproveProposal = async (proposalId: string, challengeId: string) => {
    if (!window.confirm('Are you sure you want to approve this proposal? All other bids will be rejected.')) return;
    
    setGlobalLoading(true);
    try {
      await dashboardsApi.approveProposal(challengeId, proposalId);
      showAlert('Proposal approved successfully. Institution is now assigned.', 'success');
      setViewProposalModal(null);
      fetchChallenges();
      if (expandedChallengeId === challengeId) {
         loadProposals(challengeId);
      }
    } catch (e: any) {
      showAlert('Failed to approve proposal: ' + e.message, 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading active tenders...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>Tender Review Dashboard</h2>
        <p style={{ fontSize: '15px', color: '#64748b', margin: 0 }}>Review and approve proposals (bids) organized by problem (challenge).</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {challenges.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
            <FileText size={48} color="#94a3b8" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ margin: '0 0 8px', color: '#475569', fontSize: '18px' }}>No Active Tenders</h3>
            <p style={{ color: '#94a3b8', margin: 0 }}>There are no challenges currently open for bidding or under review.</p>
          </div>
        )}

        {challenges.map(c => {
          const isExpanded = expandedChallengeId === c.id;
          return (
            <div key={c.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: isExpanded ? '0 4px 6px -1px rgba(0, 0, 0, 0.05)' : 'none', transition: 'all 0.2s' }}>
              {/* Problem Card Header */}
              <div 
                onClick={() => handleToggleChallenge(c)}
                style={{ padding: '20px 24px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isExpanded ? '#f8fafc' : '#fff' }}
              >
                <div>
                  <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>{c.title}</h3>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', border: '1px solid #e2e8f0', textTransform: 'uppercase', fontWeight: 600 }}>
                      {c.status}
                    </span>
                    {c.district && (
                      <span style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={12} /> {c.district}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ color: '#94a3b8', background: '#f1f5f9', padding: '8px', borderRadius: '50%' }}>
                  {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>

              {/* Problem Card Body - Bids */}
              {isExpanded && (
                <div style={{ padding: '24px', borderTop: '1px solid #e2e8f0', background: '#fff' }}>
                  <h4 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>Submitted Bids</h4>
                  
                  {loadingProposals ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Loading bids...</div>
                  ) : proposals.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '8px', color: '#64748b' }}>
                      No bids submitted yet for this tender.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                      {proposals.map(p => (
                        <div key={p.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', background: p.status === 'approved' ? '#f0fdf4' : p.status === 'rejected' ? '#fef2f2' : '#f8fafc', position: 'relative' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                            <div>
                              <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                <Building2 size={15} color="#475569" /> {p.institutions?.name || 'Unknown Institution'}
                              </div>
                              <div style={{ fontSize: '12px', color: '#64748b' }}>{p.institutions?.district} • {p.institutions?.type}</div>
                            </div>
                            <span style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '4px', background: p.status === 'approved' ? '#dcfce7' : p.status === 'rejected' ? '#fee2e2' : '#e0e7ff', color: p.status === 'approved' ? '#166534' : p.status === 'rejected' ? '#991b1b' : '#3730a3', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              {p.status}
                            </span>
                          </div>
                          
                          <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', fontSize: '13px', color: '#334155', background: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                            <div style={{ flex: 1 }}>
                              <span style={{ display: 'block', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, marginBottom: '2px' }}>Budget</span>
                              <strong>{p.budget_estimate}</strong>
                            </div>
                            <div style={{ flex: 1 }}>
                              <span style={{ display: 'block', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, marginBottom: '2px' }}>Timeline</span>
                              <strong>{p.timeline_estimate}</strong>
                            </div>
                          </div>

                          <button 
                            onClick={() => setViewProposalModal({ ...p, challengeId: c.id })}
                            style={{ width: '100%', padding: '8px 12px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', fontWeight: 600, color: '#0f172a', cursor: 'pointer', transition: 'background 0.2s' }}
                            onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'}
                            onMouseOut={e => e.currentTarget.style.background = '#fff'}
                          >
                            Review Full Proposal
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* View Proposal Modal */}
      {viewProposalModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px'
        }}>
          <div style={{
            background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '700px',
            maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>Proposal Details</h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>From: <strong style={{ color: '#0f172a' }}>{viewProposalModal.institutions?.name}</strong></p>
              </div>
              <button 
                onClick={() => setViewProposalModal(null)}
                style={{ background: 'none', border: 'none', fontSize: '24px', color: '#94a3b8', cursor: 'pointer', lineHeight: 1 }}
              >&times;</button>
            </div>
            
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
                <div><span style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Estimated Budget</span><span style={{ fontSize: '15px', color: '#0f172a', fontWeight: 500 }}>{viewProposalModal.budget_estimate}</span></div>
                <div><span style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Estimated Timeline</span><span style={{ fontSize: '15px', color: '#0f172a', fontWeight: 500 }}>{viewProposalModal.timeline_estimate}</span></div>
                <div><span style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Contact Email</span><span style={{ fontSize: '15px', color: '#0f172a', fontWeight: 500 }}>{viewProposalModal.contact_email}</span></div>
                <div><span style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Contact Phone</span><span style={{ fontSize: '15px', color: '#0f172a', fontWeight: 500 }}>{viewProposalModal.contact_phone || 'N/A'}</span></div>
              </div>

              <div>
                <h4 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>Proposed Solution</h4>
                <div style={{ padding: '16px', background: '#f1f5f9', borderRadius: '8px', fontSize: '14px', color: '#334155', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                  {viewProposalModal.proposal_text}
                </div>
              </div>
            </div>

            <div style={{ padding: '20px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', borderRadius: '0 0 16px 16px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                onClick={() => setViewProposalModal(null)}
                style={{ padding: '10px 20px', background: '#fff', border: '1px solid #cbd5e1', color: '#475569', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
              >Close</button>
              {viewProposalModal.status === 'submitted' && (
                <button 
                  onClick={() => handleApproveProposal(viewProposalModal.id, viewProposalModal.challengeId)}
                  style={{ padding: '10px 24px', background: '#16a34a', border: 'none', color: '#fff', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <CheckCircle size={18} /> Approve & Assign
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
