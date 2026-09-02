import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ChevronDown, LogOut, User as UserIcon, Bell, ShieldAlert } from 'lucide-react';
import { NotificationsModal } from './NotificationsModal';
import { VerificationRequestModal } from './VerificationRequestModal';
import { useNotifications } from '../hooks/useNotifications';

export type NavTab = 'feed' | 'top-problems' | 'submit' | 'statistics' | 'community' | 'helpdesk' | 'about' | 'login' | 'admin-dashboard' | 'institution-dashboard' | 'student-dashboard';

interface HeaderProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { notifications } = useNotifications();
  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
    <header className="header">
      <div className="header-content">
        <div className="logo" onClick={() => setActiveTab('feed')}>
          Memento
        </div>

        <nav className="header-nav">
          <button
            className={`nav-link ${activeTab === 'feed' ? 'active' : ''}`}
            onClick={() => setActiveTab('feed')}
          >
            Feed
          </button>
          <button
            className={`nav-link ${activeTab === 'top-problems' ? 'active' : ''}`}
            onClick={() => setActiveTab('top-problems')}
          >
            Top Problems
          </button>


          <button
            className={`nav-link ${activeTab === 'statistics' ? 'active' : ''}`}
            onClick={() => setActiveTab('statistics')}
          >
            Statistics
          </button>
          <button
            className={`nav-link ${activeTab === 'community' ? 'active' : ''}`}
            onClick={() => setActiveTab('community')}
          >
            Community
          </button>
          <button
            className={`nav-link ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => setActiveTab('about')}
          >
            About
          </button>

          {isAuthenticated && user?.role === 'super_admin' && (
            <button
              className={`nav-link ${activeTab === 'admin-dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('admin-dashboard')}
            >
              Admin Panel
            </button>
          )}

          {isAuthenticated && (user?.role === 'university_admin' || user?.role === 'faculty') && (
            <button
              className={`nav-link ${activeTab === 'institution-dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('institution-dashboard')}
            >
              Institution Portal
            </button>
          )}

          {isAuthenticated && user?.role === 'student' && (
            <button
              className={`nav-link ${activeTab === 'student-dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('student-dashboard')}
            >
              Student Portal
            </button>
          )}

          {isAuthenticated && user ? (
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <button
                className="btn btn-outline"
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                }}
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <UserIcon size={16} />
                <span>{user.name || 'User'}</span>
                <ChevronDown size={14} />
              </button>

              {dropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '100%',
                    marginTop: '8px',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                    width: '260px',
                    zIndex: 1000,
                    padding: '16px',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '10px' }}>
                    <p style={{ fontWeight: 700, margin: '0 0 4px', fontSize: '15px' }}>{user.name || 'User'}</p>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>{user.email}</p>
                  </div>
                  <div style={{ marginBottom: '14px', fontSize: '13px' }}>
                    <span style={{ color: '#64748b' }}>Role: </span>
                    <span style={{ fontWeight: 600, textTransform: 'capitalize', color: '#2563eb' }}>
                      {(user.role || 'Citizen').replace('_', ' ')}
                    </span>
                  </div>
                  
                  {user && !user.verified && (user.role === 'student' || user.role === 'university_admin') && (
                    <button
                      className="btn btn-outline w-100"
                      style={{ marginBottom: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', color: '#d97706', borderColor: '#fcd34d', background: '#fffbeb' }}
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
                    style={{ marginBottom: '8px', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    onClick={() => {
                      setIsNotificationsOpen(true);
                      setDropdownOpen(false);
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Bell size={14} /> Notifications
                    </div>
                    {unreadCount > 0 && (
                      <span style={{ background: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '10px' }}>
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  <button
                    className="btn btn-outline w-100"
                    style={{ color: '#ef4444', borderColor: '#fca5a5', fontSize: '13px' }}
                    onClick={() => {
                      if (window.confirm("Are you sure you want to log out?")) {
                        logout();
                        setDropdownOpen(false);
                      }
                    }}
                  >
                    <LogOut size={14} /> Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              className="btn btn-primary"
              style={{ padding: '7px 18px', borderRadius: '8px', fontSize: '14px' }}
              onClick={() => setActiveTab('login')}
            >
              Sign In
            </button>
          )}
        </nav>
      </div>
    </header>
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
