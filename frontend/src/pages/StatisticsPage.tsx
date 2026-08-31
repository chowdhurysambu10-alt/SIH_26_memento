import React, { useState, useEffect } from 'react';
import {
  analyticsApi,
  OverviewAnalytics,
  DistrictAnalytics,
  CategoryAnalytics,
} from '../api/analytics';
import { Challenge, challengesApi } from '../api/challenges';
import { useAuth } from '../context/AuthContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export const StatisticsPage: React.FC = () => {
  const { user } = useAuth();
  const [overview, setOverview] = useState<OverviewAnalytics | null>(null);
  const [districts, setDistricts] = useState<DistrictAnalytics[]>([]);
  const [categories, setCategories] = useState<CategoryAnalytics[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        const [overviewRes, distRes, catRes, chalRes] = await Promise.all([
          analyticsApi.getOverview().catch(() => null),
          analyticsApi.getByDistrict().catch(() => []),
          analyticsApi.getByCategory().catch(() => []),
          challengesApi.getChallenges({ limit: 50 }).catch(() => []),
        ]);

        if (overviewRes) setOverview(overviewRes);
        setDistricts(Array.isArray(distRes) ? distRes : []);
        setCategories(Array.isArray(catRes) ? catRes : []);
        setChallenges(Array.isArray(chalRes) ? chalRes : []);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const totalChallenges = overview?.totals?.challenges ?? challenges.length;
  const resolvedChallenges = (overview?.statusBreakdown?.completed || 0) + (overview?.statusBreakdown?.validated || 0);
  const pendingChallenges = Math.max(0, totalChallenges - resolvedChallenges);
  const myChallenges = user ? challenges.filter((c) => c.submitted_by === user.id) : [];

  // Trending problems sorted by priority score
  const trendingProblems = [...challenges]
    .sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0))
    .slice(0, 10);

  // Compute monthly chart data
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const postedByMonth: Record<string, number> = {};
  const solvedByMonth: Record<string, number> = {};

  challenges.forEach((c) => {
    const date = c.created_at ? new Date(c.created_at) : new Date();
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    postedByMonth[key] = (postedByMonth[key] || 0) + 1;
    if (c.status === 'completed' || c.status === 'validated') {
      solvedByMonth[key] = (solvedByMonth[key] || 0) + 1;
    }
  });

  let allMonths = [...new Set(Object.keys(postedByMonth))].sort();
  if (allMonths.length === 0) {
    const currentKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    allMonths = [currentKey];
  }

  const chartLabels = allMonths.map((m) => {
    const [year, month] = m.split('-');
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  });

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Submitted',
        data: allMonths.map((m) => postedByMonth[m] || 0),
        borderColor: '#2563eb',
        backgroundColor: 'transparent',
        borderWidth: 3,
        tension: 0,
        pointRadius: 4,
        pointBackgroundColor: '#2563eb',
      },
      {
        label: 'Resolved',
        data: allMonths.map((m) => solvedByMonth[m] || 0),
        borderColor: '#e97319',
        backgroundColor: 'transparent',
        borderWidth: 3,
        tension: 0,
        pointRadius: 4,
        pointBackgroundColor: '#e97319',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { font: { family: 'Inter', size: 13 }, padding: 16 },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1, font: { family: 'Inter', size: 12 } },
        grid: { color: 'rgba(0,0,0,0.05)' },
      },
      x: {
        ticks: { font: { family: 'Inter', size: 12 } },
        grid: { color: 'rgba(0,0,0,0.03)' },
      },
    },
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 20px 60px' }}>
      <div className="feed-header" style={{ marginBottom: '24px' }}>
        <h2>Analytics Dashboard</h2>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading analytics...</p>
      ) : (
        <div className="statistics-dashboard">
          {/* Overview Stats */}
          <div className="stats-overview">
            <div className="stat-box">
              <h4>Total Challenges</h4>
              <p>{totalChallenges}</p>
            </div>
            <div className="stat-box">
              <h4>Resolved</h4>
              <p style={{ color: '#16a34a' }}>{resolvedChallenges}</p>
            </div>
            <div className="stat-box">
              <h4>Under Action</h4>
              <p style={{ color: '#eab308' }}>{pendingChallenges}</p>
            </div>
            {user && (
              <div className="stat-box" style={{ background: '#eff6ff', borderColor: '#bfdbfe' }}>
                <h4>My Posts</h4>
                <p style={{ color: '#2563eb' }}>{myChallenges.length}</p>
              </div>
            )}
          </div>

          {/* Left Column: Districts & Categories */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="stats-card">
              <h3>Challenges by District</h3>
              {districts.length > 0 ? (
                districts.map((d, i) => (
                  <div key={i} className="stat-row">
                    <span>{d.district || 'Unspecified'}</span>
                    <span style={{ fontWeight: 600 }}>{d.total ?? 0}</span>
                  </div>
                ))
              ) : (
                <p style={{ color: '#64748b', fontSize: '14px' }}>No district records found.</p>
              )}
            </div>

            <div className="stats-card">
              <h3>Challenges by Category</h3>
              {categories.length > 0 ? (
                categories.map((c, i) => (
                  <div key={i} className="stat-row">
                    <span>{c.name || 'General'}</span>
                    <span style={{ fontWeight: 600 }}>{c.total ?? 0}</span>
                  </div>
                ))
              ) : (
                <p style={{ color: '#64748b', fontSize: '14px' }}>No category records found.</p>
              )}
            </div>
          </div>

          {/* Right Column: Trending & Chart */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="stats-card">
              <h3>Trending / High Priority Challenges</h3>
              {trendingProblems.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {trendingProblems.map((p) => (
                    <div key={p.id} style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                        <span className="tag tag-hot">
                          Priority: {p.priority_score ? Number(p.priority_score).toFixed(1) : 'Normal'}
                        </span>
                        <span style={{ color: '#64748b', fontWeight: 500 }}>
                          {(p.status || 'SUBMITTED').replace('_', ' ').toUpperCase()} • {p.district}
                        </span>
                      </div>
                      <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', margin: '4px 0' }}>{p.title}</h4>
                      <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                        {p.description && p.description.length > 90 ? p.description.substring(0, 90) + '...' : p.description}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#64748b', fontSize: '14px' }}>No trending challenges yet.</p>
              )}
            </div>

            <div className="stats-card" style={{ height: '320px' }}>
              <h3>Submissions vs Resolved</h3>
              <div style={{ height: '220px' }}>
                <Line data={chartData} options={chartOptions} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
