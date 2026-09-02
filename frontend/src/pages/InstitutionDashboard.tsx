import React, { useEffect, useState } from 'react';
import { dashboardsApi, DashboardChallenge } from '../api/dashboards';
import { Building2, CheckCircle, Clock } from 'lucide-react';

export const InstitutionDashboard: React.FC<{ activeView: string }> = ({ activeView }) => {
  const [challenges, setChallenges] = useState<DashboardChallenge[]>([]);
  const [loading, setLoading] = useState(false);

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
    if (activeView === 'challenges' || activeView === 'dashboard') {
      fetchChallenges();
    }
  }, [activeView]);

  const handleClaim = async (id: string) => {
    try {
      await dashboardsApi.claimChallenge(id);
      fetchChallenges();
    } catch (e) {
      alert('Failed to claim challenge');
    }
  };

  if (activeView === 'dashboard') {
    return (
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Overview</h2>
        <p style={{ color: '#64748b', marginBottom: '32px' }}>Welcome to the Institution portal.</p>
        <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 8px' }}>Quick Stats</h3>
          <p style={{ margin: 0, color: '#64748b' }}>Total Assigned Challenges: {challenges.length}</p>
        </div>
      </div>
    );
  }

  if (activeView === 'profile' || activeView === 'settings') {
    return (
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>{activeView === 'profile' ? 'Organization Profile' : 'Settings'}</h2>
        <p style={{ color: '#64748b' }}>Configure your organizational details.</p>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '32px', marginTop: '24px' }}>
          <p style={{ color: '#64748b' }}>Interface coming soon.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>Assigned Challenges</h2>
        <p style={{ fontSize: '15px', color: '#64748b', margin: 0 }}>Review and claim challenges routed to your institution.</p>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {challenges.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#64748b' }}>
              No challenges currently assigned to your institution.
            </div>
          )}
          {challenges.map(c => (
            <div key={c.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>{c.title}</h3>
                <p style={{ fontSize: '15px', color: '#475569', margin: '0 0 12px', maxWidth: '700px' }}>{c.description}</p>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <span style={{ fontSize: '12px', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} /> {new Date(c.created_at).toLocaleDateString()}
                  </span>
                  <span style={{ fontSize: '12px', background: '#eff6ff', color: '#2563eb', padding: '4px 8px', borderRadius: '4px' }}>
                    {c.district}
                  </span>
                  <span style={{ fontSize: '12px', background: '#fffbeb', color: '#d97706', padding: '4px 8px', borderRadius: '4px', border: '1px solid #fde68a' }}>
                    {c.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => handleClaim(c.id)}
                disabled={c.status === 'under_action'}
                style={{
                  background: c.status === 'under_action' ? '#94a3b8' : '#2563eb',
                  color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: c.status === 'under_action' ? 'not-allowed' : 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px'
                }}
              >
                {c.status === 'under_action' ? <><CheckCircle size={18} /> Claimed</> : 'Claim Action'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
