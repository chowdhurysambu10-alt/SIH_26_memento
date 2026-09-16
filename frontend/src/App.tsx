import React, { useState, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header, NavTab } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HomeFeedPage } from './pages/HomeFeedPage';
import { StatisticsPage } from './pages/StatisticsPage';
import { CommunityPage } from './pages/CommunityPage';
import { LoginPage } from './pages/LoginPage';
import { TopProblemsDashboard } from './pages/TopProblemsDashboard';
import { ProblemEntryDashboard } from './pages/ProblemEntryDashboard';
import { LandingPage } from './pages/LandingPage';

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
    const apiBase = import.meta.env.VITE_API_BASE_URL || '/api/v1';
    fetch(`${apiBase}/settings`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setPlatformSettings(data))
      .catch(() => {});
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
      } else if (
        (user.role === 'university_admin' || user.role === 'faculty') &&
        activeTab !== 'institution-dashboard'
      ) {
        setActiveTab('institution-dashboard');
      } else if (user.role === 'student' && activeTab !== 'student-dashboard') {
        setActiveTab('student-dashboard');
      }
    } else if (
      !isAuthenticated &&
      ['admin-dashboard', 'institution-dashboard', 'student-dashboard'].includes(activeTab)
    ) {
      setActiveTab('home');
    }
  }, [isAuthenticated, user, activeTab]);

  if (activeTab === 'login') {
    return (
      <LoginPage
        onSuccess={() => {
          if (user?.role === 'super_admin') setActiveTab('admin-dashboard');
          else if (user?.role === 'university_admin' || user?.role === 'faculty')
            setActiveTab('institution-dashboard');
          else if (user?.role === 'student') setActiveTab('student-dashboard');
          else setActiveTab('home');
        }}
        onBack={() => setActiveTab('home')}
      />
    );
  }

  if (['admin-dashboard', 'institution-dashboard', 'student-dashboard'].includes(activeTab)) {
    return (
      <div className="portal-root-wrapper">
        {activeTab === 'admin-dashboard' && <AdminPortal />}
        {activeTab === 'institution-dashboard' && <InstitutionPortal />}
        {activeTab === 'student-dashboard' && <StudentPortal />}
      </div>
    );
  }

  return (
    <div className="app-shell">
      {platformSettings?.systemBannerText && (
        <div className="system-top-banner">
          {platformSettings.systemBannerText}
        </div>
      )}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        platformSettings={platformSettings}
      />

      <div className="page-content-wrapper">
        {activeTab === 'home' && <LandingPage onNavigate={(tab) => setActiveTab(tab)} />}

        {activeTab === 'feed' && (
          <HomeFeedPage
            onNavigateLogin={() => setActiveTab('login')}
            onNavigateSubmit={() => setActiveTab('submit')}
          />
        )}

        {activeTab === 'top-problems' && <TopProblemsDashboard />}

        {activeTab === 'submit' && (
          <ProblemEntryDashboard onNavigateLogin={() => setActiveTab('login')} />
        )}

        {activeTab === 'statistics' && <StatisticsPage />}

        {activeTab === 'community' && <CommunityPage />}

        {activeTab === 'about' && (
          <div className="about-page-container">
            <h2>About Memento</h2>
            <p>
              Jharkhand Societal Innovation & Collaboration Platform (SIH 2026 Problem Statement
              26043). Powered by Google AI Studio (Gemma 2), PostgreSQL Row-Level Security, and
              automated multi-stakeholder routing.
            </p>
          </div>
        )}
      </div>

      {/* Floating Action Button for Desktop / Tablet */}
      {isAuthenticated &&
        ((user?.role === 'citizen' && activeTab !== 'about' && activeTab !== 'submit') ||
          (user?.role !== 'citizen' && activeTab === 'feed')) && (
          <button
            className="floating-action-fab desktop-only-fab"
            onClick={() => setActiveTab('submit')}
            aria-label="Submit new problem"
          >
            <Plus size={26} strokeWidth={2.5} />
          </button>
        )}

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NetworkStatusUI />
      <AppContent />
    </AuthProvider>
  );
}
