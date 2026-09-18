import React, { useState, useEffect } from 'react';
import { analyticsApi, OverviewAnalytics } from '../api/analytics';
import { Challenge, challengesApi } from '../api/challenges';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { Trash2, FileText, MapPin, CheckCircle2, Navigation, Check, TrendingUp, AlertTriangle, BarChart3, Clock, Edit, Eye } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement);

interface StatisticsPageProps {
  hideMyProblems?: boolean;
}

export const StatisticsPage: React.FC<StatisticsPageProps> = ({ hideMyProblems = false }) => {
  const { user } = useAuth();
  const { showAlert, showConfirm, setGlobalLoading } = useUI();
  const [overview, setOverview] = useState<OverviewAnalytics | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [activeTab, setActiveTab] = useState('Overview');

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        const [overviewRes, chalRes] = await Promise.all([
          analyticsApi.getOverview().catch(() => null),
          challengesApi.getChallenges({ limit: 100 }).catch(() => []),
        ]);
        
        if (overviewRes) setOverview(overviewRes);

        const fetchedChallenges = Array.isArray(chalRes) ? chalRes : [];
        setChallenges(fetchedChallenges);
        
        const watchlistIds = JSON.parse(localStorage.getItem('civic_watchlist') || '[]');
        const userChals = fetchedChallenges.filter(c => (user && c.submitted_by === user.id) || watchlistIds.includes(c.id));
        if (userChals.length > 0) setSelectedChallenge(hideMyProblems ? fetchedChallenges[0] : userChals[0]);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, [user, hideMyProblems]);

  const handleDelete = async (id: string) => {
    if (!(await showConfirm('Are you sure you want to withdraw this issue?'))) return;
    setGlobalLoading(true);
    try {
      await challengesApi.deleteChallenge(id);
      setChallenges(prev => prev.filter(c => c.id !== id));
      if (selectedChallenge?.id === id) setSelectedChallenge(null);
      showAlert('Issue withdrawn successfully', 'success');
    } catch (err: any) {
      showAlert(err.message || 'Failed to withdraw issue.', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  const watchlistIds = JSON.parse(localStorage.getItem('civic_watchlist') || '[]');
  const myChallenges = challenges.filter((c) => (user && c.submitted_by === user.id) || watchlistIds.includes(c.id));
  
  // Custom metrics for the citizen
  const myTotal = myChallenges.length;
  const myResolved = myChallenges.filter(c => ['completed', 'validated'].includes(c.status)).length;
  const myActive = myChallenges.filter(c => !['completed', 'validated'].includes(c.status)).length;
  const resolutionRate = myTotal > 0 ? Math.round((myResolved / myTotal) * 100) : 0;
  const myPendingReview = myChallenges.filter(c => ['submitted', 'under_review'].includes(c.status)).length;

  // Chart data: Monthly issues (last 6 months)
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentMonth = new Date().getMonth();
  const last6Months = Array.from({length: 6}, (_, i) => {
    let d = new Date();
    d.setMonth(currentMonth - 5 + i);
    return monthNames[d.getMonth()];
  });

  const submittedData = [0, 0, 0, 0, 0, 0];
  const resolvedData = [0, 0, 0, 0, 0, 0];
  
  myChallenges.forEach(c => {
    const d = new Date(c.created_at);
    const m = monthNames[d.getMonth()];
    const idx = last6Months.indexOf(m);
    if (idx !== -1) {
      submittedData[idx]++;
      if (['completed', 'validated'].includes(c.status)) {
        resolvedData[idx]++;
      }
    }
  });

  const lineChartData = {
    labels: last6Months,
    datasets: [
      {
        label: 'Issues Reported',
        data: submittedData,
        borderColor: '#ea580c',
        backgroundColor: 'rgba(234, 88, 12, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Issues Resolved',
        data: resolvedData,
        borderColor: '#16a34a',
        backgroundColor: 'rgba(22, 163, 74, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
    },
    scales: {
      y: { beginAtZero: true, ticks: { precision: 0 } }
    }
  };

  // Status breakdown for Doughnut chart
  const statusCounts = {
    'Pending Review': myChallenges.filter(c => ['submitted', 'under_review'].includes(c.status)).length,
    'Assigned to Dept': myChallenges.filter(c => ['routed', 'team_formed'].includes(c.status)).length,
    'In Progress': myChallenges.filter(c => c.status === 'in_progress').length,
    'Resolved': myChallenges.filter(c => ['completed', 'validated'].includes(c.status)).length,
  };

  const doughnutData = {
    labels: Object.keys(statusCounts),
    datasets: [
      {
        data: Object.values(statusCounts),
        backgroundColor: ['#f59e0b', '#3b82f6', '#8b5cf6', '#10b981'],
        borderWidth: 0,
      }
    ]
  };

  if (loading) {
    return <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>Loading your civic dashboard...</div>;
  }

  // Filter list based on tab
  const displayChallenges = myChallenges.filter(c => {
    if (activeTab === 'Active Issues') return !['completed', 'validated'].includes(c.status);
    if (activeTab === 'Resolved') return ['completed', 'validated'].includes(c.status);
    return true; // Overview shows all
  });

  const getStatusColor = (status: string) => {
    if (['completed', 'validated'].includes(status)) return 'success';
    if (status === 'submitted') return '';
    return 'active';
  };

  const renderTimeline = (challenge: Challenge) => {
    const s = challenge.status || 'submitted';
    
    // Status hierarchy to determine if a stage is active (past/present)
    const statusOrder = ['submitted', 'under_review', 'routed', 'team_formed', 'in_progress', 'completed', 'validated'];
    const currentIndex = statusOrder.indexOf(s) !== -1 ? statusOrder.indexOf(s) : 0;

    const steps = [
      { label: 'Issue Submitted', desc: new Date(challenge.created_at).toLocaleDateString(), active: currentIndex >= 0, current: s === 'submitted' },
      { label: 'Under Review', desc: 'Admin is reviewing your issue', active: currentIndex >= 1, current: s === 'under_review' },
      { label: 'Forwarded to Department', desc: challenge.institutions?.name || 'Routed to correct authorities', active: currentIndex >= 2, current: s === 'routed' },
      { label: 'Team Assigned', desc: 'Field team has been formed', active: currentIndex >= 3, current: s === 'team_formed' },
      { label: 'Work In Progress', desc: 'Team is actively resolving', active: currentIndex >= 4, current: s === 'in_progress' },
      { label: 'Resolution Submitted', desc: 'Awaiting validation', active: currentIndex >= 5, current: s === 'completed' },
      { label: 'Validated & Closed', desc: 'Issue has been fixed', active: currentIndex >= 6, current: s === 'validated' },
    ];

    return (
      <div className="status-timeline">
        <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '20px' }}>Resolution Tracker</h3>
        {steps.map((step, idx) => (
          <div key={idx} className="timeline-step" style={{ paddingBottom: '16px' }}>
            <div className={`timeline-icon ${step.active && !step.current ? 'completed' : ''} ${step.current ? 'current' : ''}`}>
              {step.active && !step.current ? <Check size={14} /> : <div style={{ width: 8, height: 8, borderRadius: '50%', background: step.current ? '#2563eb' : '#cbd5e1' }} />}
            </div>
            <div className="timeline-content">
              <h4>{step.label}</h4>
              <p>{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="light-dashboard">
      <div className="light-header-row">
        <h1>My Civic Dashboard</h1>

      </div>



      {/* Top Metrics Grid (Data Rich) */}
      <div className="light-metrics-grid">
        <div className="light-metric-card">
          <span className="light-metric-label"><BarChart3 size={16} style={{display:'inline', verticalAlign:'bottom', marginRight: '4px'}}/> Total Tracked</span>
          <span className="light-metric-value">{myTotal}</span>
        </div>
        
        <div className="light-metric-card">
          <span className="light-metric-label"><AlertTriangle size={16} style={{display:'inline', verticalAlign:'bottom', marginRight: '4px'}}/> Active Issues</span>
          <span className="light-metric-value" style={{ color: '#ea580c' }}>{myActive}</span>
        </div>
        
        <div className="light-metric-card">
          <span className="light-metric-label"><TrendingUp size={16} style={{display:'inline', verticalAlign:'bottom', marginRight: '4px'}}/> Resolution Rate</span>
          <span className="light-metric-value" style={{ color: '#16a34a' }}>{resolutionRate}%</span>
        </div>

        <div className="light-metric-card">
          <span className="light-metric-label"><Clock size={16} style={{display:'inline', verticalAlign:'bottom', marginRight: '4px'}}/> Pending Review</span>
          <span className="light-metric-value" style={{ fontSize: '24px', marginTop: '10px', color: '#f59e0b' }}>{myPendingReview} <span style={{fontSize:'14px', color:'#64748b'}}>issues</span></span>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="light-charts-grid">
        <div className="light-chart-card">
          <h3>Activity Trend (Last 6 Months)</h3>
          <div style={{ height: '240px' }}>
            <Line data={lineChartData} options={lineChartOptions as any} />
          </div>
        </div>
        <div className="light-chart-card">
          <h3>Issue Status Breakdown</h3>
          <div style={{ height: '200px', display: 'flex', justifyContent: 'center' }}>
            {myTotal > 0 ? <Doughnut data={doughnutData} options={{ maintainAspectRatio: false }} /> : <p style={{color: '#64748b', alignSelf:'center'}}>No data available.</p>}
          </div>
        </div>
      </div>

      {/* Master-Detail View */}
      <div className="light-split-layout">
        
        {/* Left List */}
        <div className="light-list-container">
          <div className="light-list-header">
            {activeTab} ({displayChallenges.length})
          </div>
          
          {displayChallenges.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {displayChallenges.map(c => {
                const isSelected = selectedChallenge?.id === c.id;
                const statusColor = getStatusColor(c.status);
                
                return (
                  <div 
                    key={c.id} 
                    className={`light-list-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedChallenge(c)}
                  >
                    <div className="light-item-main">
                      <div className="light-item-icon" style={{ background: (watchlistIds.includes(c.id) && c.submitted_by !== user?.id) ? '#f3e8ff' : '#eff6ff', color: (watchlistIds.includes(c.id) && c.submitted_by !== user?.id) ? '#9333ea' : 'var(--light-primary)' }}>
                        {(watchlistIds.includes(c.id) && c.submitted_by !== user?.id) ? <Eye size={20} /> : <FileText size={20} />}
                      </div>
                      <div>
                        <div className="light-item-title">
                          {c.title.length > 30 ? c.title.substring(0, 30) + '...' : c.title}
                        </div>
                        <div className="light-item-sub">
                          {new Date(c.created_at).toLocaleDateString()} • {c.district}
                        </div>
                      </div>
                    </div>
                    
                    <div className={`light-item-status ${statusColor}`}>
                      {(c.status || 'SUBMITTED').replace('_', ' ').toUpperCase()}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: '60px 0', textAlign: 'center', color: '#94a3b8' }}>
              <CheckCircle2 size={40} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
              <p>No issues found in this category.</p>
            </div>
          )}
        </div>

        {/* Right Detail Pane */}
        {selectedChallenge ? (
          <div className="light-detail-pane">
            <div className="light-detail-header" style={{ marginBottom: 0 }}>
              <div className="light-detail-id">Issue #{selectedChallenge.id.substring(0, 8)}</div>
            </div>

            {/* Tracker Timeline - purely tracking like Flipkart */}
            {renderTimeline(selectedChallenge)}

            <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
              <button 
                className="light-action-btn" 
                style={{ flex: 1, background: '#ffffff', border: '1px solid #3b82f6', color: '#3b82f6', boxShadow: 'none' }}
                onClick={() => showAlert('Edit functionality coming soon!', 'info')}
              >
                <Edit size={18} /> Edit Issue
              </button>
              
              <button 
                className="light-action-btn" 
                style={{ flex: 1, background: '#ffffff', border: '1px solid #ef4444', color: '#ef4444', boxShadow: 'none' }}
                onClick={() => handleDelete(selectedChallenge.id)}
              >
                <Trash2 size={18} /> Withdraw
              </button>
            </div>
          </div>
        ) : (
          <div className="light-detail-pane" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
            <div style={{ color: 'var(--light-text-muted)', textAlign: 'center' }}>
              <Navigation size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
              <p>Select an issue to track its status</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
