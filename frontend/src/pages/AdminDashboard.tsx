import React, { useEffect, useState, useCallback } from 'react';
import { adminApi } from '../api/admin';
import { dashboardsApi, DashboardChallenge } from '../api/dashboards';
import { AiAnalysisDashboard } from './AiAnalysisDashboard';
import { StatisticsPage } from './StatisticsPage';
import { TenderReviewDashboard } from './TenderReviewDashboard';
import { useUI } from '../context/UIContext';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { Users, FileText, Trash2, Edit2, ShieldAlert, X, ShieldCheck, Megaphone, Clock, ChevronRight, Activity, Bell, CheckCircle, Building2, Mail } from 'lucide-react';

export const AdminDashboard: React.FC<{ activeView: string, setActiveView?: (view: string) => void, searchQuery?: string }> = ({ activeView, setActiveView, searchQuery = '' }) => {
  const { showAlert, showConfirm, setGlobalLoading } = useUI();
  const [users, setUsers] = useState<any[]>([]);
  const [posts, setPosts] = useState<DashboardChallenge[]>([]);
  const [verificationRequests, setVerificationRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [editingPost, setEditingPost] = useState<DashboardChallenge | null>(null);
  
  // Broadcast State
  const [broadcastRole, setBroadcastRole] = useState('all');
  const [broadcastMethod, setBroadcastMethod] = useState<'in-site' | 'email'>('in-site');
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [editAssignedInstitutionId, setEditAssignedInstitutionId] = useState<string>('');

  // Settings State
  const [platformSettings, setPlatformSettings] = useState<any>({
    maintenanceMode: false,
    aiAutoTriage: true,
    allowPublicComments: true,
    dataRetentionDays: 365,
    enforceGeolocation: false,
    maxAttachmentSizeMB: 10,
    enableCommunityChat: true,
    systemBannerText: '',
  });
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchUsers = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await adminApi.getAllUsers();
      setUsers(data);
    } catch (e) {
      console.error(e);
    }
    if (!silent) setLoading(false);
  };

  const fetchInstitutions = async () => {
    try {
      const data = await adminApi.getInstitutions();
      setInstitutions(data);
    } catch (e) {
      console.error('Failed to fetch institutions:', e);
    }
  };

  const fetchPosts = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await adminApi.getAllChallenges();
      setPosts(data);
    } catch (e) {
      console.error(e);
    }
    if (!silent) setLoading(false);
  };

  const fetchVerificationRequests = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await adminApi.getVerificationRequests();
      setVerificationRequests(data);
    } catch (e) {
      console.error(e);
    }
    if (!silent) setLoading(false);
  };

  useEffect(() => {
    if (activeView === 'users' || activeView === 'dashboard') fetchUsers();
    if (activeView === 'posts' || activeView === 'dashboard') fetchPosts();
    if (activeView === 'verification') fetchVerificationRequests();
    if (activeView === 'settings') fetchSettings();
  }, [activeView]);

  // Auto-refresh: re-fetch the relevant data every 15 s — silent so no loading blink
  const refreshCurrentView = useCallback(async () => {
    if (activeView === 'users' || activeView === 'dashboard') fetchUsers(true);
    if (activeView === 'posts' || activeView === 'dashboard') { fetchPosts(true); fetchInstitutions(); }
    if (activeView === 'verification') fetchVerificationRequests(true);
  }, [activeView]);

  useAutoRefresh(refreshCurrentView, 15000);

  const fetchSettings = async () => {
    try {
      const data = await adminApi.getSettings();
      setPlatformSettings(data);
    } catch (e) {
      console.error('Failed to fetch settings:', e);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setGlobalLoading(true);
    try {
      await adminApi.updateSettings(platformSettings);
      showAlert('Settings saved successfully!', 'success');
    } catch (e: any) {
      showAlert('Failed to save settings: ' + e.message, 'error');
    }
    setSavingSettings(false);
    setGlobalLoading(false);
  };

  const handleDeleteUser = async (id: string) => {
    if (!(await showConfirm('Are you sure you want to delete this user?'))) return;
    setGlobalLoading(true);
    try {
      await adminApi.deleteUser(id);
      fetchUsers();
    } catch (e) {
      showAlert('Failed to delete user', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleUpdateRole = async (id: string, newRole: string) => {
    try {
      setGlobalLoading(true);
      await adminApi.updateUserRole(id, newRole);
      fetchUsers();
    } catch (e) {
      showAlert('Failed to update role', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!(await showConfirm('Are you sure you want to delete this post?'))) return;
    try {
      setGlobalLoading(true);
      await adminApi.deleteChallenge(id);
      fetchPosts();
    } catch (e) {
      showAlert('Failed to delete post', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleVerifyUser = async (id: string, isFromRequestsView = false, status: boolean = true) => {
    try {
      setGlobalLoading(true);
      await adminApi.verifyUser(id, status);
      if (isFromRequestsView) {
        fetchVerificationRequests();
      } else {
        fetchUsers();
      }
    } catch (e) {
      showAlert(`Failed to ${status ? 'verify' : 'unverify'} user`, 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setBroadcasting(true);
    setGlobalLoading(true);
    try {
      await adminApi.broadcastNotification({
        role: broadcastRole,
        type: 'ADMIN_NOTICE',
        method: broadcastMethod,
        payload: {
          title: broadcastTitle,
          message: broadcastMessage
        }
      });
      showAlert('Broadcast sent successfully!', 'success');
      setBroadcastTitle('');
      setBroadcastMessage('');
    } catch (err: any) {
      showAlert('Failed to send broadcast: ' + err.message, 'error');
    }
    setBroadcasting(false);
    setGlobalLoading(false);
  };

  const handleUpdatePostStatus = async (id: string, status: string) => {
    try {
      setGlobalLoading(true);
      await adminApi.updateChallengeStatus(id, status);
      fetchPosts();
    } catch (e) {
      showAlert('Failed to update status', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleAllocateInstitution = async (challengeId: string, institutionId: string | null) => {
    try {
      setGlobalLoading(true);
      await adminApi.allocateInstitution(challengeId, institutionId);
      await fetchPosts();
      if (institutionId) {
        const inst = institutions.find(i => i.id === institutionId);
        showAlert(`Problem allocated to ${inst?.name || 'Institution'} successfully!`, 'success');
      } else {
        showAlert('Institution allocation cleared.', 'info');
      }
    } catch (e: any) {
      showAlert('Failed to allocate institution: ' + (e.message || e), 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleVerifyAndAssign = async (challengeId: string, institutionId?: string | null) => {
    try {
      setGlobalLoading(true);
      await adminApi.updateChallengeStatus(challengeId, 'in_progress', 'Claim verified and officially assigned by Admin');
      if (institutionId) {
        await adminApi.allocateInstitution(challengeId, institutionId);
      }
      await fetchPosts();
      const inst = institutions.find(i => i.id === institutionId);
      showAlert(`Claim verified! Problem officially assigned to ${inst?.name || 'the institution'} and moved to In Progress.`, 'success');
    } catch (e: any) {
      showAlert('Failed to verify claim: ' + (e.message || e), 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleEditPost = (post: DashboardChallenge) => {
    setEditingPost(post);
    setEditTitle(post.title);
    setEditDesc(post.description);
  };

  const handleSavePostEdit = async () => {
    if (!editingPost) return;
    try {
      setGlobalLoading(true);
      await adminApi.updateChallengeDetails(
        editingPost.id, 
        editTitle, 
        editDesc, 
        editAssignedInstitutionId || null
      );
      setEditingPost(null);
      fetchPosts();
    } catch (e) {
      showAlert('Failed to save edit', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  const safeSearch = searchQuery.toLowerCase().trim();
  const filteredUsers = safeSearch ? users.filter(u => u.name?.toLowerCase().includes(safeSearch) || u.email?.toLowerCase().includes(safeSearch) || u.role?.toLowerCase().includes(safeSearch)) : users;
  const filteredPosts = safeSearch ? posts.filter(p => p.title?.toLowerCase().includes(safeSearch) || p.description?.toLowerCase().includes(safeSearch)) : posts;
  const filteredVerificationRequests = safeSearch ? verificationRequests.filter(r => r.name?.toLowerCase().includes(safeSearch) || r.email?.toLowerCase().includes(safeSearch)) : verificationRequests;

  const totalUsers = filteredUsers.length;
  const totalPosts = filteredPosts.length;
  const pendingVerifications = filteredVerificationRequests.length;
  const pendingPosts = filteredPosts.filter(p => p.status === 'under_review').length;

  const recentUsers = [...filteredUsers].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()).slice(0, 5);
  const recentPosts = [...posts].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()).slice(0, 5);

  if (activeView === 'dashboard') {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px', letterSpacing: '-0.5px' }}>Dashboard Overview</h2>
            <p style={{ color: '#64748b', margin: 0, fontSize: '15px' }}>System health, metrics, and recent activity at a glance.</p>
          </div>
          {setActiveView && (
            <button 
              onClick={() => setActiveView('notice-panel')}
              style={{ padding: '10px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)' }}
            >
              <Megaphone size={16} /> Broadcast Notice
            </button>
          )}
        </div>
        
        {/* Metric Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(37,99,235,0.05) 0%, rgba(255,255,255,0) 70%)', transform: 'translate(30%, -30%)' }}></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={28} />
              </div>
              <div>
                <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Total Users</div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{totalUsers}</div>
              </div>
            </div>
            
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Citizens: <span style={{ fontWeight: 700, color: '#0f172a' }}>{filteredUsers.filter(u => u.role === 'citizen' || !u.role).length}</span></div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Students: <span style={{ fontWeight: 700, color: '#0f172a' }}>{filteredUsers.filter(u => u.role === 'student').length}</span></div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Institutions: <span style={{ fontWeight: 700, color: '#0f172a' }}>{filteredUsers.filter(u => u.role === 'university_admin').length}</span></div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Admins: <span style={{ fontWeight: 700, color: '#0f172a' }}>{filteredUsers.filter(u => u.role === 'super_admin').length}</span></div>
            </div>
          </div>
          
          <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(16,185,129,0.05) 0%, rgba(255,255,255,0) 70%)', transform: 'translate(30%, -30%)' }}></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={28} />
              </div>
              <div>
                <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Total Posts</div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{totalPosts}</div>
              </div>
            </div>
          </div>

          <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(245,158,11,0.05) 0%, rgba(255,255,255,0) 70%)', transform: 'translate(30%, -30%)' }}></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: '#fffbeb', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={28} />
              </div>
              <div>
                <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Pending Verifications</div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{pendingVerifications}</div>
              </div>
            </div>
          </div>

          <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(139,92,246,0.05) 0%, rgba(255,255,255,0) 70%)', transform: 'translate(30%, -30%)' }}></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: '#f5f3ff', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={28} />
              </div>
              <div>
                <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Posts Under Review</div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{pendingPosts}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions & Recent Activity Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
          
          {/* Left Column: Quick Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} color="#64748b" /> Quick Actions
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button onClick={() => setActiveView && setActiveView('verification')} style={{ width: '100%', padding: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all 0.2s', color: '#0f172a', fontWeight: 600 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ShieldCheck size={16} color="#f59e0b" /></div>
                    Verify Users
                  </div>
                  <ChevronRight size={16} color="#94a3b8" />
                </button>
                <button onClick={() => setActiveView && setActiveView('posts')} style={{ width: '100%', padding: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all 0.2s', color: '#0f172a', fontWeight: 600 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileText size={16} color="#10b981" /></div>
                    Manage Content
                  </div>
                  <ChevronRight size={16} color="#94a3b8" />
                </button>
                <button onClick={() => setActiveView && setActiveView('ai-analysis')} style={{ width: '100%', padding: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all 0.2s', color: '#0f172a', fontWeight: 600 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ShieldAlert size={16} color="#ef4444" /></div>
                    View AI Flags
                  </div>
                  <ChevronRight size={16} color="#94a3b8" />
                </button>
                <button onClick={() => setActiveView && setActiveView('tenders')} style={{ width: '100%', padding: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all 0.2s', color: '#0f172a', fontWeight: 600 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Building2 size={16} color="#2563eb" /></div>
                    Review Tenders (Bids)
                  </div>
                  <ChevronRight size={16} color="#94a3b8" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Recent Activity */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Recent Registrations</h3>
                <button onClick={() => setActiveView && setActiveView('users')} style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>View All</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {recentUsers.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>No recent users.</div>
                ) : (
                  recentUsers.map((u, i) => (
                    <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: i < recentUsers.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#e2e8f0', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '14px' }}>
                          {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{u.name || 'Unknown User'}</div>
                          <div style={{ fontSize: '13px', color: '#64748b' }}>{u.email}</div>
                        </div>
                      </div>
                      <span style={{ fontSize: '12px', padding: '4px 10px', background: '#f1f5f9', color: '#475569', borderRadius: '12px', fontWeight: 600 }}>
                        {u.role.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  }

  if (activeView === 'settings') {
    return (
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Platform Settings</h2>
        <p style={{ color: '#64748b' }}>Configure global platform behavior.</p>
        
        <form onSubmit={handleSaveSettings} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '32px', marginTop: '24px', maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>Maintenance Mode</h4>
              <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#64748b' }}>Temporarily disable new submissions across the platform.</p>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={platformSettings.maintenanceMode}
                onChange={e => setPlatformSettings({...platformSettings, maintenanceMode: e.target.checked})}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>AI Auto-Triage</h4>
              <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#64748b' }}>Use Google AI to automatically classify and escalate critical problems.</p>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={platformSettings.aiAutoTriage}
                onChange={e => setPlatformSettings({...platformSettings, aiAutoTriage: e.target.checked})}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>Allow Public Comments</h4>
              <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#64748b' }}>Allow citizens to comment on public issues.</p>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={platformSettings.allowPublicComments}
                onChange={e => setPlatformSettings({...platformSettings, allowPublicComments: e.target.checked})}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>Enforce Geolocation (Strict Mode)</h4>
              <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#64748b' }}>Reject problem submissions missing precise GPS coordinates.</p>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={platformSettings.enforceGeolocation}
                onChange={e => setPlatformSettings({...platformSettings, enforceGeolocation: e.target.checked})}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>Community Chat Enabled</h4>
              <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#64748b' }}>Show the Discord integration tab to all users.</p>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={platformSettings.enableCommunityChat}
                onChange={e => setPlatformSettings({...platformSettings, enableCommunityChat: e.target.checked})}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>Data Retention (Days)</h4>
              <input 
                type="number" 
                value={platformSettings.dataRetentionDays}
                onChange={e => setPlatformSettings({...platformSettings, dataRetentionDays: parseInt(e.target.value) || 0})}
                style={{ padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '15px', width: '100%' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>Max Attachment (MB)</h4>
              <input 
                type="number" 
                value={platformSettings.maxAttachmentSizeMB}
                onChange={e => setPlatformSettings({...platformSettings, maxAttachmentSizeMB: parseInt(e.target.value) || 10})}
                style={{ padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '15px', width: '100%' }}
              />
            </div>
          </div>

          <div>
            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>Global System Banner</h4>
            <p style={{ margin: '0 0 12px', fontSize: '14px', color: '#64748b' }}>Text to display as an alert at the top of the entire platform. Leave blank to hide.</p>
            <input 
              type="text" 
              placeholder="e.g. System scheduled for maintenance tonight at 12AM..."
              value={platformSettings.systemBannerText}
              onChange={e => setPlatformSettings({...platformSettings, systemBannerText: e.target.value})}
              style={{ padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '15px', width: '100%' }}
            />
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '8px 0' }} />

          <button 
            type="submit" 
            disabled={savingSettings}
            style={{ padding: '12px 24px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 600, cursor: savingSettings ? 'not-allowed' : 'pointer', alignSelf: 'flex-start', opacity: savingSettings ? 0.7 : 1 }}
          >
            {savingSettings ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      </div>
    );
  }

  if (activeView === 'ai-analysis') {
    return (
      <div style={{ marginTop: '-40px' }}>
        <AiAnalysisDashboard />
      </div>
    );
  }

  if (activeView === 'statistics') {
    return (
      <div style={{ marginTop: '-40px' }}>
        <StatisticsPage hideMyProblems={true} />
      </div>
    );
  }

  if (activeView === 'tenders') {
    return (
      <div style={{ marginTop: '-40px' }}>
        <TenderReviewDashboard />
      </div>
    );
  }

  if (activeView === 'verification') {
    return (
      <div>
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>
            Verification Requests
          </h2>
          <p style={{ fontSize: '15px', color: '#64748b', margin: 0 }}>
            Review and approve pending verification applications from students and institutions.
          </p>
        </div>
        
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading requests...</div>
        ) : filteredVerificationRequests.length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '60px 20px', textAlign: 'center' }}>
            <ShieldCheck size={48} color="#94a3b8" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ margin: '0 0 8px', color: '#475569', fontSize: '18px' }}>No Pending Requests</h3>
            <p style={{ color: '#94a3b8', margin: 0 }}>You're all caught up!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredVerificationRequests.map(req => (
              <div key={req.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>{req.name}</h3>
                    <span style={{ fontSize: '12px', padding: '4px 8px', background: '#eff6ff', color: '#2563eb', borderRadius: '12px', fontWeight: 600 }}>
                      {req.role.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', background: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Email Address</span>
                      <span style={{ fontSize: '14px', color: '#0f172a' }}>{req.email}</span>
                    </div>
                    {Object.entries(req.verification_data || {}).map(([key, value]) => {
                      if (key === 'type') return null; // skip the internal type discriminator
                      return (
                        <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <span style={{ fontSize: '14px', color: '#0f172a' }}>{value as React.ReactNode || '-'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '24px' }}>
                  <button 
                    onClick={() => handleVerifyUser(req.id, true)}
                    style={{ padding: '8px 24px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <ShieldCheck size={16} /> Approve
                  </button>
                  <button 
                    style={{ padding: '8px 24px', background: '#fff', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                    onClick={() => showAlert('Rejection flow coming soon', 'info')}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (activeView === 'notice-panel') {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', background: '#eff6ff', borderRadius: '50%', marginBottom: '16px' }}>
            <Megaphone size={32} color="#2563eb" />
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>
            Admin Notice Panel
          </h2>
          <p style={{ fontSize: '15px', color: '#64748b', margin: 0 }}>
            Broadcast real-time announcements directly to users' browsers.
          </p>
        </div>

        <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <form onSubmit={handleBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Target Audience</label>
              <select 
                value={broadcastRole}
                onChange={e => setBroadcastRole(e.target.value)}
                style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none', background: '#f8fafc' }}
              >
                <option value="all">All Users</option>
                <option value="citizen">Citizens Only</option>
                <option value="student">Students Only</option>
                <option value="university_admin">Institutions Only</option>
              </select>
              <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#64748b' }}>
                The notice will instantly appear in the notification bell for the selected group.
              </p>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Broadcast Method</label>
              <select 
                value={broadcastMethod}
                onChange={e => setBroadcastMethod(e.target.value as 'in-site' | 'email')}
                style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none', background: '#f8fafc' }}
              >
                <option value="in-site">In-Site Notification (Appears on bell icon)</option>
                <option value="email">Email Broadcast (Sends an email)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Subject Line</label>
              <input 
                required
                type="text" 
                value={broadcastTitle}
                onChange={e => setBroadcastTitle(e.target.value)}
                placeholder="e.g. Platform Maintenance Notice"
                style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Message Body</label>
              <textarea 
                required
                value={broadcastMessage}
                onChange={e => setBroadcastMessage(e.target.value)}
                placeholder="Type your official announcement here..."
                style={{ width: '100%', padding: '16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none', minHeight: '150px', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
            </div>

            <button 
              type="submit" 
              disabled={broadcasting}
              style={{ padding: '14px 24px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 600, cursor: broadcasting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: broadcasting ? 0.7 : 1 }}
            >
              <Megaphone size={20} />
              {broadcasting ? 'Broadcasting...' : 'Send Broadcast Now'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>
          {activeView === 'users' ? 'User Management' : 'Posts & Challenges'}
        </h2>
        <p style={{ fontSize: '15px', color: '#64748b', margin: 0 }}>
          {activeView === 'users' ? 'Manage roles and accounts.' : 'Manage platform content.'}
        </p>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading...</div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
          {activeView === 'users' ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '16px', color: '#475569', fontWeight: 600 }}>Name</th>
                  <th style={{ padding: '16px', color: '#475569', fontWeight: 600 }}>Email</th>
                  <th style={{ padding: '16px', color: '#475569', fontWeight: 600 }}>Role</th>

                  <th style={{ padding: '16px', color: '#475569', fontWeight: 600 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u, i) => (
                  <tr key={u.id} style={{ borderBottom: i < filteredUsers.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                    <td style={{ padding: '16px', color: '#0f172a', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {u.name || 'Unknown'}
                      {u.verified && (
                        <span title="Verified" style={{ display: 'flex' }}><ShieldCheck size={14} color="#10b981" /></span>
                      )}
                    </td>
                    <td style={{ padding: '16px', color: '#64748b' }}>{u.email}</td>
                    <td style={{ padding: '16px' }}>
                      <select 
                        value={u.role} 
                        onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                        style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                      >
                        <option value="citizen">Citizen</option>
                        <option value="student">Student</option>
                        <option value="university_admin">Institution</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                    </td>

                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <a 
                          href={`mailto:${u.email}`}
                          style={{ color: '#3b82f6', textDecoration: 'none', display: 'flex', alignItems: 'center' }}
                          title="Send Email"
                        >
                          <Mail size={18} />
                        </a>
                        {(u.role === 'university_admin' || u.role === 'student') && (
                          <button 
                            onClick={() => {
                              if (u.verified) {
                                if (window.confirm(`Are you sure you want to REVOKE verification for ${u.name || 'this user'}?`)) {
                                  handleVerifyUser(u.id, false, false);
                                }
                              } else {
                                handleVerifyUser(u.id, false, true);
                              }
                            }}
                            style={{ background: 'transparent', border: 'none', color: u.verified ? '#ef4444' : '#10b981', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            title={u.verified ? 'Revoke Verification' : 'Verify User'}
                          >
                            {u.verified ? <ShieldAlert size={18} /> : <ShieldCheck size={18} />}
                          </button>
                        )}
                        <button 
                          onClick={() => handleDeleteUser(u.id)}
                          style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          title="Delete User"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '16px', color: '#475569', fontWeight: 600 }}>Title</th>
                  <th style={{ padding: '16px', color: '#475569', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '16px', color: '#475569', fontWeight: 600 }}>Category</th>
                  <th style={{ padding: '16px', color: '#475569', fontWeight: 600 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPosts.map((p, i) => (
                  <tr key={p.id} style={{ borderBottom: i < filteredPosts.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                    <td style={{ padding: '16px', color: '#0f172a', fontWeight: 500 }}>{p.title}</td>
                    <td style={{ padding: '16px' }}>
                      <select 
                        value={p.status} 
                        onChange={(e) => handleUpdatePostStatus(p.id, e.target.value)}
                        style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#eff6ff', color: '#2563eb', fontWeight: 600 }}
                      >
                        <option value="submitted">Submitted</option>
                        <option value="under_review">Under Review</option>
                        <option value="routed">Routed</option>
                        <option value="team_formed">Team Formed</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="validated">Validated</option>
                      </select>
                    </td>
                    <td style={{ padding: '16px', color: '#64748b' }}>{p.category || 'Uncategorized'}</td>
                    <td style={{ padding: '16px', display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => handleEditPost(p)}
                        style={{ background: 'transparent', border: 'none', color: '#2563eb', cursor: 'pointer' }}
                        title="Edit Post"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeletePost(p.id)}
                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                        title="Delete Post"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Edit Post Modal */}
      {editingPost && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Edit Post Details</h3>
              <button className="modal-close" onClick={() => setEditingPost(null)} style={{ position: 'static' }}>
                <X size={20} />
              </button>
            </div>
            
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">Title</label>
              <input 
                type="text" 
                className="input-field" 
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>
            
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label">Description</label>
              <textarea 
                className="input-field" 
                rows={6}
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setEditingPost(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSavePostEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
