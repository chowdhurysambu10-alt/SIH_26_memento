import React, { useState, useRef, useEffect, Suspense, lazy } from 'react';
import { Plus } from 'lucide-react';
import { DesktopModeWarning } from './components/DesktopModeWarning';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UIProvider } from './context/UIContext';
import { Header, NavTab } from './components/Header';
import { AdminLayout } from './layouts/AdminLayout';
import { InstitutionLayout } from './layouts/InstitutionLayout';
import { StudentLayout } from './layouts/StudentLayout';
import { NetworkStatusUI } from './components/NetworkStatusUI';
import { MobileBottomNav } from './components/MobileBottomNav';

const HomeFeedPage = lazy(() => import('./pages/HomeFeedPage').then(m => ({ default: m.HomeFeedPage })));
const StatisticsPage = lazy(() => import('./pages/StatisticsPage').then(m => ({ default: m.StatisticsPage })));
const CommunityPage = lazy(() => import('./pages/CommunityPage').then(m => ({ default: m.CommunityPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const TopProblemsDashboard = lazy(() => import('./pages/TopProblemsDashboard').then(m => ({ default: m.TopProblemsDashboard })));
const ProblemEntryDashboard = lazy(() => import('./pages/ProblemEntryDashboard').then(m => ({ default: m.ProblemEntryDashboard })));
const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const AboutPage = lazy(() => import('./pages/AboutPage').then(m => ({ default: m.AboutPage })));

const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const InstitutionDashboard = lazy(() => import('./pages/InstitutionDashboard').then(m => ({ default: m.InstitutionDashboard })));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard').then(m => ({ default: m.StudentDashboard })));

const PageFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
    <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%' }}></div>
  </div>
);

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
  const [activeTab, setActiveTab] = useState<NavTab>(() => {
    const hash = window.location.hash.replace('#', '');
    const validTabs = ['home', 'feed', 'top-problems', 'submit', 'statistics', 'community', 'helpdesk', 'about', 'login', 'admin-dashboard', 'institution-dashboard', 'student-dashboard'];
    return validTabs.includes(hash) ? (hash as NavTab) : 'home';
  });
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

  // Browser Back Button Support
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.tab) {
        setActiveTab(event.state.tab);
      } else {
        const hash = window.location.hash.replace('#', '') as NavTab;
        if (hash) setActiveTab(hash);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const currentTab = window.history.state?.tab;
    if (currentTab !== activeTab) {
      if (!currentTab) {
        window.history.replaceState({ tab: activeTab }, '', `#${activeTab}`);
      } else {
        window.history.pushState({ tab: activeTab }, '', `#${activeTab}`);
      }
    }
  }, [activeTab]);


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
    return (
      <Suspense fallback={<PageFallback />}>
        <LoginPage
          onSuccess={() => {
            if (user?.role === 'super_admin') setActiveTab('admin-dashboard');
            else if (user?.role === 'university_admin' || user?.role === 'faculty') setActiveTab('institution-dashboard');
            else if (user?.role === 'student') setActiveTab('student-dashboard');
            else setActiveTab('home');
          }}
          onBack={() => setActiveTab('home')}
        />
      </Suspense>
    );
  }

  if (['admin-dashboard', 'institution-dashboard', 'student-dashboard'].includes(activeTab)) {
    return (
      <Suspense fallback={<PageFallback />}>
        {activeTab === 'admin-dashboard' && <AdminPortal />}
        {activeTab === 'institution-dashboard' && <InstitutionPortal />}
        {activeTab === 'student-dashboard' && <StudentPortal />}
      </Suspense>
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

      <Suspense fallback={<PageFallback />}>
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
      </Suspense>

      {/* Mobile Bottom Nav (visible on mobile, hidden on desktop via CSS) */}
      {!['admin-dashboard', 'institution-dashboard', 'student-dashboard', 'login'].includes(activeTab) && (
        <MobileBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      )}

      {/* Floating Plus Button - desktop only (.desktop-floating-fab) */}
      {(!isAuthenticated && activeTab !== 'about') || (isAuthenticated && ((user?.role === 'citizen' && activeTab !== 'about') || (user?.role !== 'citizen' && activeTab === 'feed'))) ? (
        <button
          className="desktop-floating-fab"
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
