import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  LogOut,
  Bell,
  Search,
  Menu,
  X,
  ShieldAlert,
  BarChart3,
  ShieldCheck,
  Megaphone,
  Home
} from 'lucide-react';
import { NotificationsModal } from '../components/NotificationsModal';
import { useNotifications } from '../hooks/useNotifications';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeView: string;
  setActiveView: (view: string) => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, activeView, setActiveView }) => {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isNotificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { notifications } = useNotifications();
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'posts', label: 'Posts & Challenges', icon: FileText },
    { id: 'verification', label: 'Verification Requests', icon: ShieldCheck },
    { id: 'notice-panel', label: 'Notice Panel', icon: Megaphone },
    { id: 'ai-analysis', label: 'AI Analysis', icon: ShieldAlert },
    { id: 'statistics', label: 'Statistics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: '#f8fafc' }}>
      
      {/* Sidebar */}
      <aside style={{
        width: isSidebarOpen ? '260px' : '80px',
        background: '#0f172a',
        color: '#fff',
        transition: 'width 0.3s',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', justifyContent: isSidebarOpen ? 'space-between' : 'center', borderBottom: '1px solid #1e293b' }}>
          {isSidebarOpen && <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#fff' }}>Memento<span style={{color: '#ef4444'}}>.admin</span></h1>}
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
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
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  background: isActive ? '#1e293b' : 'transparent',
                  color: isActive ? '#fff' : '#94a3b8',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  justifyContent: isSidebarOpen ? 'flex-start' : 'center',
                  transition: 'all 0.2s'
                }}
                title={!isSidebarOpen ? item.label : undefined}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = '#1e293b';
                    e.currentTarget.style.color = '#fff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#94a3b8';
                  }
                }}
              >
                <Icon size={20} color={isActive ? '#ef4444' : 'currentColor'} />
                {isSidebarOpen && <span style={{ fontSize: '15px', fontWeight: isActive ? 600 : 500 }}>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div style={{ padding: '20px 12px', borderTop: '1px solid #1e293b' }}>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'feed' }))}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              background: 'transparent',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              width: '100%',
              justifyContent: isSidebarOpen ? 'flex-start' : 'center',
              marginBottom: '8px'
            }}
          >
            <Home size={20} />
            {isSidebarOpen && <span style={{ fontSize: '15px', fontWeight: 600 }}>Public Feed</span>}
          </button>
          
          <button
            onClick={logout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              background: 'transparent',
              color: '#ef4444',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              width: '100%',
              justifyContent: isSidebarOpen ? 'flex-start' : 'center',
            }}
          >
            <LogOut size={20} />
            {isSidebarOpen && <span style={{ fontSize: '15px', fontWeight: 600 }}>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Topbar */}
        <header style={{ height: '70px', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#64748b' }}>
            <Search size={20} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search across platform..." 
              style={{ border: 'none', outline: 'none', fontSize: '15px', width: '300px' }} 
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <button onClick={() => setNotificationsOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', position: 'relative' }}>
              <Bell size={20} />
              {unreadCount > 0 && (
                <div style={{ position: 'absolute', top: '-4px', right: '-4px', width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%' }}></div>
              )}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{user?.name || 'Super Admin'}</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>System Administrator</div>
              </div>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '16px' }}>
                {user?.name?.charAt(0) || 'A'}
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
          {React.Children.map(children, child => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child as React.ReactElement<any>, { searchQuery });
            }
            return child;
          })}
        </div>
      </main>

      <NotificationsModal isOpen={isNotificationsOpen} onClose={() => setNotificationsOpen(false)} />
    </div>
  );
};
