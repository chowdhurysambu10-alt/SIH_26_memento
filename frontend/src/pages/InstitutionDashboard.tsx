import React, { useEffect, useState } from 'react';
import { dashboardsApi, DashboardChallenge } from '../api/dashboards';
import { adminApi } from '../api/admin';
import { useAuth } from '../context/AuthContext';
import { Building2, CheckCircle, Clock, FileText, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

interface InstitutionDashboardProps {
  activeView: string;
  setActiveView?: (view: string) => void;
}

export const InstitutionDashboard: React.FC<InstitutionDashboardProps> = ({ activeView, setActiveView }) => {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<DashboardChallenge[]>([]);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [filterTab, setFilterTab] = useState<'all' | 'verified' | 'pending' | 'available'>('all');

  const fetchInstitutions = async () => {
    try {
      const data = await adminApi.getInstitutions();
      setInstitutions(data);
      if (user?.org_id) {
        setSelectedOrgId(user.org_id);
      } else if (data.length > 0 && !selectedOrgId) {
        setSelectedOrgId(data[0].id);
      }
    } catch (e) {
      console.error('Failed to fetch institutions:', e);
    }
  };

  const fetchChallenges = async () => {
    setLoading(true);
    try {
      const data = await dashboardsApi.getClaimableChallenges();
      setChallenges(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInstitutions();
  }, []);

  useEffect(() => {
    if (activeView === 'challenges' || activeView === 'dashboard') {
      fetchChallenges();
    }
  }, [activeView]);

  const activeOrgId = user?.org_id || selectedOrgId;
  const currentInstitution = institutions.find(i => i.id === activeOrgId);

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
    !c.assigned_institution_id && (c.status === 'submitted' || !c.status)
  );

  const displayedChallenges = challenges.filter(c => {
    if (filterTab === 'verified') {
      return isMine(c) && ['in_progress', 'team_formed', 'under_action', 'completed', 'resolved'].includes(c.status);
    }
    if (filterTab === 'pending') {
      return isMine(c) && c.status === 'under_review';
    }
    if (filterTab === 'available') {
      return !c.assigned_institution_id && (c.status === 'submitted' || !c.status);
    }
    return true;
  });

  const handleClaim = async (id: string) => {
    try {
      await dashboardsApi.claimChallenge(id, activeOrgId);
      await fetchChallenges();
      alert(`Claim request submitted for ${currentInstitution?.name || user?.name || 'your institution'}! Waiting for Admin verification.`);
    } catch (e: any) {
      alert('Failed to claim challenge: ' + (e.message || 'Error occurred'));
    }
  };

  // 1. OVERVIEW VIEW
  if (activeView === 'dashboard') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {/* Header with Institution Selector */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
              Institution Portal Overview
            </h2>
            <p style={{ color: '#64748b', margin: 0, fontSize: '15px' }}>
              Logged in as <strong style={{ color: '#0f172a' }}>{currentInstitution?.name || user?.name || 'Authorized Institution'}</strong>
            </p>
          </div>

          {/* Institution Switcher (for testing or multi-campus admins) */}
          {institutions.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', padding: '8px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
              <Building2 size={16} color="#4c1d95" />
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Institution:</span>
              <select
                value={activeOrgId}
                onChange={(e) => setSelectedOrgId(e.target.value)}
                style={{ border: 'none', background: 'transparent', fontWeight: 700, color: '#0f172a', fontSize: '13px', cursor: 'pointer', outline: 'none' }}
              >
                {institutions.map(inst => (
                  <option key={inst.id} value={inst.id}>{inst.name} ({inst.district || inst.type})</option>
                ))}
              </select>
            </div>
          )}
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

          {/* 2. Pending Verification */}
          <div 
            onClick={() => { setFilterTab('pending'); setActiveView?.('challenges'); }}
            style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '14px', padding: '20px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pending Claims</span>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={20} color="#d97706" />
              </div>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#b45309' }}>{myPendingClaims.length}</div>
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
                          📍 {c.district}
                        </span>
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

  // 2. PROFILE OR SETTINGS
  if (activeView === 'profile' || activeView === 'settings') {
    return (
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
          {activeView === 'profile' ? 'Organization Profile' : 'Settings'}
        </h2>
        <p style={{ color: '#64748b' }}>Configure your organizational details.</p>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '32px', marginTop: '24px' }}>
          <p style={{ color: '#64748b' }}>
            Registered Institution: <strong>{currentInstitution?.name || user?.name || 'Institution'}</strong>
          </p>
          <p style={{ color: '#64748b' }}>
            District: <strong>{currentInstitution?.district || 'West Bengal'}</strong>
          </p>
        </div>
      </div>
    );
  }

  // 3. CHALLENGES VIEW (Assigned & Claimable Challenges)
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
        
        {/* Active Institution Selector */}
        {institutions.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', padding: '8px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
            <Building2 size={16} color="#4c1d95" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Institution:</span>
            <select
              value={activeOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              style={{ border: 'none', background: 'transparent', fontWeight: 700, color: '#0f172a', fontSize: '13px', cursor: 'pointer', outline: 'none' }}
            >
              {institutions.map(inst => (
                <option key={inst.id} value={inst.id}>{inst.name} ({inst.district || inst.type})</option>
              ))}
            </select>
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
          {displayedChallenges.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#64748b' }}>
              <p style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 600, color: '#334155' }}>
                No challenges found in this filter.
              </p>
              <button
                onClick={() => setFilterTab('all')}
                style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}
              >
                View all challenges →
              </button>
            </div>
          )}

          {displayedChallenges.map(c => {
            const isMineChallenge = isMine(c);
            const isPendingClaimByMe = isMineChallenge && c.status === 'under_review';
            const isVerifiedAndOccupiedByMe = isMineChallenge && ['in_progress', 'team_formed', 'under_action', 'completed', 'resolved'].includes(c.status);
            const isOccupiedByOther = Boolean(c.assigned_institution_id && !isMineChallenge);
            const isUnderAction = ['under_action', 'in_progress', 'team_formed'].includes(c.status);

            const occupiedInstName = c.institutions?.name || (institutions.find(i => i.id === c.assigned_institution_id)?.name);

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
                      <span style={{ fontSize: '12px', background: '#eff6ff', color: '#2563eb', padding: '4px 8px', borderRadius: '4px', fontWeight: 500 }}>
                        📍 {c.district}
                      </span>
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
                  ) : (
                    <button 
                      onClick={() => handleClaim(c.id)}
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
                      <Building2 size={16} /> Claim Problem
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
