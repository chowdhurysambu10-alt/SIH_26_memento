import React, { useState, useEffect, useRef } from 'react';
import { dashboardsApi, DashboardChallenge } from '../api/dashboards';
import { useAuth } from '../context/AuthContext';
import {
  Send,
  Building,
  UploadCloud,
  CheckCircle,
  Sparkles,
  MapPin,
  Tag,
  AlertCircle,
  Clock,
  Check,
  X,
  Camera,
  Image as ImageIcon,
} from 'lucide-react';

const DISTRICTS = [
  'Ranchi',
  'Dhanbad',
  'East Singhbhum (Jamshedpur)',
  'Bokaro',
  'Hazaribagh',
  'Deoghar',
  'Dumka',
  'Giridih',
  'Palamu',
  'Ramgarh',
];

const CATEGORIES = [
  'Let AI Automatically Classify',
  'Water & Sanitation',
  'Healthcare',
  'Education',
  'Agriculture',
  'Urban Infrastructure',
  'Environment & Forestry',
  'Clean Energy',
  'Rural Livelihoods',
  'Accessibility & Inclusion',
  'Public Administration',
];

export const ProblemEntryDashboard: React.FC<{ initialTab?: 'submit' | 'claim'; onNavigateLogin: () => void }> = ({
  initialTab = 'submit',
  onNavigateLogin,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'submit' | 'claim'>(initialTab);

  // Submission Form State
  const [title, setTitle] = useState('');
  const [district, setDistrict] = useState('Ranchi');
  const [category, setCategory] = useState('Let AI Automatically Classify');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<any>(null);
  const [error, setError] = useState('');

  // Claim State
  const [claimableList, setClaimableList] = useState<DashboardChallenge[]>([]);
  const [loadingClaims, setLoadingClaims] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [readMoreChallenge, setReadMoreChallenge] = useState<DashboardChallenge | null>(null);
  const [showMediaOptions, setShowMediaOptions] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputCameraRef = useRef<HTMLInputElement>(null);

  const fetchClaims = async () => {
    setLoadingClaims(true);
    try {
      const data = await dashboardsApi.getClaimableChallenges();
      setClaimableList(data);
    } catch (err) {
      console.error('Failed to fetch claimable challenges:', err);
    } finally {
      setLoadingClaims(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'claim') {
      fetchClaims();
    }
  }, [activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert('Please sign in to submit a problem.');
      onNavigateLogin();
      return;
    }

    if (!title.trim() || !description.trim()) {
      setError('Please provide a challenge title and description.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSubmitSuccess(null);

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('district', district);
      formData.append('description', description.trim());
      if (category !== 'Let AI Automatically Classify') {
        formData.append('category', category);
      }
      if (files.length > 0) {
        formData.append('file', files[0]);
      }

      const res = await dashboardsApi.submitProblem(formData);
      setSubmitSuccess(res);
      // Reset form
      setTitle('');
      setDescription('');
      setFiles([]);
    } catch (err: any) {
      setError(err.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClaim = async (challengeId: string) => {
    if (!isAuthenticated) {
      alert('Please sign in with an Institutional or Organization account to claim challenges.');
      onNavigateLogin();
      return;
    }

    setClaimingId(challengeId);
    try {
      await dashboardsApi.claimChallenge(challengeId, user?.org_id || undefined);
      alert('Challenge successfully claimed! Status updated to Under Action.');
      fetchClaims();
    } catch (err: any) {
      alert('Failed to claim: ' + err.message);
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px 20px 80px' }}>
      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '28px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
        <button
          className={`btn ${activeTab === 'submit' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('submit')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
        >
          <Send size={16} /> Citizen Problem Entry
        </button>

        <button
          className={`btn ${activeTab === 'claim' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('claim')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
        >
          <Building size={16} /> Institutional Claim Portal
        </button>
      </div>

      {/* Tab 1: Submit Form */}
      {activeTab === 'submit' && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>Submit a Societal Challenge</h2>
            <p style={{ color: '#64748b', fontSize: '14.5px', marginTop: '4px' }}>
              Report local civic, environmental, agricultural, or infrastructure challenges. Powered by automated AI classification & routing.
            </p>
          </div>

          {error && (
            <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {submitSuccess && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#15803d', fontWeight: 700, fontSize: '16px', marginBottom: '8px' }}>
                <CheckCircle size={20} /> Challenge Submitted & AI Classified!
              </div>
              <p style={{ fontSize: '14px', color: '#166534', margin: '0 0 10px' }}>
                Your problem has been routed to university innovation labs across Jharkhand.
              </p>
              {submitSuccess.category && (
                <div style={{ display: 'flex', gap: '10px', fontSize: '13px' }}>
                  <span className="tag tag-category">Category: {submitSuccess.category}</span>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="p-title">Challenge Title *</label>
              <input
                id="p-title"
                type="text"
                className="input-field"
                placeholder="e.g. Arsenic Contamination in Borewell Water Supply"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label className="form-label">District *</label>
                <select value={district} onChange={(e) => setDistrict(e.target.value)}>
                  {DISTRICTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Category (Optional)</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="p-desc">Detailed Description *</label>
              <textarea
                id="p-desc"
                rows={4}
                placeholder="Describe the affected community, symptoms, severity, and any existing measures taken..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label">Evidence Media (Photo/Video)</label>
              {files.length > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <span style={{ fontSize: '14px', color: '#0f172a', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {files[0].name}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setFiles([]);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    title="Remove file"
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <div
                    className="upload-area"
                    onClick={() => setShowMediaOptions(true)}
                  >
                    <UploadCloud size={24} style={{ margin: '0 auto 8px', color: '#2563eb' }} />
                    <span style={{ fontSize: '14px', color: '#64748b' }}>
                      Click to select media file
                    </span>
                  </div>
                  {showMediaOptions && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      marginTop: '8px',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                      zIndex: 1000,
                      width: '240px',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column'
                    }}>
                      <button
                        type="button"
                        onClick={() => {
                          setShowMediaOptions(false);
                          fileInputCameraRef.current?.click();
                        }}
                        style={{ padding: '14px 16px', background: 'none', border: 'none', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px', color: '#0f172a', fontWeight: 500, cursor: 'pointer', textAlign: 'left' }}
                      >
                        <Camera size={18} color="#2563eb" /> Take a Photo/Video
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowMediaOptions(false);
                          fileInputRef.current?.click();
                        }}
                        style={{ padding: '14px 16px', background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px', color: '#0f172a', fontWeight: 500, cursor: 'pointer', textAlign: 'left' }}
                      >
                        <ImageIcon size={18} color="#2563eb" /> Choose from Gallery
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowMediaOptions(false)}
                        style={{ padding: '10px 16px', background: '#f8fafc', border: 'none', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: '#64748b', cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*,video/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) setFiles([e.target.files[0]]);
                }}
              />
              <input
                type="file"
                ref={fileInputCameraRef}
                accept="image/*,video/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) setFiles([e.target.files[0]]);
                }}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary w-100"
              style={{ padding: '14px', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {submitting ? (
                <>
                  <Sparkles size={18} className="animate-spin" /> Analyzing & Submitting with AI...
                </>
              ) : (
                <>
                  <Send size={18} /> Submit Challenge to Platform
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Tab 2: Organization Claim View */}
      {activeTab === 'claim' && (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>Available Challenges for R&D Claim</h2>
            <p style={{ color: '#64748b', fontSize: '14.5px', marginTop: '4px' }}>
              University research teams and industry innovation partners can adopt local problems to build technology solutions.
            </p>
          </div>

          {loadingClaims ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
              <Clock size={32} className="animate-spin" style={{ margin: '0 auto 12px', color: '#2563eb' }} />
              <p>Loading claimable challenges...</p>
            </div>
          ) : claimableList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
              <p style={{ color: '#64748b', fontSize: '15px' }}>No unassigned challenges currently awaiting claims.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {claimableList.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '24px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '20px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ flex: 1, minWidth: '280px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                      <span className="tag tag-new">
                        <MapPin size={11} style={{ display: 'inline', marginRight: 4 }} />
                        {item.district}
                      </span>
                      {item.category && (
                        <span className="tag tag-category">
                          <Tag size={11} style={{ display: 'inline', marginRight: 4 }} />
                          {item.category}
                        </span>
                      )}

                    </div>

                    <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '6px 0' }}>
                      {item.title}
                    </h3>
                    <p style={{ color: '#475569', fontSize: '14px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                      {item.description && item.description.length > 150
                        ? item.description.substring(0, 150) + '...'
                        : item.description}
                      {item.description && item.description.length > 150 && (
                        <button 
                          onClick={() => setReadMoreChallenge(item)}
                          style={{ 
                            background: 'none', 
                            border: 'none', 
                            color: '#2563eb', 
                            cursor: 'pointer', 
                            fontWeight: 600, 
                            marginLeft: '4px',
                            padding: 0 
                          }}
                        >
                          Read more...
                        </button>
                      )}
                    </p>
                  </div>

                  <button
                    className="btn btn-primary"
                    disabled={claimingId === item.id}
                    onClick={() => handleClaim(item.id)}
                    style={{ padding: '10px 20px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Check size={16} />
                    {claimingId === item.id ? 'Claiming...' : 'Claim Problem'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {readMoreChallenge && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <button className="modal-close" onClick={() => setReadMoreChallenge(null)}>
              <X size={20} />
            </button>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px', color: '#0f172a' }}>
              {readMoreChallenge.title}
            </h3>
            <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '8px' }}>
              <p style={{ whiteSpace: 'pre-wrap', color: '#475569', fontSize: '15px', lineHeight: 1.6 }}>
                {readMoreChallenge.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
