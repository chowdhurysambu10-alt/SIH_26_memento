import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ChevronDown,
  LogOut,
  User as UserIcon,
  Bell,
  ShieldAlert,
  Menu,
  X,
  Home,
  Compass,
  PlusCircle,
  Flame,
  BarChart3,
  MessageSquare,
  Info,
  Shield,
  Building2,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { NotificationsModal } from './NotificationsModal';
import { VerificationRequestModal } from './VerificationRequestModal';
import { useNotifications } from '../hooks/useNotifications';

export type NavTab =
  | 'home'
  | 'feed'
  | 'top-problems'
  | 'submit'
  | 'statistics'
  | 'community'
  | 'helpdesk'
  | 'about'
  | 'login'
  | 'admin-dashboard'
  | 'institution-dashboard'
  | 'student-dashboard';

interface HeaderProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  platformSettings?: any;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, platformSettings }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { notifications } = useNotifications();
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileDrawerOpen]);

  const handleNavClick = (tab: NavTab) => {
    setActiveTab(tab);
    setMobileDrawerOpen(false);
  };

  return (
    <>
      <header className="header">
        <div className="header-content">
          {/* Brand Logo */}
          <div className="logo-group" onClick={() => handleNavClick('home')}>
            <div className="logo-icon-wrap">
              <Sparkles size={18} color="#2563eb" />
            </div>
            <div className="logo">Memento</div>
            <span className="logo-badge">SIH '26</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="header-nav desktop-nav">
            <button
              className={`nav-link ${activeTab === 'home' ? 'active' : ''}`}
              onClick={() => handleNavClick('home')}
            >
              Home
            </button>
            <button
              className={`nav-link ${activeTab === 'feed' ? 'active' : ''}`}
              onClick={() => handleNavClick('feed')}
            >
              Feed
            </button>
            <button
              className={`nav-link ${activeTab === 'top-problems' ? 'active' : ''}`}
              onClick={() => handleNavClick('top-problems')}
            >
              Top Problems
            </button>
            <button
              className={`nav-link ${activeTab === 'statistics' ? 'active' : ''}`}
              onClick={() => handleNavClick('statistics')}
            >
              Statistics
            </button>
            {platformSettings?.enableCommunityChat !== false && (
              <button
                className={`nav-link ${activeTab === 'community' ? 'active' : ''}`}
                onClick={() => handleNavClick('community')}
              >
                Community
              </button>
            )}
            <button
              className={`nav-link ${activeTab === 'about' ? 'active' : ''}`}
              onClick={() => handleNavClick('about')}
            >
              About
            </button>

            {isAuthenticated && user?.role === 'super_admin' && (
              <button
                className={`nav-link ${activeTab === 'admin-dashboard' ? 'active' : ''}`}
                onClick={() => handleNavClick('admin-dashboard')}
              >
                Admin Panel
              </button>
            )}

            {isAuthenticated && (user?.role === 'university_admin' || user?.role === 'faculty') && (
              <button
                className={`nav-link ${activeTab === 'institution-dashboard' ? 'active' : ''}`}
                onClick={() => handleNavClick('institution-dashboard')}
              >
                Institution Portal
              </button>
            )}

            {isAuthenticated && user?.role === 'student' && (
              <button
                className={`nav-link ${activeTab === 'student-dashboard' ? 'active' : ''}`}
                onClick={() => handleNavClick('student-dashboard')}
              >
                Student Portal
              </button>
            )}

            {isAuthenticated && user ? (
              <div style={{ position: 'relative' }} ref={dropdownRef}>
                <button
                  className="btn btn-outline user-menu-btn"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  aria-expanded={dropdownOpen}
                >
                  <div className="user-avatar-mini">
                    {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon size={14} />}
                  </div>
                  <span className="user-name-label">{user.name || 'User'}</span>
                  <ChevronDown size={14} />
                </button>

                {dropdownOpen && (
                  <div className="desktop-dropdown-menu">
                    <div className="dropdown-header">
                      <p className="dropdown-user-name">{user.name || 'User'}</p>
                      <p className="dropdown-user-email">{user.email}</p>
                    </div>
                    <div className="dropdown-role-row">
                      <span>Role: </span>
                      <span className="dropdown-role-val">
                        {(user.role || 'Citizen').replace('_', ' ')}
                      </span>
                    </div>

                    {user && !user.verified && (user.role === 'student' || user.role === 'university_admin') && (
                      <button
                        className="btn btn-outline w-100"
                        style={{
                          marginBottom: '8px',
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: '#d97706',
                          borderColor: '#fcd34d',
                          background: '#fffbeb',
                        }}
                        onClick={() => {
                          setIsVerificationModalOpen(true);
                          setDropdownOpen(false);
                        }}
                      >
                        <ShieldAlert size={14} /> Request Verification
                      </button>
                    )}

                    <button
                      className="btn btn-outline w-100"
                      style={{
                        marginBottom: '8px',
                        fontSize: '13px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                      onClick={() => {
                        setIsNotificationsOpen(true);
                        setDropdownOpen(false);
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Bell size={14} /> Notifications
                      </div>
                      {unreadCount > 0 && (
                        <span className="notification-badge-count">{unreadCount}</span>
                      )}
                    </button>

                    <button
                      className="btn btn-outline w-100 logout-btn"
                      onClick={() => {
                        logout();
                        setDropdownOpen(false);
                      }}
                    >
                      <LogOut size={14} /> Log Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                className="btn btn-primary sign-in-btn"
                onClick={() => handleNavClick('login')}
              >
                Sign In
              </button>
            )}
          </nav>

          {/* Mobile App Bar Actions */}
          <div className="mobile-header-actions">
            {isAuthenticated && (
              <button
                type="button"
                className="mobile-icon-btn"
                onClick={() => setIsNotificationsOpen(true)}
                aria-label="Notifications"
              >
                <Bell size={20} />
                {unreadCount > 0 && <span className="mobile-bell-dot">{unreadCount}</span>}
              </button>
            )}

            {isAuthenticated && user ? (
              <button
                type="button"
                className="mobile-avatar-btn"
                onClick={() => setMobileDrawerOpen(true)}
                aria-label="User Profile Menu"
              >
                {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon size={16} />}
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary mobile-signin-pill"
                onClick={() => handleNavClick('login')}
              >
                Sign In
              </button>
            )}

            <button
              type="button"
              className="mobile-drawer-toggle"
              onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
              aria-label="Toggle Navigation Menu"
            >
              {mobileDrawerOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* Slide-out Mobile Navigation Drawer */}
      <div
        className={`mobile-drawer-overlay ${mobileDrawerOpen ? 'open' : ''}`}
        onClick={() => setMobileDrawerOpen(false)}
      >
        <div
          className={`mobile-drawer-sheet ${mobileDrawerOpen ? 'open' : ''}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drawer Header */}
          <div className="drawer-header">
            <div className="logo-group" onClick={() => handleNavClick('home')}>
              <div className="logo-icon-wrap">
                <Sparkles size={16} color="#2563eb" />
              </div>
              <div className="logo" style={{ fontSize: '22px' }}>Memento</div>
            </div>
            <button
              type="button"
              className="drawer-close-btn"
              onClick={() => setMobileDrawerOpen(false)}
              aria-label="Close Menu"
            >
              <X size={20} />
            </button>
          </div>

          {/* User Card if Authenticated */}
          {isAuthenticated && user ? (
            <div className="drawer-user-card">
              <div className="drawer-user-row">
                <div className="drawer-avatar">
                  {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon size={20} />}
                </div>
                <div className="drawer-user-info">
                  <h4 className="drawer-user-name">{user.name || 'User'}</h4>
                  <p className="drawer-user-email">{user.email}</p>
                </div>
              </div>

              <div className="drawer-role-badge">
                <span>Role: </span>
                <strong>{(user.role || 'Citizen').replace('_', ' ')}</strong>
                {user.verified ? (
                  <span className="verified-pill">✓ Verified</span>
                ) : (
                  (user.role === 'student' || user.role === 'university_admin') && (
                    <button
                      className="request-verify-pill"
                      onClick={() => {
                        setMobileDrawerOpen(false);
                        setIsVerificationModalOpen(true);
                      }}
                    >
                      Verify
                    </button>
                  )
                )}
              </div>
            </div>
          ) : (
            <div className="drawer-guest-card">
              <p>Sign in to submit complaints, join university labs, and earn recognition.</p>
              <button
                className="btn btn-primary w-100"
                onClick={() => handleNavClick('login')}
              >
                Sign In / Register
              </button>
            </div>
          )}

          {/* Navigation Links */}
          <div className="drawer-nav-sections">
            <div className="drawer-section-title">Navigation</div>
            <div className="drawer-nav-list">
              <button
                className={`drawer-nav-link ${activeTab === 'home' ? 'active' : ''}`}
                onClick={() => handleNavClick('home')}
              >
                <Home size={18} />
                <span>Home</span>
              </button>
              <button
                className={`drawer-nav-link ${activeTab === 'feed' ? 'active' : ''}`}
                onClick={() => handleNavClick('feed')}
              >
                <Compass size={18} />
                <span>Live Feed</span>
              </button>
              <button
                className={`drawer-nav-link ${activeTab === 'submit' ? 'active' : ''}`}
                onClick={() => handleNavClick('submit')}
              >
                <PlusCircle size={18} />
                <span>Submit Challenge</span>
              </button>
              <button
                className={`drawer-nav-link ${activeTab === 'top-problems' ? 'active' : ''}`}
                onClick={() => handleNavClick('top-problems')}
              >
                <Flame size={18} />
                <span>Top Problems</span>
              </button>
              <button
                className={`drawer-nav-link ${activeTab === 'statistics' ? 'active' : ''}`}
                onClick={() => handleNavClick('statistics')}
              >
                <BarChart3 size={18} />
                <span>Analytics & Stats</span>
              </button>
              {platformSettings?.enableCommunityChat !== false && (
                <button
                  className={`drawer-nav-link ${activeTab === 'community' ? 'active' : ''}`}
                  onClick={() => handleNavClick('community')}
                >
                  <MessageSquare size={18} />
                  <span>Community Connect</span>
                </button>
              )}
              <button
                className={`drawer-nav-link ${activeTab === 'about' ? 'active' : ''}`}
                onClick={() => handleNavClick('about')}
              >
                <Info size={18} />
                <span>About Memento</span>
              </button>
            </div>

            {/* Portals Section */}
            {isAuthenticated && (user?.role === 'super_admin' || user?.role === 'university_admin' || user?.role === 'faculty' || user?.role === 'student') && (
              <>
                <div className="drawer-section-title" style={{ marginTop: '16px' }}>Dedicated Portals</div>
                <div className="drawer-nav-list">
                  {user?.role === 'super_admin' && (
                    <button
                      className={`drawer-nav-link portal-link ${activeTab === 'admin-dashboard' ? 'active' : ''}`}
                      onClick={() => handleNavClick('admin-dashboard')}
                    >
                      <Shield size={18} color="#ef4444" />
                      <span>Admin Control Panel</span>
                    </button>
                  )}
                  {(user?.role === 'university_admin' || user?.role === 'faculty') && (
                    <button
                      className={`drawer-nav-link portal-link ${activeTab === 'institution-dashboard' ? 'active' : ''}`}
                      onClick={() => handleNavClick('institution-dashboard')}
                    >
                      <Building2 size={18} color="#8b5cf6" />
                      <span>Institution Portal</span>
                    </button>
                  )}
                  {user?.role === 'student' && (
                    <button
                      className={`drawer-nav-link portal-link ${activeTab === 'student-dashboard' ? 'active' : ''}`}
                      onClick={() => handleNavClick('student-dashboard')}
                    >
                      <GraduationCap size={18} color="#10b981" />
                      <span>Student Portal</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Drawer Footer Actions */}
          {isAuthenticated && (
            <div className="drawer-footer">
              <button
                className="btn btn-outline w-100"
                style={{
                  marginBottom: '10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
                onClick={() => {
                  setMobileDrawerOpen(false);
                  setIsNotificationsOpen(true);
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Bell size={16} /> Notifications
                </div>
                {unreadCount > 0 && (
                  <span className="notification-badge-count">{unreadCount}</span>
                )}
              </button>

              <button
                className="btn btn-outline w-100 logout-btn"
                onClick={() => {
                  logout();
                  setMobileDrawerOpen(false);
                }}
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />
      {isVerificationModalOpen && (
        <VerificationRequestModal onClose={() => setIsVerificationModalOpen(false)} />
      )}
    </>
  );
};
