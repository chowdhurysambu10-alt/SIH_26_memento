import React, { useState, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header, NavTab } from './components/Header';
import { HomeFeedPage } from './pages/HomeFeedPage';
import { StatisticsPage } from './pages/StatisticsPage';
import { CommunityPage } from './pages/CommunityPage';
import { LoginPage } from './pages/LoginPage';
import { TopProblemsDashboard } from './pages/TopProblemsDashboard';
import { ProblemEntryDashboard } from './pages/ProblemEntryDashboard';

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
      <InstitutionDashboard activeView={activeView} />
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
  const [activeTab, setActiveTab] = useState<NavTab>('feed');
  const { user, isAuthenticated } = useAuth();
  const hasRouted = useRef(false);

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
      setActiveTab('feed');
    }
  }, [isAuthenticated, user, activeTab]);

  if (activeTab === 'login') {
    return <LoginPage 
      onSuccess={() => {
        if (user?.role === 'super_admin') setActiveTab('admin-dashboard');
        else if (user?.role === 'university_admin' || user?.role === 'faculty') setActiveTab('institution-dashboard');
        else if (user?.role === 'student') setActiveTab('student-dashboard');
        else setActiveTab('feed');
      }} 
      onBack={() => setActiveTab('feed')}
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
    <div>
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {activeTab === 'feed' && <HomeFeedPage onNavigateLogin={() => setActiveTab('login')} onNavigateSubmit={() => setActiveTab('submit')} />}

      {activeTab === 'top-problems' && <TopProblemsDashboard />}

      {activeTab === 'submit' && (
        <ProblemEntryDashboard onNavigateLogin={() => setActiveTab('login')} />
      )}


      
      {activeTab === 'statistics' && <StatisticsPage />}

      {activeTab === 'community' && <CommunityPage />}

      {activeTab === 'admin-dashboard' && <AdminPortal />}
      {activeTab === 'institution-dashboard' && <InstitutionPortal />}
      {activeTab === 'student-dashboard' && <StudentPortal />}

      {activeTab === 'about' && (
        <div style={{ maxWidth: '800px', margin: '60px auto', textAlign: 'center', padding: '20px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '12px' }}>About Memento</h2>
          <p style={{ color: '#64748b', fontSize: '15px', lineHeight: 1.7 }}>
            Jharkhand Societal Innovation & Collaboration Platform (SIH 2026 Problem Statement 26043). Powered by Google AI Studio (Gemma 2), PostgreSQL Row-Level Security, and automated multi-stakeholder routing.
          </p>
        </div>
      )}

      {/* Floating Plus Button */}
      {isAuthenticated && ((user?.role === 'citizen' && activeTab !== 'about') || (user?.role !== 'citizen' && activeTab === 'feed')) && (
        <button
          onClick={() => setActiveTab('submit')}
          style={{
            position: 'fixed',
            bottom: '40px',
            right: '40px',
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
            zIndex: 100,
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
      )}
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
