import React, { useState, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { DesktopModeWarning } from './components/DesktopModeWarning';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UIProvider } from './context/UIContext';
import { Header, NavTab } from './components/Header';
import { HomeFeedPage } from './pages/HomeFeedPage';
import { StatisticsPage } from './pages/StatisticsPage';
import { CommunityPage } from './pages/CommunityPage';
import { LoginPage } from './pages/LoginPage';
import { TopProblemsDashboard } from './pages/TopProblemsDashboard';
import { ProblemEntryDashboard } from './pages/ProblemEntryDashboard';
import { LandingPage } from './pages/LandingPage';
import { AboutPage } from './pages/AboutPage';

import { AdminDashboard } from './pages/AdminDashboard';
import { InstitutionDashboard } from './pages/InstitutionDashboard';
import { StudentDashboard } from './pages/StudentDashboard';
import { AdminLayout } from './layouts/AdminLayout';
import { InstitutionLayout } from './layouts/InstitutionLayout';
import { StudentLayout } from './layouts/StudentLayout';
import { NetworkStatusUI } from './components/NetworkStatusUI';

function AdminPortal() {
  const [activeView, setActiveView] = useState('dashboard');
  return (
    <AdminLayout activeView={activeView} setActiveView={setActiveView}>
      <AdminDashboard activeView={activeView} setActiveView={setActiveView} />
    </AdminLayout>
  );
}

function InstitutionPortal() {
  const [activeView, setActiveView] = useState('dashboard');
  return (
    <InstitutionLayout activeView={activeView} setActiveView={setActiveView}>
      <InstitutionDashboard activeView={activeView} setActiveView={setActiveView} />
    </InstitutionLayout>
  );
}

function StudentPortal() {
  const [activeView, setActiveView] = useState('dashboard');
  return (
    <StudentLayout activeView={activeView} setActiveView={setActiveView}>
      <StudentDashboard activeView={activeView} />
    </StudentLayout>
  );
}

export function AppContent() {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const { user, isAuthenticated } = useAuth();
  const hasRouted = useRef(false);
  const [platformSettings, setPlatformSettings] = useState<any>(null);

  useEffect(() => {
    const fetchSettings = () => {
      fetch(`/api/v1/settings?t=${Date.now()}`)
        .then(res => res.ok ? res.json() : null)
        .then(resData => { 
          if (resData) {
            // Unwrap from NestJS interceptor format if it exists
            const actualData = (resData.data !== undefined) ? resData.data : resData;
            setPlatformSettings(actualData);
          }
        })
        .catch(err => console.error('Failed to fetch settings:', err));
    };

    const handleSettingsUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setPlatformSettings(customEvent.detail);
      } else {
        fetchSettings();
      }
    };

    fetchSettings();
    window.addEventListener('platform-settings-updated', handleSettingsUpdate);
    return () => window.removeEventListener('platform-settings-updated', handleSettingsUpdate);
  }, []);

  useEffect(() => {
    const handleNav = (e: any) => setActiveTab(e.detail);
    window.addEventListener('navigate', handleNav);
    return () => window.removeEventListener('navigate', handleNav);
  }, []);

  useEffect(() => {
    if (isAuthenticated && user && !hasRouted.current) {
      hasRouted.current = true;
      if (user.role === 'super_admin' && activeTab !== 'admin-dashboard') {
        setActiveTab('admin-dashboard');
      } else if ((user.role === 'university_admin' || user.role === 'faculty') && activeTab !== 'institution-dashboard') {
        setActiveTab('institution-dashboard');
      } else if (user.role === 'student' && activeTab !== 'student-dashboard') {
        setActiveTab('student-dashboard');
      }
    } else if (!isAuthenticated && ['admin-dashboard', 'institution-dashboard', 'student-dashboard'].includes(activeTab)) {
      setActiveTab('home');
    }
  }, [isAuthenticated, user, activeTab]);

  if (activeTab === 'login') {
    return <LoginPage
      onSuccess={() => {
        if (user?.role === 'super_admin') setActiveTab('admin-dashboard');
        else if (user?.role === 'university_admin' || user?.role === 'faculty') setActiveTab('institution-dashboard');
        else if (user?.role === 'student') setActiveTab('student-dashboard');
        else setActiveTab('home');
      }}
      onBack={() => setActiveTab('home')}
    />;
  }

  if (['admin-dashboard', 'institution-dashboard', 'student-dashboard'].includes(activeTab)) {
    return (
      <div>
        {activeTab === 'admin-dashboard' && <AdminPortal />}
        {activeTab === 'institution-dashboard' && <InstitutionPortal />}
        {activeTab === 'student-dashboard' && <StudentPortal />}
      </div>
    );
  }

  return (
    <div className="app-container" style={{ position: 'relative' }}>
      <DesktopModeWarning />
      {platformSettings?.systemBannerText && (
        <div style={{ background: '#f59e0b', color: '#fff', padding: '12px', textAlign: 'center', fontWeight: 600, fontSize: '14px', position: 'sticky', top: 0, zIndex: 1000 }}>
          {platformSettings.systemBannerText}
        </div>
      )}
      {!['admin-dashboard', 'institution-dashboard', 'student-dashboard', 'login'].includes(activeTab) && (
        <Header activeTab={activeTab} setActiveTab={setActiveTab} platformSettings={platformSettings} />
      )}

      {activeTab === 'home' && <LandingPage onNavigate={(tab) => setActiveTab(tab)} />}

      {activeTab === 'feed' && <HomeFeedPage onNavigateLogin={() => setActiveTab('login')} onNavigateSubmit={() => setActiveTab('submit')} />}

      {activeTab === 'top-problems' && <TopProblemsDashboard />}

      {activeTab === 'submit' && (
        <ProblemEntryDashboard onNavigateLogin={() => setActiveTab('login')} />
      )}



      {activeTab === 'statistics' && <StatisticsPage />}

      {activeTab === 'community' && <CommunityPage platformSettings={platformSettings} />}

      {activeTab === 'admin-dashboard' && <AdminPortal />}
      {activeTab === 'institution-dashboard' && <InstitutionPortal />}
      {activeTab === 'student-dashboard' && <StudentPortal />}

      {activeTab === 'about' && <AboutPage />}

      {/* Floating Plus Button */}
      {(!isAuthenticated && activeTab !== 'about') || (isAuthenticated && ((user?.role === 'citizen' && activeTab !== 'about') || (user?.role !== 'citizen' && activeTab === 'feed'))) ? (
        <button
          onClick={() => setActiveTab('submit')}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'transform 0.2s, background 0.2s',
            zIndex: 1000,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.background = '#1d4ed8';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.background = '#2563eb';
          }}
        >
          <Plus size={28} strokeWidth={2.5} />
        </button>
      ) : null}
    </div>
  );
}

export default function App() {
  return (
    <UIProvider>
      <AuthProvider>
        <NetworkStatusUI />
        <AppContent />
      </AuthProvider>
    </UIProvider>
  );
}
