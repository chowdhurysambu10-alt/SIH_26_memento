import React, { useEffect, useState, useCallback } from 'react';
import { dashboardsApi, DashboardChallenge } from '../api/dashboards';
import { adminApi } from '../api/admin';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { Building2, CheckCircle, Clock, FileText, ArrowRight, ShieldCheck, AlertCircle, Bell, Lock, Mail, Users, Save, Download, MapPin } from 'lucide-react';

interface InstitutionDashboardProps {
  activeView: string;
  setActiveView?: (view: string) => void;
}

export const InstitutionDashboard: React.FC<InstitutionDashboardProps> = ({ activeView, setActiveView }) => {
  const { user } = useAuth();
  const { showAlert } = useUI();
  const [challenges, setChallenges] = useState<DashboardChallenge[]>([]);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [filterTab, setFilterTab] = useState<'all' | 'verified' | 'pending' | 'available' | 'proposals'>('all');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    JSON.parse(localStorage.getItem('inst_categories') || '["Education", "Agriculture", "Healthcare"]')
  );
  const [summaryEnabled, setSummaryEnabled] = useState(localStorage.getItem('inst_summary') === 'true');
  const [emailNotifications, setEmailNotifications] = useState(localStorage.getItem('inst_email') !== 'false');
  const [inPlatformAlerts, setInPlatformAlerts] = useState(localStorage.getItem('inst_alerts') !== 'false');
  
  // Proposals state
  const [proposalModalOpen, setProposalModalOpen] = useState(false);
  const [selectedChallengeForProposal, setSelectedChallengeForProposal] = useState<DashboardChallenge | null>(null);
  const [proposalForm, setProposalForm] = useState({
    proposal_text: '',
    budget_estimate: '',
    timeline_estimate: '',
    contact_phone: user?.contact || ''
  });
  const [myProposals, setMyProposals] = useState<any[]>([]);

  useEffect(() => {
    localStorage.setItem('inst_categories', JSON.stringify(selectedCategories));
    localStorage.setItem('inst_summary', String(summaryEnabled));
    localStorage.setItem('inst_email', String(emailNotifications));
    localStorage.setItem('inst_alerts', String(inPlatformAlerts));
  }, [selectedCategories, summaryEnabled, emailNotifications, inPlatformAlerts]);

  const fetchInstitutions = async () => {
    try {
      const data = await adminApi.getInstitutions();
      setInstitutions(data);
      if (user?.org_id) {
        setSelectedOrgId(user.org_id);
      } else {
        const myInst = data.find(i => 
          user?.name && i.name && (
            i.name.toLowerCase().includes(user.name.toLowerCase()) ||
            user.name.toLowerCase().includes(i.name.toLowerCase())
          )
        );
        if (myInst) {
          setSelectedOrgId(myInst.id);
        } else if (data.length > 0 && !selectedOrgId) {
          setSelectedOrgId(data[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to fetch institutions:', e);
    }
  };

  const fetchChallenges = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await adminApi.getAllChallenges();
      setChallenges(data);
      if (user?.org_id) {
        const proposals = await dashboardsApi.getMyProposals();
        setMyProposals(proposals);
      }
    } catch (e) {
      console.error(e);
    }
    if (!silent) setLoading(false);
  };

  useEffect(() => {
    fetchInstitutions();
  }, []);

  useEffect(() => {
    if (activeView === 'challenges' || activeView === 'dashboard' || activeView === 'summary') {
      fetchChallenges();
    }
  }, [activeView]);

  // Auto-refresh: keep challenges up-to-date every 15 s — silent so no loading blink
  const refreshChallenges = useCallback(() => {
    fetchChallenges(true);
  }, []);

  useAutoRefresh(refreshChallenges, 15000);
  const isSuperAdmin = user?.role === 'super_admin' || (user?.role as any) === 'admin' || user?.role === 'govt_viewer';
  const activeOrgId = user?.org_id || selectedOrgId;
  const currentInstitution = institutions.find(i => 
    (activeOrgId && i.id === activeOrgId) ||
    (user?.org_id && i.id === user.org_id) ||
    (user?.name && i.name && (
      i.name.toLowerCase().includes(user.name.toLowerCase()) ||
      user.name.toLowerCase().includes(i.name.toLowerCase())
    ))
  );

  // Helper to test if a challenge is associated with this institution
  const isMine = (c: DashboardChallenge): boolean => {
    return Boolean(
      (activeOrgId && (c.assigned_institution_id === activeOrgId || c.institutions?.id === activeOrgId)) ||
      (user?.org_id && (c.assigned_institution_id === user.org_id || c.institutions?.id === user.org_id)) ||
      (user?.name && c.institutions?.name && (
        c.institutions.name.toLowerCase().includes(user.name.toLowerCase()) ||
        user.name.toLowerCase().includes(c.institutions.name.toLowerCase())
      )) ||
      (currentInstitution?.name && c.institutions?.name && (
        c.institutions.name.toLowerCase().includes(currentInstitution.name.toLowerCase()) ||
        currentInstitution.name.toLowerCase().includes(c.institutions.name.toLowerCase())
      ))
    );
  };

  // Grouped challenges
  const myVerifiedChallenges = challenges.filter(c => 
    isMine(c) && ['in_progress', 'team_formed', 'under_action', 'completed', 'resolved'].includes(c.status)
  );

  const myPendingClaims = challenges.filter(c => 
    isMine(c) && c.status === 'under_review'
  );

  const availableChallenges = challenges.filter(c => 
    !c.assigned_institution_id && c.status === 'routed'
  );

  const displayedChallenges = challenges.filter(c => {
    if (filterTab === 'verified') {
      return isMine(c) && ['in_progress', 'team_formed', 'under_action', 'completed', 'resolved'].includes(c.status);
    }
    if (filterTab === 'pending') {
      return isMine(c) && c.status === 'under_review';
    }
    if (filterTab === 'available') {
      return !c.assigned_institution_id && c.status === 'routed';
    }
    return true;
  });

  const handleExportCSV = (dataList: DashboardChallenge[], filename: string) => {
    const headers = ['ID', 'Title', 'Category', 'District', 'Status', 'Date'];
    const rows = (dataList || []).map(c => {
      const escapedTitle = (c.title || '').replace(/"/g, '""');
      return [
        c.id,
        `"${escapedTitle}"`,
        `"${c.category || 'General'}"`,
        `"${c.district || ''}"`,
        c.status || 'N/A',
        new Date(c.created_at).toLocaleDateString()
      ];
    });
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showAlert('Export downloaded successfully!', 'success');
  };

  const handleClaim = async (id: string) => {
    try {
      await dashboardsApi.claimChallenge(id, activeOrgId);
      await fetchChallenges();
      showAlert(`Claim request submitted for ${currentInstitution?.name || user?.name || 'your institution'}! Waiting for Admin verification.`, 'success');
    } catch (e: any) {
      showAlert('Failed to claim challenge: ' + (e.message || 'Error occurred'), 'error');
    }
  };

  const handleSubmitProposal = async () => {
    if (!selectedChallengeForProposal) return;
    if (!proposalForm.proposal_text.trim() || !proposalForm.budget_estimate.trim() || !proposalForm.timeline_estimate.trim() || !(proposalForm.contact_phone || user?.contact)) {
      showAlert('Please fill in all mandatory fields.', 'error');
      return;
    }
    setLoading(true);
    try {
      await dashboardsApi.submitProposal(selectedChallengeForProposal.id, {
        ...proposalForm,
        contact_phone: proposalForm.contact_phone || user?.contact || ''
      });
      showAlert('Proposal submitted successfully! The admin will review your bid.', 'success');
      setProposalModalOpen(false);
      setSelectedChallengeForProposal(null);
      setProposalForm({ proposal_text: '', budget_estimate: '', timeline_estimate: '', contact_phone: user?.contact || '' });
      await fetchChallenges();
    } catch (e: any) {
      showAlert(e.message || 'Failed to submit proposal', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 1. OVERVIEW VIEW
  if (activeView === 'dashboard') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {/* Header */}
        <div>
          <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
            Institution Portal Overview
          </h2>
          <p style={{ color: '#64748b', margin: 0, fontSize: '15px' }}>
            Logged in as <strong style={{ color: '#0f172a' }}>{currentInstitution?.name || user?.name || 'Authorized Institution'}</strong>
          </p>
        </div>

        {/* Pending Claim Notice if any */}
        {myPendingClaims.length > 0 && (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Clock size={20} color="#d97706" />
              <div>
                <strong style={{ color: '#92400e', fontSize: '14px' }}>
                  {myPendingClaims.length} Claim Request{myPendingClaims.length > 1 ? 's' : ''} Pending Admin Verification
                </strong>
                <p style={{ margin: '2px 0 0', color: '#b45309', fontSize: '13px' }}>
                  Your claim requests have been submitted to the Memento Admin. As soon as the Admin verifies them, they will appear in your active problem list.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setFilterTab('pending');
                setActiveView?.('challenges');
              }}
              style={{ padding: '8px 16px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              View Requests
            </button>
          </div>
        )}

        {/* Quick Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          {/* 1. Verified & In Progress */}
          <div 
            onClick={() => { setFilterTab('verified'); setActiveView?.('challenges'); }}
            style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '14px', padding: '20px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Verified & Assigned</span>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle size={20} color="#16a34a" />
              </div>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#15803d' }}>{myVerifiedChallenges.length}</div>
            <div style={{ fontSize: '13px', color: '#166534', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>Verified by Admin • In Progress</span>
              <ArrowRight size={14} />
            </div>
          </div>
          {/* 2. Pending Verification (Bids) */}
          <div 
            onClick={() => { setFilterTab('proposals'); setActiveView?.('challenges'); }}
            style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '14px', padding: '20px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Submitted Bids</span>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={20} color="#d97706" />
              </div>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#b45309' }}>{myProposals.filter(p => p.status === 'submitted').length}</div>
            <div style={{ fontSize: '13px', color: '#92400e', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>Awaiting Admin Verification</span>
              <ArrowRight size={14} />
            </div>
          </div>

          {/* 3. Available Unclaimed */}
          <div 
            onClick={() => { setFilterTab('available'); setActiveView?.('challenges'); }}
            style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '14px', padding: '20px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Available to Claim</span>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 size={20} color="#2563eb" />
              </div>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#1d4ed8' }}>{availableChallenges.length}</div>
            <div style={{ fontSize: '13px', color: '#1e40af', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>Open for Adoption</span>
              <ArrowRight size={14} />
            </div>
          </div>

          {/* 4. Total Platform Challenges */}
          <div 
            onClick={() => { setFilterTab('all'); setActiveView?.('challenges'); }}
            style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Tracked</span>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={20} color="#475569" />
              </div>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a' }}>{challenges.length}</div>
            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>Explore All Challenges</span>
              <ArrowRight size={14} />
            </div>
          </div>
        </div>

        {/* Section: Verified & Active Problems for This Institution */}
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={20} color="#16a34a" />
                Verified & Assigned Problems to Your Institution ({myVerifiedChallenges.length})
              </h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
                Problems verified by Admin and officially allocated for student teams and faculty to solve.
              </p>
            </div>
            {myVerifiedChallenges.length > 0 && (
              <button
                onClick={() => { setFilterTab('verified'); setActiveView?.('challenges'); }}
                style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 600, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                View in Full List <ArrowRight size={16} />
              </button>
            )}
          </div>

          {myVerifiedChallenges.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
              <Building2 size={40} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
              <h4 style={{ margin: '0 0 6px', color: '#334155', fontSize: '16px' }}>No Problems Currently Assigned</h4>
              <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '14px', maxWidth: '480px', marginInline: 'auto' }}>
                Browse civic problems submitted by citizens and claim them, or wait for the Admin to allocate challenges directly to your institution.
              </p>
              <button
                onClick={() => { setFilterTab('available'); setActiveView?.('challenges'); }}
                style={{ padding: '10px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '14px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                Browse & Claim Challenges <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {myVerifiedChallenges.map(c => (
                <div 
                  key={c.id} 
                  style={{ 
                    border: '1px solid #bbf7d0', 
                    background: '#f0fdf4', 
                    borderRadius: '12px', 
                    padding: '18px 20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '16px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle size={12} /> VERIFIED & ASSIGNED BY ADMIN
                      </span>
                      {c.district && (
                        <span style={{ fontSize: '12px', background: '#fff', color: '#2563eb', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, border: '1px solid #e2e8f0' }}>
                          {c.district}
                        </span>
                      )}
                      {c.location_text && (
                        <a 
                          href={c.location_text.startsWith('http') ? c.location_text : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.location_text)}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          style={{ fontSize: '12px', display: 'inline-flex', alignItems: 'center', background: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, border: '1px solid #bfdbfe', textDecoration: 'none' }}
                        >
                          <MapPin size={12} style={{ marginRight: 4 }} />
                          Location Link
                        </a>
                      )}
                      {c.category && (
                        <span style={{ fontSize: '12px', background: '#fff', color: '#475569', padding: '2px 8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                          {c.category}
                        </span>
                      )}
                    </div>
                    <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>{c.title}</h4>
                    <p style={{ fontSize: '14px', color: '#475569', margin: 0, maxWidth: '700px' }}>{c.description}</p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, padding: '6px 14px', borderRadius: '8px', background: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 1px 2px rgba(16, 185, 129, 0.2)' }}>
                      <CheckCircle size={16} /> Occupied by You
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. SETTINGS & PROFILE
  if (activeView === 'settings' || activeView === 'profile') {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>
              Institution Settings
            </h2>
            <p style={{ color: '#64748b', margin: 0 }}>Manage your organization's preferences, notifications, and security.</p>
          </div>
          <button 
            onClick={() => {
              localStorage.setItem('inst_summary', String(summaryEnabled));
              localStorage.setItem('inst_categories', JSON.stringify(selectedCategories));
              showAlert('Settings saved successfully', 'success');
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#4c1d95', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 6px rgba(76, 29, 149, 0.2)' }}
          >
            <Save size={18} /> Save Changes
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
          
          {/* Organization Profile Settings */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={18} color="#4c1d95" /> Organization Details
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Registered Name</label>
                <input type="text" defaultValue={currentInstitution?.name || user?.name || 'Institution'} disabled style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#64748b' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Primary Contact Email</label>
                <input type="email" defaultValue={user?.email || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Phone Number</label>
                <input type="tel" defaultValue={user?.contact || currentInstitution?.contact || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>District Location</label>
                <input type="text" defaultValue={currentInstitution?.district || 'Jharkhand'} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
              </div>
            </div>
          </div>

          {/* Notification Preferences */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bell size={18} color="#f59e0b" /> Notification Preferences
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                <div>
                  <span style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155' }}>Email Notifications</span>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Receive updates on new assigned challenges</span>
                </div>
                <input type="checkbox" checked={emailNotifications} onChange={(e) => setEmailNotifications(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#4c1d95' }} />
              </label>
              <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9' }} />
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                <div>
                  <span style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155' }}>In-Platform Alerts</span>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Show badges and modal alerts for activity</span>
                </div>
                <input type="checkbox" checked={inPlatformAlerts} onChange={(e) => setInPlatformAlerts(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#4c1d95' }} />
              </label>
              <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9' }} />
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                <div>
                  <span style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155' }}>Daily Summary Report</span>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Get a daily digest of civic problem metrics</span>
                </div>
                <input type="checkbox" checked={summaryEnabled} onChange={(e) => setSummaryEnabled(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#4c1d95' }} />
              </label>
            </div>
          </div>



          {/* Research & Departments */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} color="#ef4444" /> Active Departments
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>Select the departments your institution has. This helps AI route problems accurately.</p>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {['Education', 'Agriculture', 'Healthcare', 'Water Resources', 'Environment', 'Energy', 'Urban Development', 'Accessibility', 'Public Administration', 'Rural Livelihoods'].map(dept => (
                <label key={dept} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', cursor: 'pointer', border: '1px solid #e2e8f0', transition: 'all 0.2s', borderColor: selectedCategories.includes(dept) ? '#8b5cf6' : '#e2e8f0', backgroundColor: selectedCategories.includes(dept) ? '#ede9fe' : '#f1f5f9' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedCategories.includes(dept)} 
                    onChange={(e) => {
                      if (e.target.checked) setSelectedCategories([...selectedCategories, dept]);
                      else setSelectedCategories(selectedCategories.filter(c => c !== dept));
                    }}
                    style={{ accentColor: '#4c1d95' }} 
                  />
                  <span style={{ color: selectedCategories.includes(dept) ? '#4c1d95' : '#475569', fontWeight: selectedCategories.includes(dept) ? 600 : 400 }}>{dept}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Data & Export */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Download size={18} color="#0284c7" /> Data & Export
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px' }}>Download a complete archive of your assigned civic challenges and institutional reports for auditing purposes.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: 'auto' }}>
              <button
                onClick={() => handleExportCSV(challenges.filter(isMine), 'institution_assigned_challenges')}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '24px 12px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', color: '#334155', cursor: 'pointer', transition: 'all 0.2s', width: '100%' }}
                onMouseOver={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#94a3b8'; e.currentTarget.style.color = '#0f172a'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#334155'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ background: '#e0f2fe', padding: '12px', borderRadius: '50%' }}>
                  <Download size={24} color="#0284c7" />
                </div>
                <span style={{ fontSize: '13px', fontWeight: 600, textAlign: 'center', lineHeight: '1.3' }}>Export<br/>Assigned</span>
              </button>
              <button
                onClick={() => {
                  const summaryChallenges = challenges.filter(c => {
                    if (selectedCategories.length === 0) return false;
                    const targetStr = (c.category || c.title || '').toLowerCase();
                    return selectedCategories.some(cat => {
                      const words = cat.toLowerCase().split(' ').filter(w => w.length > 3);
                      if (words.length === 0) return targetStr.includes(cat.toLowerCase());
                      return words.some(w => targetStr.includes(w));
                    });
                  });
                  handleExportCSV(summaryChallenges, 'daily_summary_report');
                }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '24px 12px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', color: '#334155', cursor: 'pointer', transition: 'all 0.2s', width: '100%' }}
                onMouseOver={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#94a3b8'; e.currentTarget.style.color = '#0f172a'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#334155'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ background: '#d1fae5', padding: '12px', borderRadius: '50%' }}>
                  <FileText size={24} color="#10b981" />
                </div>
                <span style={{ fontSize: '13px', fontWeight: 600, textAlign: 'center', lineHeight: '1.3' }}>Export<br/>Summary</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. SUMMARY VIEW
  if (activeView === 'summary') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={24} color="#10b981" /> Daily Summary Report
            </h2>
            <p style={{ color: '#64748b', margin: 0 }}>Review the latest civic problems matching your selected departments.</p>
          </div>
          {summaryEnabled && (
            <button
              onClick={() => {
                const summaryChallenges = challenges.filter(c => {
                  if (selectedCategories.length === 0) return false;
                  const targetStr = (c.category || c.title || '').toLowerCase();
                  return selectedCategories.some(cat => {
                    const words = cat.toLowerCase().split(' ').filter(w => w.length > 3);
                    if (words.length === 0) return targetStr.includes(cat.toLowerCase());
                    return words.some(w => targetStr.includes(w));
                  });
                });
                handleExportCSV(summaryChallenges, 'daily_summary_report');
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: '#0f172a', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', transition: 'all 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'}
              onMouseOut={(e) => e.currentTarget.style.background = '#fff'}
            >
              <Download size={16} /> Export CSV
            </button>
          )}
        </div>
        
        {!summaryEnabled ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#64748b', background: '#fff', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
            <p style={{ fontSize: '16px', fontWeight: 600, color: '#334155' }}>Daily Summary is disabled.</p>
            <p>Please enable the Daily Summary Report in your Settings to view the digest.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {challenges.filter(c => {
              if (selectedCategories.length === 0) return false;
              const targetStr = (c.category || c.title || '').toLowerCase();
              return selectedCategories.some(cat => {
                const words = cat.toLowerCase().split(' ').filter(w => w.length > 3);
                if (words.length === 0) return targetStr.includes(cat.toLowerCase());
                return words.some(w => targetStr.includes(w));
              });
            }).map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                {c.media_urls && c.media_urls.length > 0 ? (
                  <div style={{ width: '200px', height: '135px', flexShrink: 0, borderRadius: '10px', overflow: 'hidden', background: '#f1f5f9', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)' }}>
                    <img src={c.media_urls[0]} alt={c.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ) : (
                  <div style={{ width: '200px', height: '135px', flexShrink: 0, borderRadius: '10px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', border: '1px solid #e2e8f0' }}>
                    <FileText size={32} />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '6px', background: '#ede9fe', color: '#6d28d9' }}>{c.category || 'General'}</span>
                    <span style={{ fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '6px', background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>{c.status.replace('_', ' ').toUpperCase()}</span>
                    {c.district && <span style={{ fontSize: '12px', color: '#64748b' }}>{c.district}</span>}
                    {c.location_text && (
                      <a 
                        href={c.location_text.startsWith('http') ? c.location_text : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.location_text)}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        style={{ fontSize: '12px', color: '#2563eb', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '2px' }}
                      >
                        <MapPin size={12} /> Map Link
                      </a>
                    )}
                  </div>
                  <h4 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>{c.title}</h4>
                </div>
              </div>
            ))}
            {challenges.filter(c => {
              if (selectedCategories.length === 0) return false;
              const targetStr = (c.category || c.title || '').toLowerCase();
              return selectedCategories.some(cat => {
                const words = cat.toLowerCase().split(' ').filter(w => w.length > 3);
                if (words.length === 0) return targetStr.includes(cat.toLowerCase());
                return words.some(w => targetStr.includes(w));
              });
            }).length === 0 && (
              <div style={{ padding: '48px', textAlign: 'center', color: '#64748b', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', gridColumn: '1 / -1' }}>
                <p style={{ fontSize: '15px' }}>No matching problems found for your selected departments today.</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // 4. CHALLENGES VIEW (Assigned & Claimable Challenges)
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>
            Assigned & Claimable Challenges
          </h2>
          <p style={{ fontSize: '15px', color: '#64748b', margin: 0 }}>
            Review, claim, and work on civic challenges. When claimed, the Memento Admin verifies and assigns the problem to your institution.
          </p>
        </div>
        
        {/* Active Institution Badge */}
        {(currentInstitution || user?.name) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', padding: '8px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
            <Building2 size={16} color="#4c1d95" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Institution:</span>
            {isSuperAdmin && institutions.length > 1 ? (
              <select
                value={activeOrgId}
                onChange={(e) => setSelectedOrgId(e.target.value)}
                style={{ border: 'none', background: 'transparent', fontWeight: 700, color: '#0f172a', fontSize: '13px', cursor: 'pointer', outline: 'none' }}
              >
                {institutions.map(inst => (
                  <option key={inst.id} value={inst.id}>{inst.name} ({inst.district || inst.type})</option>
                ))}
              </select>
            ) : (
              <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '13px' }}>
                {currentInstitution ? `${currentInstitution.name}${currentInstitution.district ? ` (${currentInstitution.district})` : ''}` : (user?.name || 'My Institution')}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => setFilterTab('all')}
          style={{
            padding: '8px 16px',
            borderRadius: '24px',
            border: '1px solid',
            borderColor: filterTab === 'all' ? '#4c1d95' : '#cbd5e1',
            background: filterTab === 'all' ? '#f5f3ff' : '#fff',
            color: filterTab === 'all' ? '#4c1d95' : '#475569',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer'
          }}
        >
          All Challenges ({challenges.length})
        </button>

        <button
          type="button"
          onClick={() => setFilterTab('verified')}
          style={{
            padding: '8px 16px',
            borderRadius: '24px',
            border: '1px solid',
            borderColor: filterTab === 'verified' ? '#10b981' : '#cbd5e1',
            background: filterTab === 'verified' ? '#ecfdf5' : '#fff',
            color: filterTab === 'verified' ? '#047857' : '#475569',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <CheckCircle size={14} /> Verified & Assigned to Us ({myVerifiedChallenges.length})
        </button>

        <button
          type="button"
          onClick={() => setFilterTab('pending')}
          style={{
            padding: '8px 16px',
            borderRadius: '24px',
            border: '1px solid',
            borderColor: filterTab === 'pending' ? '#f59e0b' : '#cbd5e1',
            background: filterTab === 'pending' ? '#fef3c7' : '#fff',
            color: filterTab === 'pending' ? '#b45309' : '#475569',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Clock size={14} /> Pending Claims ({myPendingClaims.length})
        </button>

        <button
          type="button"
          onClick={() => setFilterTab('available')}
          style={{
            padding: '8px 16px',
            borderRadius: '24px',
            border: '1px solid',
            borderColor: filterTab === 'available' ? '#2563eb' : '#cbd5e1',
            background: filterTab === 'available' ? '#eff6ff' : '#fff',
            color: filterTab === 'available' ? '#1d4ed8' : '#475569',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer'
          }}
        >
          Available to Claim ({availableChallenges.length})
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading challenges...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {challenges.length === 0 && filterTab !== 'proposals' && (
            <div style={{ textAlign: 'center', padding: '40px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#64748b' }}>
              No challenges currently assigned to your institution.
            </div>
          )}

          {filterTab === 'proposals' && (
            myProposals.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#64748b' }}>
                <FileText size={40} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
                <h4 style={{ margin: '0 0 6px', color: '#334155', fontSize: '16px' }}>No Bids Submitted</h4>
                <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>You haven't submitted any proposals yet.</p>
              </div>
            ) : (
              myProposals.map(p => (
                <div key={p.id} style={{ background: p.status === 'approved' ? '#f0fdf4' : p.status === 'rejected' ? '#fef2f2' : '#fff', border: `1px solid ${p.status === 'approved' ? '#bbf7d0' : p.status === 'rejected' ? '#fecaca' : '#e2e8f0'}`, borderRadius: '12px', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', background: p.status === 'approved' ? '#dcfce7' : p.status === 'rejected' ? '#fee2e2' : '#fef3c7', color: p.status === 'approved' ? '#166534' : p.status === 'rejected' ? '#991b1b' : '#92400e', padding: '4px 10px', borderRadius: '6px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        {p.status === 'approved' ? <CheckCircle size={13} /> : p.status === 'rejected' ? <AlertCircle size={13} /> : <Clock size={13} />} 
                        {p.status.toUpperCase()}
                      </span>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>Submitted: {new Date(p.created_at).toLocaleDateString()}</span>
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>{p.challenges?.title || 'Unknown Challenge'}</h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '12px 24px', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '16px' }}>
                      <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 600 }}>Budget:</div>
                      <div style={{ color: '#0f172a', fontSize: '14px', fontWeight: 500 }}>{p.budget_estimate}</div>
                      
                      <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 600 }}>Timeline:</div>
                      <div style={{ color: '#0f172a', fontSize: '14px', fontWeight: 500 }}>{p.timeline_estimate}</div>
                      
                      <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 600 }}>Solution:</div>
                      <div style={{ color: '#334155', fontSize: '14px', whiteSpace: 'pre-wrap' }}>{p.proposal_text}</div>
                    </div>
                  </div>
                </div>
              ))
            )
          )}

          {filterTab !== 'proposals' && displayedChallenges.map(c => {
            const isMineChallenge = isMine(c);
            const isPendingClaimByMe = isMineChallenge && c.status === 'under_review';
            const isVerifiedAndOccupiedByMe = isMineChallenge && ['in_progress', 'team_formed', 'under_action', 'completed', 'resolved'].includes(c.status);
            const isOccupiedByOther = Boolean(c.assigned_institution_id && !isMineChallenge && ['in_progress', 'team_formed', 'under_action', 'completed', 'resolved'].includes(c.status));
            const isUnderAction = ['under_action', 'in_progress', 'team_formed'].includes(c.status);

            const occupiedInstName = (isVerifiedAndOccupiedByMe || isOccupiedByOther) 
              ? (c.institutions?.name || (institutions.find(i => i.id === c.assigned_institution_id)?.name)) 
              : null;

            return (
              <div 
                key={c.id} 
                style={{ 
                  background: isVerifiedAndOccupiedByMe ? '#f0fdf4' : isPendingClaimByMe ? '#fffbeb' : '#fff', 
                  border: isVerifiedAndOccupiedByMe ? '2px solid #86efac' : isPendingClaimByMe ? '2px solid #fde68a' : '1px solid #e2e8f0', 
                  borderRadius: '12px', 
                  padding: '24px', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  gap: '20px',
                  boxShadow: isVerifiedAndOccupiedByMe ? '0 2px 6px rgba(16, 185, 129, 0.08)' : '0 1px 3px rgba(0,0,0,0.02)'
                }}
              >
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>{c.title}</h3>
                  <p style={{ fontSize: '15px', color: '#475569', margin: '0 0 12px', maxWidth: '750px' }}>{c.description}</p>
                  
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} /> {new Date(c.created_at).toLocaleDateString()}
                    </span>

                    {c.district && (
                      <span style={{ fontSize: '11px', background: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                        {c.district}
                      </span>
                    )}
                    {c.location_text && (
                      <a 
                        href={c.location_text.startsWith('http') ? c.location_text : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.location_text)}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', background: '#eff6ff', color: '#2563eb', padding: '2px 6px', borderRadius: '4px', fontWeight: 600, textDecoration: 'none' }}
                      >
                        <MapPin size={10} style={{ marginRight: 2 }} />
                        Map Link
                      </a>
                    )}

                    {c.category && (
                      <span style={{ fontSize: '12px', background: '#f8fafc', color: '#475569', padding: '4px 8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                        {c.category}
                      </span>
                    )}

                    {/* Status Badge */}
                    {c.status === 'under_review' ? (
                      <span style={{ fontSize: '12px', background: '#fef3c7', color: '#b45309', padding: '4px 8px', borderRadius: '4px', border: '1px solid #fde68a', fontWeight: 600 }}>
                        CLAIM PENDING ADMIN VERIFICATION
                      </span>
                    ) : (
                      <span style={{ 
                        fontSize: '12px', 
                        background: isUnderAction ? '#fefce8' : '#eef2ff', 
                        color: isUnderAction ? '#a16207' : '#4f46e5', 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        border: `1px solid ${isUnderAction ? '#fef08a' : '#c7d2fe'}`,
                        fontWeight: 600 
                      }}>
                        {c.status.replace('_', ' ').toUpperCase()}
                      </span>
                    )}

                    {/* Pending Claim or Occupied Institution Badge */}
                    {isPendingClaimByMe ? (
                      <span style={{ 
                        fontSize: '12px', 
                        background: '#fef3c7', 
                        color: '#92400e', 
                        padding: '4px 10px', 
                        borderRadius: '6px', 
                        border: '1px solid #fde68a',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}>
                        <Clock size={13} /> Claim Requested by Your Institution
                      </span>
                    ) : occupiedInstName ? (
                      <span style={{ 
                        fontSize: '12px', 
                        background: isVerifiedAndOccupiedByMe ? '#dcfce7' : '#f0fdf4', 
                        color: isVerifiedAndOccupiedByMe ? '#15803d' : '#166534', 
                        padding: '4px 10px', 
                        borderRadius: '6px', 
                        border: `1px solid ${isVerifiedAndOccupiedByMe ? '#86efac' : '#bbf7d0'}`,
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}>
                        <Building2 size={13} /> {isVerifiedAndOccupiedByMe ? `✓ Verified & Assigned to: ${occupiedInstName}` : `Occupied by: ${occupiedInstName}`}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div>
                  {isVerifiedAndOccupiedByMe ? (
                    <button 
                      disabled
                      style={{
                        background: '#10b981',
                        color: '#fff',
                        border: 'none',
                        padding: '10px 18px',
                        borderRadius: '8px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'default',
                        boxShadow: '0 1px 2px rgba(16, 185, 129, 0.2)'
                      }}
                    >
                      <CheckCircle size={18} /> Verified & Occupied by You
                    </button>
                  ) : isPendingClaimByMe ? (
                    <button 
                      disabled
                      style={{
                        background: '#fef3c7',
                        color: '#b45309',
                        border: '1px solid #fde68a',
                        padding: '10px 18px',
                        borderRadius: '8px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'default'
                      }}
                    >
                      <Clock size={16} /> Pending Verification
                    </button>
                  ) : isOccupiedByOther ? (
                    <button 
                      disabled
                      style={{
                        background: '#94a3b8',
                        color: '#fff',
                        border: 'none',
                        padding: '10px 18px',
                        borderRadius: '8px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'not-allowed'
                      }}
                    >
                      <Building2 size={16} /> {c.status === 'under_review' ? 'Claim Pending Other Inst' : 'Occupied by Other'}
                    </button>
                  ) : myProposals.some(p => p.challenge_id === c.id) ? (
                    <button 
                      disabled
                      style={{
                        background: '#f8fafc',
                        color: '#334155',
                        border: '1px solid #cbd5e1',
                        padding: '10px 18px',
                        borderRadius: '8px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'default'
                      }}
                    >
                      <FileText size={16} /> Proposal Submitted
                    </button>
                  ) : c.status !== 'routed' ? (
                    <button 
                      disabled
                      style={{
                        background: '#f1f5f9',
                        color: '#94a3b8',
                        border: '1px solid #e2e8f0',
                        padding: '10px 18px',
                        borderRadius: '8px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'not-allowed'
                      }}
                    >
                      <Building2 size={16} /> Submit Proposal
                    </button>
                  ) : (
                    <button 
                      onClick={() => {
                        setSelectedChallengeForProposal(c);
                        setProposalModalOpen(true);
                      }}
                      style={{
                        background: '#2563eb',
                        color: '#fff',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
                      }}
                    >
                      <Building2 size={16} /> Submit Proposal
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PROPOSAL SUBMISSION MODAL */}
      {proposalModalOpen && selectedChallengeForProposal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px'
        }}>
          <div style={{
            background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '600px',
            maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>Submit Tender Proposal</h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>For: <strong style={{ color: '#0f172a' }}>{selectedChallengeForProposal.title}</strong></p>
              </div>
              <button 
                onClick={() => setProposalModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '24px', color: '#94a3b8', cursor: 'pointer', lineHeight: 1 }}
              >&times;</button>
            </div>
            
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                  Proposed Solution & Strategy <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea 
                  value={proposalForm.proposal_text}
                  onChange={e => setProposalForm({ ...proposalForm, proposal_text: e.target.value })}
                  placeholder="Describe how your institution plans to solve this civic problem..."
                  style={{ width: '100%', minHeight: '120px', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                    Estimated Budget <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input 
                    type="text" 
                    value={proposalForm.budget_estimate}
                    onChange={e => setProposalForm({ ...proposalForm, budget_estimate: e.target.value })}
                    placeholder="e.g. ₹50,000 or Nil"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                    Estimated Timeline <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input 
                    type="text" 
                    value={proposalForm.timeline_estimate}
                    onChange={e => setProposalForm({ ...proposalForm, timeline_estimate: e.target.value })}
                    placeholder="e.g. 3 Months"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                  Contact Phone <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input 
                  type="tel" 
                  value={proposalForm.contact_phone}
                  onChange={e => setProposalForm({ ...proposalForm, contact_phone: e.target.value })}
                  placeholder="Your verified mobile number"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px' }}
                />
              </div>
            </div>

            <div style={{ padding: '20px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', borderRadius: '0 0 16px 16px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                onClick={() => setProposalModalOpen(false)}
                style={{ padding: '10px 20px', background: '#fff', border: '1px solid #cbd5e1', color: '#475569', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
              >Cancel</button>
              <button 
                onClick={handleSubmitProposal}
                disabled={loading || !proposalForm.proposal_text.trim() || !proposalForm.budget_estimate.trim() || !proposalForm.timeline_estimate.trim() || !(proposalForm.contact_phone || user?.contact)}
                style={{ padding: '10px 24px', background: '#2563eb', border: 'none', color: '#fff', borderRadius: '8px', fontWeight: 600, cursor: loading || !proposalForm.proposal_text.trim() || !proposalForm.budget_estimate.trim() || !proposalForm.timeline_estimate.trim() || !(proposalForm.contact_phone || user?.contact) ? 'not-allowed' : 'pointer', opacity: loading || !proposalForm.proposal_text.trim() || !proposalForm.budget_estimate.trim() || !proposalForm.timeline_estimate.trim() || !(proposalForm.contact_phone || user?.contact) ? 0.7 : 1 }}
              >
                {loading ? 'Submitting...' : 'Submit Proposal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
