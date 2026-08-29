import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { PersonaSwitcher } from './components/layout/PersonaSwitcher';
import { NotificationDrawer } from './components/layout/NotificationDrawer';
import { ToastContainer } from './components/layout/ToastContainer';
import { Footer } from './components/layout/Footer';

// Pages
import { HomePage } from './pages/HomePage';
import { CitizenDashboard } from './pages/CitizenDashboard';
import { PanchayatDashboard } from './pages/PanchayatDashboard';
import { UniversityDashboard } from './pages/UniversityDashboard';
import { StudentDashboard } from './pages/StudentDashboard';
import { IndustryDashboard } from './pages/IndustryDashboard';
import { GovtDashboard } from './pages/GovtDashboard';
import { SuperAdminDashboard } from './pages/SuperAdminDashboard';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ChallengeForm } from './components/challenges/ChallengeForm';

export const App: React.FC = () => {
  const { role } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>('home');

  const renderPageContent = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={setCurrentPage} />;
      case 'citizen':
        return <CitizenDashboard onNavigate={setCurrentPage} />;
      case 'citizen-new':
        return (
          <div className="container" style={{ padding: '2.5rem 1.5rem 4rem' }}>
            <ChallengeForm
              onSuccess={() => setCurrentPage('citizen')}
              onCancel={() => setCurrentPage('home')}
            />
          </div>
        );
      case 'panchayat':
        return <PanchayatDashboard />;
      case 'university':
        return <UniversityDashboard />;
      case 'student':
        return <StudentDashboard />;
      case 'industry':
        return <IndustryDashboard />;
      case 'govt':
        return <GovtDashboard />;
      case 'admin':
        return <SuperAdminDashboard />;
      case 'login':
        return <LoginPage onNavigate={setCurrentPage} />;
      case 'signup':
        return <SignupPage onNavigate={setCurrentPage} />;
      default:
        return <HomePage onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 1. Top interactive role demo switcher bar */}
      <PersonaSwitcher />

      {/* 2. Main Navigation Bar */}
      <Navbar onNavigate={setCurrentPage} currentPage={currentPage} />

      {/* 3. Dynamic Page View */}
      <main style={{ flex: 1 }}>{renderPageContent()}</main>

      {/* 4. Global Notification Drawer */}
      <NotificationDrawer />

      {/* 5. Floating Toast Container */}
      <ToastContainer />

      {/* 6. Footer */}
      <Footer />
    </div>
  );
};

export default App;
