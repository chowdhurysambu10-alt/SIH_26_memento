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
  Home,
  Shield,
} from 'lucide-react';
import { NotificationsModal } from '../components/NotificationsModal';
import { useNotifications } from '../hooks/useNotifications';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeView: string;
  setActiveView: (view: string) => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  activeView,
  setActiveView,
}) => {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { notifications } = useNotifications();
  const unreadCount = notifications.filter((n) => !n.isRead).length;

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

  const handleNav = (id: string) => {
    setActiveView(id);
    setMobileMenuOpen(false);
  };

  return (
    <div className="portal-layout-container">
      {/* Desktop Sidebar */}
      <aside className={`portal-desktop-sidebar admin-sidebar ${isSidebarOpen ? 'expanded' : 'collapsed'}`}>
        <div className="sidebar-brand-header">
          {isSidebarOpen && (
            <div className="sidebar-brand-title">
              <Shield size={20} color="#ef4444" />
              <span>
                Memento<span style={{ color: '#ef4444' }}>.admin</span>
              </span>
            </div>
          )}
          <button
            type="button"
            className="sidebar-collapse-btn"
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            aria-label="Toggle sidebar"
          >
            <Menu size={18} />
          </button>
        </div>

        <nav className="sidebar-nav-list">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setActiveView(item.id)}
                title={!isSidebarOpen ? item.label : undefined}
              >
                <Icon size={18} color={isActive ? '#ef4444' : 'currentColor'} />
                {isSidebarOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer-actions">
          <button
            type="button"
            className="sidebar-footer-btn"
            onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'feed' }))}
          >
            <Home size={18} />
            {isSidebarOpen && <span>Public Feed</span>}
          </button>

          <button
            type="button"
            className="sidebar-footer-btn logout-link"
            onClick={logout}
          >
            <LogOut size={18} />
            {isSidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="portal-main-area">
        {/* Topbar */}
        <header className="portal-topbar">
          <div className="portal-topbar-left">
            <button
              type="button"
              className="portal-mobile-menu-btn"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
            <div className="portal-topbar-search">
              <Search size={16} color="#64748b" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search across platform..."
                className="portal-search-input"
              />
            </div>
          </div>

          <div className="portal-topbar-right">
            <button
              type="button"
              className="portal-topbar-icon-btn"
              onClick={() => setNotificationsOpen(true)}
              aria-label="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && <span className="topbar-badge-dot" />}
            </button>
            <div className="portal-user-profile-summary">
              <div className="portal-user-text">
                <div className="portal-user-name">{user?.name || 'Super Admin'}</div>
                <div className="portal-user-role">System Administrator</div>
              </div>
              <div className="portal-user-avatar admin-avatar">
                {user?.name?.charAt(0) || 'A'}
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="portal-content-scroll">
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child as React.ReactElement<any>, { searchQuery });
            }
            return child;
          })}
        </div>
      </main>

      {/* Mobile Drawer */}
      <div
        className={`mobile-drawer-overlay ${mobileMenuOpen ? 'open' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      >
        <div
          className="mobile-drawer-sheet open admin-drawer"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="drawer-header">
            <div className="sidebar-brand-title">
              <Shield size={20} color="#ef4444" />
              <span>
                Memento<span style={{ color: '#ef4444' }}>.admin</span>
              </span>
            </div>
            <button
              type="button"
              className="drawer-close-btn"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X size={20} />
            </button>
          </div>

          <div className="drawer-nav-sections">
            <div className="drawer-section-title">Admin Management</div>
            <div className="drawer-nav-list">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`drawer-nav-link ${isActive ? 'active' : ''}`}
                    onClick={() => handleNav(item.id)}
                  >
                    <Icon size={18} color={isActive ? '#ef4444' : 'currentColor'} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="drawer-footer">
            <button
              type="button"
              className="btn btn-outline w-100"
              style={{ marginBottom: '8px' }}
              onClick={() => {
                setMobileMenuOpen(false);
                window.dispatchEvent(new CustomEvent('navigate', { detail: 'feed' }));
              }}
            >
              <Home size={16} /> Public Feed
            </button>
            <button
              type="button"
              className="btn btn-outline w-100 logout-btn"
              onClick={() => {
                setMobileMenuOpen(false);
                logout();
              }}
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>
      </div>

      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
    </div>
  );
};
