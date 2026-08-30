import React, { useState, useEffect } from 'react';
import { challengesService } from '../services/challenges.service';
import { usersService } from '../services/users.service';
import { Challenge, ChallengeStatus } from '../types/challenge.types';
import { User } from '../types/auth.types';
import { StatusBadge } from '../components/common/StatusBadge';
import { PriorityIndicator } from '../components/common/PriorityIndicator';
import { AiOverrideModal } from '../components/admin/AiOverrideModal';
import { ChallengeDetailModal } from '../components/challenges/ChallengeDetailModal';
import { useNotifications } from '../context/NotificationContext';
import {
  Sparkles,
  Shield,
  CheckCircle2,
  Users,
  Building2,
  Layers,
  Wrench,
  Search,
  Check,
  X,
  Clock,
  Eye
} from 'lucide-react';

export const SuperAdminDashboard: React.FC = () => {
  const { addToast } = useNotifications();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'challenges' | 'users'>('challenges');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [chRes, uRes] = await Promise.all([
        challengesService.getChallenges({ search: searchQuery || undefined }),
        usersService.getUsers(),
      ]);
      setChallenges(chRes.data);
      setUsersList(uRes);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchQuery]);

  const handleVerifyUser = async (userId: string) => {
    try {
      await usersService.verifyUser(userId);
      addToast({ title: 'Account Verified!', message: 'Institutional credentials approved.', type: 'success' });
      const updated = await usersService.getUsers();
      setUsersList(updated);
    } catch (err: any) {
      addToast({ title: 'Error', message: err.message, type: 'error' });
    }
  };

  const handleStatusChange = async (challengeId: string, newStatus: ChallengeStatus) => {
    try {
      await challengesService.updateStatus(challengeId, newStatus, 'Super Admin manual lifecycle transition.');
      addToast({ title: 'Status Updated!', message: `Advanced lifecycle state to ${newStatus.toUpperCase()}`, type: 'success' });
      loadData();
    } catch (err: any) {
      addToast({ title: 'Error', message: err.message, type: 'error' });
    }
  };

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem 4rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#f43f5e', marginBottom: '0.25rem' }}>
            <Sparkles size={16} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Super Administrator Master Console</span>
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Platform Control Panel</h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Direct state machine transitions, AI routing manual overrides, institutional account verifications, and audit controls.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setActiveTab('challenges')}
            className={`btn btn-sm ${activeTab === 'challenges' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Layers size={14} /> All Challenges ({challenges.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`btn btn-sm ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Users size={14} /> User Accounts ({usersList.length})
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '480px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search problems, institutions, or districts..."
            className="form-input"
            style={{ paddingLeft: '2.25rem', fontSize: '0.85rem' }}
          />
        </div>
      </div>

      {/* TAB 1: ALL CHALLENGES TABLE */}
      {activeTab === 'challenges' && (
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-glass)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '1rem 1.25rem' }}>Title & Problem</th>
                <th style={{ padding: '1rem' }}>District</th>
                <th style={{ padding: '1rem' }}>Assigned Institution</th>
                <th style={{ padding: '1rem' }}>AI Severity</th>
                <th style={{ padding: '1rem' }}>Current Status</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {challenges.map((ch) => (
                <tr key={ch.id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.15s' }}>
                  <td style={{ padding: '1rem 1.25rem', maxWidth: '280px' }}>
                    <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ch.title}
                    </strong>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      ID: {ch.id.slice(0, 8)}... • {ch.categories?.name || 'Water'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                    {ch.district}
                  </td>
                  <td style={{ padding: '1rem', color: '#38bdf8', fontWeight: 500 }}>
                    {ch.institutions?.name || 'BIT Sindri'}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <PriorityIndicator score={ch.priority_score} showLabel={false} />
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <select
                      value={ch.status}
                      onChange={(e) => handleStatusChange(ch.id, e.target.value as ChallengeStatus)}
                      className="form-select"
                      style={{ fontSize: '0.78rem', padding: '0.3rem 0.5rem', width: 'auto' }}
                    >
                      <option value="submitted">submitted</option>
                      <option value="under_review">under_review</option>
                      <option value="routed">routed</option>
                      <option value="team_formed">team_formed</option>
                      <option value="in_progress">in_progress</option>
                      <option value="completed">completed</option>
                      <option value="validated">validated</option>
                    </select>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem' }}>
                      <button
                        onClick={() => {
                          setSelectedChallenge(ch);
                          setOverrideOpen(true);
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem', gap: '0.25rem' }}
                        title="Override AI Routing"
                      >
                        <Shield size={13} color="#f43f5e" /> Override AI
                      </button>
                      <button
                        onClick={() => {
                          setSelectedChallenge(ch);
                          setDetailOpen(true);
                        }}
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: '0.75rem' }}
                      >
                        <Eye size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: USER VERIFICATION TABLE */}
      {activeTab === 'users' && (
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-glass)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '1rem 1.25rem' }}>Name & Email</th>
                <th style={{ padding: '1rem' }}>Platform Role</th>
                <th style={{ padding: '1rem' }}>Institution / District</th>
                <th style={{ padding: '1rem' }}>Verification Status</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {usersList.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <strong style={{ color: 'var(--text-primary)', display: 'block' }}>{u.name}</strong>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{u.email}</span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span className="glass-pill" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                    {u.district || 'Jharkhand'}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: u.verified ? '#34d399' : '#fbbf24',
                      }}
                    >
                      {u.verified ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                      {u.verified ? 'Verified Active' : 'Pending Verification'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    {!u.verified && (
                      <button
                        onClick={() => handleVerifyUser(u.id)}
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '0.78rem', gap: '0.25rem' }}
                      >
                        <Check size={13} /> Verify Account
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      <ChallengeDetailModal
        challenge={selectedChallenge}
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        onRefresh={loadData}
        onOpenAiOverrideModal={(ch) => {
          setSelectedChallenge(ch);
          setOverrideOpen(true);
        }}
      />

      <AiOverrideModal
        challenge={selectedChallenge}
        isOpen={overrideOpen}
        onClose={() => setOverrideOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
};
