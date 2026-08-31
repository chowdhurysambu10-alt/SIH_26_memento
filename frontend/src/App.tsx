import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { Header, NavTab } from './components/Header';
import { HomeFeedPage } from './pages/HomeFeedPage';
import { StatisticsPage } from './pages/StatisticsPage';
import { LoginPage } from './pages/LoginPage';
import { TopProblemsDashboard } from './pages/TopProblemsDashboard';
import { ProblemEntryDashboard } from './pages/ProblemEntryDashboard';
import { AiAnalysisDashboard } from './pages/AiAnalysisDashboard';

export function AppContent() {
  const [activeTab, setActiveTab] = useState<NavTab>('feed');

  if (activeTab === 'login') {
    return <LoginPage onSuccess={() => setActiveTab('feed')} />;
  }

  return (
    <div>
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {activeTab === 'feed' && <HomeFeedPage onNavigateLogin={() => setActiveTab('login')} />}

      {activeTab === 'top-problems' && <TopProblemsDashboard />}

      {activeTab === 'submit' && (
        <ProblemEntryDashboard onNavigateLogin={() => setActiveTab('login')} />
      )}

      {activeTab === 'ai-analysis' && <AiAnalysisDashboard />}
      
      {activeTab === 'statistics' && <StatisticsPage />}

      {activeTab === 'about' && (
        <div style={{ maxWidth: '800px', margin: '60px auto', textAlign: 'center', padding: '20px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '12px' }}>About Memento</h2>
          <p style={{ color: '#64748b', fontSize: '15px', lineHeight: 1.7 }}>
            Jharkhand Societal Innovation & Collaboration Platform (SIH 2026 Problem Statement 26043). Powered by Google AI Studio (Gemma 2), local Ollama failover, PostgreSQL Row-Level Security, and automated multi-stakeholder routing.
          </p>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
