import React, { useEffect, useState } from 'react';
import { dashboardsApi, DashboardChallenge } from '../api/dashboards';
import { BookOpen, MapPin, Clock, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const StudentDashboard: React.FC<{ activeView: string }> = ({ activeView }) => {
  const { user } = useAuth();
  const [myChallenges, setMyChallenges] = useState<DashboardChallenge[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMyChallenges = async () => {
      setLoading(true);
      try {
        const data = await dashboardsApi.getTopProblems({ limit: 50 });
        setMyChallenges(data.filter(c => c.user_id === user?.id || (c as any).submitted_by === user?.id));
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };

    if (user?.id && (activeView === 'dashboard' || activeView === 'opportunities')) {
      fetchMyChallenges();
    }
  }, [user, activeView]);

  if (activeView === 'opportunities') {
    return (
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Opportunities</h2>
        <p style={{ color: '#64748b', marginBottom: '32px' }}>Join open-source civic projects.</p>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
          <p style={{ fontSize: '14px', color: '#475569', margin: '0 0 16px', lineHeight: 1.5 }}>
            Contribute to ongoing initiatives and earn credits for your academic curriculum.
          </p>
          <button style={{ width: '100%', padding: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#0f172a', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            Browse Projects <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  if (activeView === 'credits' || activeView === 'settings') {
    return (
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>{activeView === 'credits' ? 'Academic Credits' : 'Settings'}</h2>
        <p style={{ color: '#64748b' }}>{activeView === 'credits' ? 'Track your contributions and credits.' : 'Configure your account.'}</p>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '32px', marginTop: '24px' }}>
          <p style={{ color: '#64748b' }}>Interface coming soon.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>My Submissions</h2>
        <p style={{ fontSize: '15px', color: '#64748b', margin: 0 }}>View the status of your reported problems.</p>
      </div>
      {loading ? (
        <div style={{ padding: '20px', color: '#64748b' }}>Loading...</div>
      ) : myChallenges.length === 0 ? (
        <div style={{ padding: '32px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#64748b', textAlign: 'center' }}>
          You haven't submitted any problems yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {myChallenges.map(c => (
            <div key={c.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px' }}>{c.title}</h4>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={12} /> {c.district}
                </span>
                <span style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} /> {new Date(c.created_at).toLocaleDateString()}
                </span>
              </div>
              <div style={{ display: 'inline-block', fontSize: '12px', background: '#eff6ff', color: '#2563eb', padding: '4px 8px', borderRadius: '4px', fontWeight: 600 }}>
                Status: {c.status.replace('_', ' ').toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
