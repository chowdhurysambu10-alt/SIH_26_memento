import React from 'react';
import { Home, Globe, Plus, TrendingUp, Activity } from 'lucide-react';
import { NavTab } from './Header';
import { useAuth } from '../context/AuthContext';

interface MobileBottomNavProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ activeTab, setActiveTab }) => {
  const { isAuthenticated } = useAuth();

  return (
    <nav className="mobile-bottom-nav">
      <button
        type="button"
        className={`mobile-nav-item ${activeTab === 'home' ? 'active' : ''}`}
        onClick={() => setActiveTab('home')}
      >
        <Home size={22} />
        <span>Home</span>
      </button>

      <button
        type="button"
        className={`mobile-nav-item ${activeTab === 'feed' ? 'active' : ''}`}
        onClick={() => setActiveTab('feed')}
      >
        <Globe size={22} />
        <span>Updates</span>
      </button>

      <button
        type="button"
        className={`mobile-nav-item mobile-nav-submit-wrapper ${activeTab === 'submit' ? 'active' : ''}`}
        onClick={() => isAuthenticated ? setActiveTab('submit') : setActiveTab('login')}
        aria-label="Submit"
      >
        <div className="mobile-nav-submit-btn">
          <Plus size={26} strokeWidth={2.5} />
        </div>
        <span>Submit</span>
      </button>

      <button
        type="button"
        className={`mobile-nav-item ${activeTab === 'top-problems' ? 'active' : ''}`}
        onClick={() => setActiveTab('top-problems')}
      >
        <TrendingUp size={22} />
        <span>Top</span>
      </button>

      <button
        type="button"
        className={`mobile-nav-item ${activeTab === 'statistics' ? 'active' : ''}`}
        onClick={() => setActiveTab('statistics')}
      >
        <Activity size={22} />
        <span>Stats</span>
      </button>
    </nav>
  );
};
