import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Trophy,
  BookOpen,
  Settings,
  LogOut,
  Bell,
  Search,
  Menu,
  ShieldAlert,
  Home
} from 'lucide-react';
import { NotificationsModal } from '../components/NotificationsModal';
import { VerificationRequestModal } from '../components/VerificationRequestModal';
import { useNotifications } from '../hooks/useNotifications';
import { useIsMobile } from '../hooks/useMediaQuery';

interface StudentLayoutProps {
  children: React.ReactNode;
  activeView: string;
  setActiveView: (view: string) => void;
}

export const StudentLayout: React.FC<StudentLayoutProps> = ({ children, activeView, setActiveView }) => {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isNotificationsOpen, setNotificationsOpen] = useState(false);
  const [isVerificationModalOpen, setVerificationModalOpen] = useState(false);
  const { notifications } = useNotifications();
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const navItems = [
    { id: 'dashboard', label: 'My Submissions', icon: LayoutDashboard },
    { id: 'opportunities', label: 'Opportunities', icon: Trophy },
    { id: 'credits', label: 'Academic Credits', icon: BookOpen },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const isMobile = useIsMobile();

  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', height: '100vh', width: '100vw', overflow: 'hidden', background: '#f8fafc' }}>
      {!isMobile && (
        <aside style={{
          width: isSidebarOpen ? '260px' : '80px',
          background: '#047857', // emerald-700
          color: '#fff',
          transition: 'width 0.3s',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          zIndex: 10
        }}>
          <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', justifyContent: isSidebarOpen ? 'space-between' : 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            {isSidebarOpen && <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#fff' }}>Memento<span style={{color: '#6ee7b7'}}>.student</span></h1>}
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} style={{ background: 'none', border: 'none', color: '#d1fae5', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
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
                    color: isActive ? '#fff' : '#d1fae5',
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
                      e.currentTarget.style.color = '#d1fae5';
                    }
                  }}
                >
                  <Icon size={20} color={isActive ? '#34d399' : 'currentColor'} />
                  {isSidebarOpen && <span style={{ fontSize: '15px', fontWeight: isActive ? 600 : 500 }}>{item.label}</span>}
                </button>
              );
            })}
          </nav>

          <div style={{ padding: '20px 12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'feed' }))}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
                background: 'transparent', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer',
                width: '100%', justifyContent: isSidebarOpen ? 'flex-start' : 'center', marginBottom: '8px'
              }}
            >
              <Home size={20} />
              {isSidebarOpen && <span style={{ fontSize: '15px', fontWeight: 600 }}>Public Updates</span>}
            </button>
            
            <button
              onClick={logout}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
                background: 'transparent', color: '#fca5a5', border: 'none', borderRadius: '8px', cursor: 'pointer',
                width: '100%', justifyContent: isSidebarOpen ? 'flex-start' : 'center',
              }}
            >
              <LogOut size={20} />
              {isSidebarOpen && <span style={{ fontSize: '15px', fontWeight: 600 }}>Sign Out</span>}
            </button>
          </div>
        </aside>
      )}

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', paddingBottom: isMobile ? '64px' : '0' }}>
        <header style={{ height: '70px', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '0 16px' : '0 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#64748b' }}>
            {isMobile ? (
              <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#047857' }}>Memento<span style={{color: '#34d399'}}>.student</span></h1>
            ) : (
              <>
                <Search size={20} />
                <input type="text" placeholder="Search challenges..." style={{ border: 'none', outline: 'none', fontSize: '15px', width: '300px' }} />
              </>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {user && !user.verified && !isMobile && (
              <button 
                onClick={() => setVerificationModalOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#fffbeb', color: '#d97706', border: '1px solid #fcd34d', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
              >
                <ShieldAlert size={14} /> Request Verification
              </button>
            )}
            {user && !user.verified && isMobile && (
              <button 
                onClick={() => setVerificationModalOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px', background: '#fffbeb', color: '#d97706', border: '1px solid #fcd34d', borderRadius: '6px', cursor: 'pointer' }}
              >
                <ShieldAlert size={16} />
              </button>
            )}
            <button onClick={() => setNotificationsOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', position: 'relative' }}>
              <Bell size={20} />
              {unreadCount > 0 && (
                <div style={{ position: 'absolute', top: '-4px', right: '-4px', width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }}></div>
              )}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {!isMobile && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{user?.name || 'Student'}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Learner</div>
                </div>
              )}
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#d1fae5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px' }}>
                {user?.name?.charAt(0) || 'S'}
              </div>
            </div>
          </div>
        </header>

        <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px' : '32px' }}>
          {children}
        </div>
      </main>

      {isMobile && (
        <nav style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, height: '64px',
          background: '#fff', borderTop: '1px solid #e2e8f0',
          display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 1000,
          boxShadow: '0 -4px 6px -1px rgba(0,0,0,0.05)'
        }}>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                  background: 'none', border: 'none', padding: '8px', cursor: 'pointer',
                  color: isActive ? '#047857' : '#64748b'
                }}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span style={{ fontSize: '10px', fontWeight: isActive ? 600 : 500 }}>{item.label.split(' ')[0]}</span>
              </button>
            );
          })}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'feed' }))}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
              background: 'none', border: 'none', padding: '8px', cursor: 'pointer',
              color: '#64748b'
            }}
          >
            <Home size={22} />
            <span style={{ fontSize: '10px', fontWeight: 500 }}>Updates</span>
          </button>
        </nav>
      )}

      <NotificationsModal isOpen={isNotificationsOpen} onClose={() => setNotificationsOpen(false)} />
      {isVerificationModalOpen && (
        <VerificationRequestModal onClose={() => setVerificationModalOpen(false)} />
      )}
    </div>
  );
};
