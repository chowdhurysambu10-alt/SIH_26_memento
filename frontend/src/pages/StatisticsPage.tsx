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
import { Edit, Trash2, Save, XCircle } from 'lucide-react';

const MyPostedProblemItem: React.FC<{ challenge: Challenge }> = ({ challenge }) => {
  const [isDeleted, setIsDeleted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const [currentTitle, setCurrentTitle] = useState(challenge.title || 'Untitled Challenge');
  const [currentDescription, setCurrentDescription] = useState(challenge.description || '');
  
  const [editTitle, setEditTitle] = useState(currentTitle);
  const [editDescription, setEditDescription] = useState(currentDescription);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this challenge? This action cannot be undone.')) return;
    try {
      await challengesApi.deleteChallenge(challenge.id);
      setIsDeleted(true);
    } catch (err) {
      alert('Failed to delete challenge.');
    }
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim() || !editDescription.trim()) {
      alert('Title and description cannot be empty.');
      return;
    }
    setIsSaving(true);
    try {
      await challengesApi.updateChallenge(challenge.id, { title: editTitle, description: editDescription });
      setCurrentTitle(editTitle);
      setCurrentDescription(editDescription);
      setIsEditing(false);
    } catch (err) {
      alert('Failed to update challenge.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isDeleted) return null;

  return (
    <div 
      style={{ padding: '16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', transition: 'all 0.2s' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#2563eb', background: '#eff6ff', padding: '4px 8px', borderRadius: '4px' }}>
            {(challenge.status || 'SUBMITTED').replace('_', ' ').toUpperCase()}
          </span>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px' }}>
            {challenge.district}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', color: '#64748b' }}>
            {new Date(challenge.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>
      
      {isEditing ? (
        <div style={{ marginBottom: '16px', marginTop: '12px' }}>
          <input
            className="input-field"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            style={{ fontWeight: 700, fontSize: '16px', marginBottom: '8px' }}
          />
          <textarea
            className="input-field"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            rows={4}
            style={{ fontSize: '14px', lineHeight: 1.6 }}
          />
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-outline"
              style={{ padding: '6px 12px', fontSize: '13px', color: '#64748b' }}
              onClick={() => setIsEditing(false)}
              disabled={isSaving}
            >
              <XCircle size={15} /> Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              style={{ padding: '6px 12px', fontSize: '13px' }}
              onClick={handleSaveEdit}
              disabled={isSaving}
            >
              <Save size={15} /> {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      ) : (
        <>
          <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>{currentTitle}</h4>
          <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: '0' }}>
            {currentDescription}
          </p>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '12px' }}>
            <div>
              {challenge.ai_summary && (
                <div style={{ marginBottom: '8px', padding: '10px', background: '#ffffff', borderRadius: '6px', borderLeft: '3px solid #2563eb', fontSize: '13px', color: '#334155' }}>
                  <strong>AI Analysis: </strong> {challenge.ai_summary}
                </div>
              )}
              {challenge.institutions?.name && (
                <div style={{ fontSize: '13px', color: '#065f46', background: '#ecfdf5', padding: '6px 10px', borderRadius: '6px', display: 'inline-block' }}>
                  <strong>Nearest Institution: </strong> {challenge.institutions.name}
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0, opacity: isHovered ? 1 : 0, pointerEvents: isHovered ? 'auto' : 'none', transition: 'opacity 0.2s' }}>
              <button
                type="button"
                className="interaction-btn"
                style={{ color: '#2563eb' }}
                onClick={() => setIsEditing(true)}
              >
                <Edit size={15} />
                <span>Edit</span>
              </button>
              <button
                type="button"
                className="interaction-btn"
                style={{ color: '#ef4444' }}
                onClick={handleDelete}
              >
                <Trash2 size={15} />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface StatisticsPageProps {
  hideMyProblems?: boolean;
}

export const StatisticsPage: React.FC<StatisticsPageProps> = ({ hideMyProblems = false }) => {
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

  // Trending problems sorted by support count (greater than 0)
  const trendingProblems = challenges
    .filter((c) => (c.support_count || 0) > 0)
    .sort((a, b) => (b.support_count || 0) - (a.support_count || 0))
    .slice(0, 5);

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
        borderColor: '#16a34a',
        backgroundColor: 'transparent',
        borderWidth: 3,
        tension: 0,
        pointRadius: 4,
        pointBackgroundColor: '#16a34a',
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
            {user && !hideMyProblems && (
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
              <div className="stats-card-content">
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
            </div>

            <div className="stats-card">
              <h3>Challenges by Category</h3>
              <div className="stats-card-content">
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
          </div>

          {/* Right Column: Trending & Chart */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="stats-card">
              <h3>Trending / Most Supported Challenges</h3>
              <div className="stats-card-content" style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '8px' }}>
                {trendingProblems.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {trendingProblems.map((p) => (
                      <div key={p.id} style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>

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
            </div>

            <div className="stats-card" style={{ height: '320px' }}>
              <h3>Submissions vs Resolved</h3>
              <div className="stats-card-content" style={{ overflow: 'hidden' }}>
                <div style={{ height: '100%' }}>
                  <Line data={chartData} options={chartOptions} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* My Problems Section */}
      {!loading && user && !hideMyProblems && (
        <div className="stats-card" style={{ marginTop: '24px' }}>
          <h3>My Posted Problems</h3>
          <div className="stats-card-content">
            {myChallenges.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {myChallenges.map((c) => (
                  <MyPostedProblemItem key={c.id} challenge={c} />
                ))}
              </div>
            ) : (
              <p style={{ color: '#64748b', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>
                You haven't posted any problems yet.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
