import React from 'react';
import { Home, Compass, PlusCircle, Flame, BarChart3, User, Shield, Building2, GraduationCap } from 'lucide-react';
import { NavTab } from './Header';
import { useAuth } from '../context/AuthContext';

interface BottomNavProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const { user, isAuthenticated } = useAuth();

  const getPortalTab = (): { tab: NavTab; label: string; icon: any } | null => {
    if (!isAuthenticated || !user) return null;
    if (user.role === 'super_admin') {
      return { tab: 'admin-dashboard', label: 'Admin', icon: Shield };
    }
    if (user.role === 'university_admin' || user.role === 'faculty') {
      return { tab: 'institution-dashboard', label: 'Portal', icon: Building2 };
    }
    if (user.role === 'student') {
      return { tab: 'student-dashboard', label: 'Student', icon: GraduationCap };
    }
    return null;
  };

  const portalInfo = getPortalTab();

  const navItems: { tab: NavTab; label: string; icon: any; isCenterAction?: boolean }[] = [
    { tab: 'home', label: 'Home', icon: Home },
    { tab: 'feed', label: 'Feed', icon: Compass },
    { tab: 'submit', label: 'Submit', icon: PlusCircle, isCenterAction: true },
    { tab: 'top-problems', label: 'Top', icon: Flame },
    ...(portalInfo
      ? [{ tab: portalInfo.tab, label: portalInfo.label, icon: portalInfo.icon }]
      : [{ tab: 'statistics' as NavTab, label: 'Stats', icon: BarChart3 }]),
  ];

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
      <div className="mobile-bottom-nav-inner">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.tab;

          if (item.isCenterAction) {
            return (
              <button
                key={item.tab}
                type="button"
                className={`bottom-nav-action-btn ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(item.tab)}
                aria-label={item.label}
              >
                <div className="center-action-circle">
                  <Icon size={24} strokeWidth={2.4} />
                </div>
                <span className="bottom-nav-label">{item.label}</span>
              </button>
            );
          }

          return (
            <button
              key={item.tab}
              type="button"
              className={`bottom-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(item.tab)}
              aria-label={item.label}
            >
              <div className="bottom-nav-icon-wrap">
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.9} />
                {isActive && <span className="bottom-nav-active-dot" />}
              </div>
              <span className="bottom-nav-label">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
