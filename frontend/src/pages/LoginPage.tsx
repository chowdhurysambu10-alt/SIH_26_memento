import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Globe,
  GraduationCap,
  Building,
  Shield,
  Users,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  Sparkles,
} from 'lucide-react';

interface LoginPageProps {
  onSuccess: () => void;
  onBack?: () => void;
}

const ROLES = [
  {
    id: 'citizen',
    label: 'Citizen Portal',
    icon: Users,
    backendRole: 'citizen',
    color: '#2563eb',
    desc: 'Report civic issues & support community solutions',
  },
  {
    id: 'student',
    label: 'Student Portal',
    icon: GraduationCap,
    backendRole: 'student',
    color: '#059669',
    desc: 'Join university teams, build solutions & earn credits',
  },
  {
    id: 'institution',
    label: 'Institution Portal',
    icon: Building,
    backendRole: 'university_admin',
    color: '#7c3aed',
    desc: 'Adopt problems, supervise R&D labs & guide students',
  },
  {
    id: 'admin',
    label: 'Admin Portal',
    icon: Shield,
    backendRole: 'super_admin',
    color: '#dc2626',
    desc: 'System oversight, AI moderation & platform controls',
  },
];

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess, onBack }) => {
  const { user, login, signup, logout } = useAuth();

  const [activeRole, setActiveRole] = useState<typeof ROLES[0] | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);

  const [name, setName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
  const showPasswordError = isSignUp && password.length > 0 && !passRegex.test(password);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRole) return;
    setError('');

    if (!email.trim() || !password) {
      setError('All credentials are required.');
      return;
    }

    if (isSignUp) {
      if (!name.trim()) {
        setError('Full Name is required.');
        return;
      }
      if (activeRole.id !== 'citizen' && activeRole.id !== 'admin' && !orgName.trim()) {
        setError('Institution / Organization Name is required for this role.');
        return;
      }
      if (!passRegex.test(password)) {
        setError(
          'Password must be at least 8 characters and contain 1 uppercase, 1 lowercase, 1 number, and 1 special character.'
        );
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match!');
        return;
      }
    }

    setLoading(true);

    try {
      if (isSignUp) {
        await signup({
          email: email.trim(),
          password,
          name: name.trim(),
          role: activeRole.backendRole,
          district: 'Ranchi',
        });
      } else {
        await login(email.trim(), password);
      }
      onSuccess();
    } catch (err: any) {
      if (
        !isSignUp &&
        (err.message?.includes('Invalid') ||
          err.message?.includes('401') ||
          err.statusCode === 401)
      ) {
        setError('Invalid email or password. If you are new to the portal, please register first.');
      } else {
        setError(err.message || (isSignUp ? 'Registration failed.' : 'Invalid credentials.'));
      }
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <div className="login-page-container">
        <div className="login-brand-panel">
          <div className="login-brand-content">
            <div className="login-brand-logo-icon">
              <Globe size={40} color="#fff" />
            </div>
            <h1 className="login-brand-title">Memento</h1>
            <p className="login-brand-tagline">Societal Innovation & Collaboration Platform</p>
          </div>
        </div>
        <div className="login-form-panel">
          <div className="login-form-inner" style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: 16 }}>
              <CheckCircle2 size={54} color="#2563eb" style={{ margin: '0 auto' }} />
            </div>
            <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
              Welcome, {user.name || 'User'}!
            </h2>
            <p style={{ color: '#64748b', fontSize: '15px', margin: '0 0 20px' }}>{user.email}</p>
            <div className="role-pill-badge">
              Role: {(user.role || '').replace('_', ' ')}
            </div>
            <div style={{ marginTop: 28, display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={logout} className="btn btn-outline" style={{ padding: '12px 20px' }}>
                ← Sign out
              </button>
              <button
                onClick={onSuccess}
                className="btn btn-primary"
                style={{ padding: '12px 24px' }}
              >
                Go to Dashboard →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page-container">
      {/* Brand Hero Panel */}
      <div
        className="login-brand-panel"
        style={{
          background: activeRole
            ? `linear-gradient(135deg, ${activeRole.color} 0%, #0f172a 100%)`
            : undefined,
        }}
      >
        <div className="login-brand-content">
          <div className="login-brand-logo-icon">
            <Sparkles size={32} color="#fff" />
          </div>
          <h1 className="login-brand-title">Memento</h1>
          <p className="login-brand-tagline">
            Societal Innovation & Collaboration Platform
          </p>
          <span className="login-sih-tag">SIH 2026 Problem Statement 26043</span>

          {activeRole && (
            <div className="active-role-card-banner">
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '10px',
                }}
              >
                <activeRole.icon size={22} color="#fff" />
              </div>
              <h3 style={{ color: '#fff', margin: '0 0 4px', fontSize: '18px', fontWeight: 700 }}>
                {activeRole.label}
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '13px', margin: 0, lineHeight: 1.5 }}>
                {activeRole.desc}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Main Interactive Form Panel */}
      <div className="login-form-panel">
        <div className="login-form-inner">
          {!activeRole ? (
            /* STEP 1: SELECT ROLE */
            <div className="animate-fade-in">
              <button
                type="button"
                onClick={onBack || onSuccess}
                className="back-btn-link"
              >
                <ChevronLeft size={18} /> Back to Public Feed
              </button>

              <h2 className="login-heading">Select Your Portal</h2>
              <p className="login-subheading">
                Choose your role to access features tailored for citizens, students, faculty, or administrators.
              </p>

              <div className="role-cards-grid">
                {ROLES.map((r) => {
                  const IconComp = r.icon;
                  return (
                    <div
                      key={r.id}
                      onClick={() => setActiveRole(r)}
                      className="portal-selection-card"
                      style={{ '--role-color': r.color } as React.CSSProperties}
                    >
                      <div
                        className="role-icon-box"
                        style={{ background: `${r.color}18`, color: r.color }}
                      >
                        <IconComp size={24} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 className="role-card-title">{r.label}</h4>
                        <p className="role-card-desc">{r.desc}</p>
                      </div>
                      <ArrowRight size={18} className="role-card-arrow" />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* STEP 2: AUTH FORM */
            <div className="animate-fade-in">
              <button
                type="button"
                onClick={() => {
                  setActiveRole(null);
                  setError('');
                  setIsSignUp(false);
                }}
                className="back-btn-link"
              >
                <ChevronLeft size={18} /> Switch Portal
              </button>

              <div className="active-form-header">
                <div
                  className="role-icon-box"
                  style={{ background: `${activeRole.color}20`, color: activeRole.color }}
                >
                  <activeRole.icon size={24} />
                </div>
                <div>
                  <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: '0 0 2px' }}>
                    {activeRole.label}
                  </h2>
                  <p style={{ color: '#64748b', fontSize: '13.5px', margin: 0 }}>
                    {isSignUp ? 'Create your new account' : 'Sign in to access your dashboard'}
                  </p>
                </div>
              </div>

              {/* Sign In / Register Tab Toggle */}
              <div className="auth-tab-switch">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(false);
                    setError('');
                  }}
                  className={`auth-tab-btn ${!isSignUp ? 'active' : ''}`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(true);
                    setError('');
                  }}
                  className={`auth-tab-btn ${isSignUp ? 'active' : ''}`}
                >
                  Register
                </button>
              </div>

              <form onSubmit={handleAuth} className="auth-form-body">
                {isSignUp && (
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      className="input-field"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      required
                    />
                  </div>
                )}

                {isSignUp && activeRole.id !== 'citizen' && activeRole.id !== 'admin' && (
                  <div className="form-group">
                    <label className="form-label">
                      {activeRole.id === 'student' ? 'College / University Name *' : 'Institution Name *'}
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder={
                        activeRole.id === 'student'
                          ? 'e.g. NIT Jamshedpur / BIT Mesra'
                          : 'e.g. IIT ISM Dhanbad'
                      }
                      required
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Email Address / User ID *</label>
                  <input
                    type="email"
                    className="input-field"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@domain.com"
                    autoComplete="email"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPass ? 'text' : 'password'}
                      className="input-field"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      style={{ paddingRight: '44px' }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="password-toggle-btn"
                      aria-label="Toggle password visibility"
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {showPasswordError && (
                    <div className="password-error-tip">
                      <AlertCircle size={13} /> Must be 8+ chars (1 uppercase, 1 lowercase, 1 number, 1 special char).
                    </div>
                  )}
                </div>

                {isSignUp && (
                  <div className="form-group">
                    <label className="form-label">Confirm Password *</label>
                    <input
                      type={showPass ? 'text' : 'password'}
                      className="input-field"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      required
                    />
                  </div>
                )}

                {error && (
                  <div className="auth-error-alert">
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-100"
                  style={{
                    background: activeRole.color,
                    padding: '13px',
                    fontSize: '15px',
                    fontWeight: 700,
                    borderRadius: '10px',
                    marginTop: '8px',
                  }}
                >
                  {loading
                    ? 'Authenticating...'
                    : isSignUp
                    ? `Register for ${activeRole.label.split(' ')[0]}`
                    : `Sign In to ${activeRole.label.split(' ')[0]}`}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
