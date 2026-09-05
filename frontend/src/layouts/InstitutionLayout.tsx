import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  CheckSquare,
  Settings,
  LogOut,
  Bell,
  Search,
  Menu,
  Building,
  ShieldAlert,
  Home
} from 'lucide-react';
import { NotificationsModal } from '../components/NotificationsModal';
import { VerificationRequestModal } from '../components/VerificationRequestModal';
import { useNotifications } from '../hooks/useNotifications';

interface InstitutionLayoutProps {
  children: React.ReactNode;
  activeView: string;
  setActiveView: (view: string) => void;
}

export const InstitutionLayout: React.FC<InstitutionLayoutProps> = ({ children, activeView, setActiveView }) => {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isNotificationsOpen, setNotificationsOpen] = useState(false);
  const [isVerificationModalOpen, setVerificationModalOpen] = useState(false);
  const { notifications } = useNotifications();
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'challenges', label: 'Assigned Challenges', icon: CheckSquare },
    { id: 'profile', label: 'Organization Profile', icon: Building },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: '#f8fafc' }}>
      <aside style={{
        width: isSidebarOpen ? '260px' : '80px',
        background: '#4c1d95',
        color: '#fff',
        transition: 'width 0.3s',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', justifyContent: isSidebarOpen ? 'space-between' : 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          {isSidebarOpen && <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#fff' }}>Memento<span style={{color: '#a78bfa'}}>.org</span></h1>}
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <Menu size={20} />
          </button>
        </div>

        <nav style={{ flex: 1, padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
                  background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: isActive ? '#fff' : '#cbd5e1',
                  border: 'none', borderRadius: '8px', cursor: 'pointer',
                  justifyContent: isSidebarOpen ? 'flex-start' : 'center',
                  transition: 'all 0.2s'
                }}
                title={!isSidebarOpen ? item.label : undefined}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.color = '#fff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#cbd5e1';
                  }
                }}
              >
                <Icon size={20} color={isActive ? '#a78bfa' : 'currentColor'} />
                {isSidebarOpen && <span style={{ fontSize: '15px', fontWeight: isActive ? 600 : 500 }}>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div style={{ padding: '20px 12px', borderTop: '1px solid #1e293b' }}>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'feed' }))}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
              background: 'transparent', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer',
              width: '100%', justifyContent: isSidebarOpen ? 'flex-start' : 'center', marginBottom: '8px'
            }}
          >
            <Home size={20} />
            {isSidebarOpen && <span style={{ fontSize: '15px', fontWeight: 600 }}>Public Feed</span>}
          </button>

          <button
            onClick={logout}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
              background: 'transparent', color: '#f87171', border: 'none', borderRadius: '8px', cursor: 'pointer',
              width: '100%', justifyContent: isSidebarOpen ? 'flex-start' : 'center',
            }}
          >
            <LogOut size={20} />
            {isSidebarOpen && <span style={{ fontSize: '15px', fontWeight: 600 }}>Sign Out</span>}
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{ height: '70px', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#64748b' }}>
            <Search size={20} />
            <input type="text" placeholder="Search tasks..." style={{ border: 'none', outline: 'none', fontSize: '15px', width: '300px' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            {user && !user.verified && (
              <button 
                onClick={() => setVerificationModalOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#fffbeb', color: '#d97706', border: '1px solid #fcd34d', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
              >
                <ShieldAlert size={14} /> Request Verification
              </button>
            )}
            <button onClick={() => setNotificationsOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', position: 'relative' }}>
              <Bell size={20} />
              {unreadCount > 0 && (
                <div style={{ position: 'absolute', top: '-4px', right: '-4px', width: '8px', height: '8px', background: '#8b5cf6', borderRadius: '50%' }}></div>
              )}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{user?.name || 'Institution'}</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Admin</div>
              </div>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#ede9fe', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '16px' }}>
                {user?.name?.charAt(0) || 'I'}
              </div>
            </div>
          </div>
        </header>

        <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
          {children}
        </div>
      </main>

      <NotificationsModal isOpen={isNotificationsOpen} onClose={() => setNotificationsOpen(false)} />
      {isVerificationModalOpen && (
        <VerificationRequestModal onClose={() => setVerificationModalOpen(false)} />
      )}
    </div>
  );
};
