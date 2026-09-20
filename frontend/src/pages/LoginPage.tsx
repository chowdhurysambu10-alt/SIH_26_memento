import React, { useState } from 'react';
import { authApi } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { JHARKHAND_DISTRICTS } from '../constants/districts';
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
  ChevronLeft
} from 'lucide-react';

import { useIsMobile } from '../hooks/useMediaQuery';

interface LoginPageProps {
  onSuccess: () => void;
  onBack?: () => void;
}

const ROLES = [
  { id: 'student', label: 'Continue as Student', icon: GraduationCap, backendRole: 'student', color: '#10b981', desc: 'Join projects and earn credits' },
  { id: 'institution', label: 'Continue as Institution', icon: Building, backendRole: 'university_admin', color: '#8b5cf6', desc: 'Manage civic initiatives' },
  { id: 'admin', label: 'Continue as Admin', icon: Shield, backendRole: 'super_admin', color: '#ef4444', desc: 'Site control and oversight' },
  { id: 'citizen', label: 'Continue as Citizen', icon: Users, backendRole: 'citizen', color: '#3b82f6', desc: 'Report and support issues' },
];

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess, onBack }) => {
  const { user, login, signup, logout } = useAuth();
  const { showAlert } = useUI();
  const isMobile = useIsMobile();

  const [activeRole, setActiveRole] = useState<typeof ROLES[0] | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [name, setName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [district, setDistrict] = useState('');
  const [email, setEmail] = useState('');
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('Please enter your Registered Email Address first.');
      return;
    }
    setLoading(true);
    try {
      await authApi.requestOtp(email.trim());
      showAlert(`A password reset OTP has been sent to your email`, 'success');
      setError('');
      setOtpSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to request OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      setError('Please enter the OTP');
      return;
    }
    setLoading(true);
    try {
      await authApi.verifyOtp(email.trim(), otp);
      setOtpVerified(true);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setError('Please enter a new password (min 6 characters)');
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword(email.trim(), newPassword);
      showAlert(`Your password has been reset successfully!`, 'success');
      setIsForgotPassword(false);
      setOtpSent(false);
      setOtpVerified(false);
      setOtp('');
      setNewPassword('');
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

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
        setError('Password must be at least 8 characters and contain 1 uppercase, 1 lowercase, 1 number, and 1 special character.');
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
          name: activeRole.id === 'institution' && orgName.trim() ? orgName.trim() : name.trim(),
          role: activeRole.backendRole,
          district: district || 'Ranchi',
          contact: contact.trim() || undefined,
        });
      } else {
        await login(email.trim(), password, activeRole.backendRole);
      }
      onSuccess();
    } catch (err: any) {
      if (!isSignUp && (err.message?.includes('Invalid') || err.message?.includes('401') || err.statusCode === 401)) {
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
      <div style={{ ...styles.pageWrapper, flexDirection: isMobile ? 'column' : 'row' }}>
        <div style={{ ...styles.brandPanel, width: isMobile ? '100%' : '42%', padding: isMobile ? '32px 24px' : '60px 48px' }}>
          <div>
            <div style={{ marginBottom: 16 }}><Globe size={48} color="#fff" /></div>
            <h1 style={{ fontSize: 32, fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>Memento</h1>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', margin: 0, lineHeight: 1.6 }}>Societal Innovation & Collaboration Platform</p>
          </div>
        </div>
        <div style={{ ...styles.formPanel, padding: isMobile ? '24px' : '40px 48px' }}>
          <div style={{ ...styles.formInner, maxWidth: isMobile ? '100%' : 480 }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ marginBottom: 12 }}><CheckCircle2 size={48} color="#2563eb" style={{ margin: '0 auto' }} /></div>
              <h2 style={{ fontSize: 28, fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>Welcome, {user.name || 'User'}!</h2>
              <p style={{ color: '#64748b', fontSize: 15, margin: '0 0 20px' }}>{user.email}</p>
              <div style={styles.badge}>Role: {(user.role || '').replace('_', ' ')}</div>
              <div style={{ marginTop: 32, display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button onClick={logout} style={styles.logoutBtn}>← Sign out</button>
                <button onClick={onSuccess} style={{ ...styles.submitBtn, width: 'auto', padding: '12px 28px' }}>Go to Dashboard →</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...styles.pageWrapper, flexDirection: isMobile ? 'column' : 'row' }}>
      <div style={{ ...styles.brandPanel, width: isMobile ? '100%' : '42%', padding: isMobile ? '32px 24px' : '60px 48px', background: activeRole ? `linear-gradient(135deg, ${activeRole.color} 0%, #1e40af 100%)` : styles.brandPanel.background }}>
        <div style={{ transition: 'all 0.3s ease' }}>
          <div style={{ marginBottom: 16, display: isMobile ? 'none' : 'block' }}><Globe size={48} color="#fff" /></div>
          <h1 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>Memento</h1>
          {!isMobile && <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', margin: 0, lineHeight: 1.6 }}>Societal Innovation &<br />Collaboration Platform</p>}
          {!isMobile && <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 8 }}>by Team Memento · SIH26043</p>}
          
          {activeRole && !isMobile && (
            <div style={{ marginTop: 40, padding: '24px', background: 'rgba(255,255,255,0.1)', borderRadius: 16, backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <activeRole.icon size={32} color="#fff" style={{ marginBottom: 12 }} />
              <h3 style={{ color: '#fff', margin: '0 0 8px', fontSize: '20px' }}>{activeRole.label}</h3>
              <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, margin: 0, lineHeight: 1.6 }}>
                {activeRole.desc}
              </p>
            </div>
          )}
        </div>
      </div>

      <div style={{ ...styles.formPanel, padding: isMobile ? '24px' : '40px 48px' }}>
        <div style={{ ...styles.formInner, maxWidth: isMobile ? '100%' : 480 }}>
          {!activeRole ? (
            // ROLE SELECTION STEP
            <div>
              <button onClick={onBack || onSuccess} style={{ display: 'inline-block', marginBottom: 24, color: '#64748b', background: 'none', border: 'none', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>
                ← Back to Home
              </button>
              <h2 style={{ fontSize: 28, fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>
                Select Your Role
              </h2>
              <p style={{ color: '#64748b', fontSize: 15, margin: '0 0 32px' }}>
                Choose how you want to log in to Memento to access tailored features.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {ROLES.map((r) => {
                  const IconComp = r.icon;
                  return (
                    <div 
                      key={r.id}
                      onClick={() => setActiveRole(r)}
                      style={styles.portalCard}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = r.color; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      <div style={{ ...styles.iconWrapper, background: `${r.color}15`, color: r.color }}>
                        <IconComp size={24} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 4px', fontSize: '16px', color: '#0f172a' }}>{r.label}</h4>
                        <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>{r.desc}</p>
                      </div>
                      <ArrowRight size={20} color="#94a3b8" />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            // LOGIN / SIGNUP / FORGOT PASSWORD STEP
            <div>
              <button 
                onClick={() => { 
                  if (isForgotPassword) {
                    setIsForgotPassword(false);
                    setOtpSent(false);
                    setOtpVerified(false);
                    setOtp('');
                    setNewPassword('');
                    setError('');
                  } else {
                    setActiveRole(null); 
                    setError(''); 
                    setIsSignUp(false); 
                  }
                }} 
                style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: 24, color: '#64748b', background: 'none', border: 'none', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}
              >
                <ChevronLeft size={16} /> {isForgotPassword ? 'Back to Login' : 'Back to Roles'}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${activeRole.color}15`, color: activeRole.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <activeRole.icon size={24} />
                </div>
                <div>
                  <h2 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>
                    {activeRole.label}
                  </h2>
                  <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>
                    {isForgotPassword ? 'Reset your password' : isSignUp ? 'Create your new account' : 'Sign in to continue'}
                  </p>
                </div>
              </div>

              {/* Toggle */}
              {!isForgotPassword && activeRole.id !== 'admin' && (
                <div style={styles.toggleContainer}>
                  <button
                    type="button"
                    onClick={() => { setIsSignUp(false); setError(''); }}
                    style={{
                      ...styles.toggleBtn,
                      background: !isSignUp ? '#fff' : 'transparent',
                      boxShadow: !isSignUp ? '0 2px 4px rgba(0,0,0,0.08)' : 'none',
                      color: !isSignUp ? '#0f172a' : '#64748b',
                    }}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsSignUp(true); setError(''); }}
                    style={{
                      ...styles.toggleBtn,
                      background: isSignUp ? '#fff' : 'transparent',
                      boxShadow: isSignUp ? '0 2px 4px rgba(0,0,0,0.08)' : 'none',
                      color: isSignUp ? '#0f172a' : '#64748b',
                    }}
                  >
                    Register
                  </button>
                </div>
              )}

              {isForgotPassword ? (
                <div>
                  {!otpSent ? (
                    <>
                      <div style={{ marginBottom: 14 }}>
                        <label style={styles.label}>Registered Email Address (Required)</label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@domain.com"
                          style={styles.input}
                          required
                        />
                      </div>
                      {error && (
                        <div style={{ ...styles.errorBanner, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <AlertCircle size={16} /> {error}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        disabled={loading}
                        style={{ ...styles.submitBtn, background: activeRole.color, padding: '14px', fontSize: 16, opacity: loading ? 0.7 : 1 }}
                      >
                        {loading ? 'Sending...' : 'Send Reset OTP'}
                      </button>
                    </>
                  ) : !otpVerified ? (
                    <>
                      <div style={{ marginBottom: 20 }}>
                        <label style={styles.label}>Enter 6-Digit OTP</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                          placeholder="000000"
                          style={{ ...styles.input, letterSpacing: '4px', textAlign: 'center', fontSize: '20px' }}
                          maxLength={6}
                        />
                      </div>
                      {error && (
                        <div style={{ ...styles.errorBanner, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <AlertCircle size={16} /> {error}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={loading}
                        style={{ ...styles.submitBtn, background: activeRole.color, padding: '14px', fontSize: 16, opacity: loading ? 0.7 : 1 }}
                      >
                        {loading ? 'Verifying...' : 'Verify OTP'}
                      </button>
                    </>
                  ) : (
                    <>
                      <div style={{ marginBottom: 20 }}>
                        <label style={styles.label}>New Password</label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                          style={styles.input}
                        />
                      </div>
                      {error && (
                        <div style={{ ...styles.errorBanner, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <AlertCircle size={16} /> {error}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={handleResetPassword}
                        disabled={loading}
                        style={{ ...styles.submitBtn, background: activeRole.color, padding: '14px', fontSize: 16, opacity: loading ? 0.7 : 1 }}
                      >
                        {loading ? 'Resetting...' : 'Reset Password'}
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <form onSubmit={handleAuth}>
                {isSignUp && (
                  <div style={{ marginBottom: 14 }}>
                    <label style={styles.label}>Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter legal name"
                      style={styles.input}
                      required
                    />
                  </div>
                )}

                {isSignUp && activeRole.id !== 'citizen' && activeRole.id !== 'admin' && (
                  <div style={{ marginBottom: 14 }}>
                    <label style={styles.label}>Institution / Organization Name</label>
                    <input
                      type="text"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder={activeRole.id === 'student' ? 'e.g. NIT Jamshedpur' : 'e.g. IIT ISM Dhanbad'}
                      style={styles.input}
                      required
                    />
                  </div>
                )}

                {isSignUp && (
                  <div style={{ marginBottom: 14 }}>
                    <label style={styles.label}>District / Location</label>
                    <select
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      style={styles.input}
                      required
                    >
                      <option value="" disabled>Select your district</option>
                      {JHARKHAND_DISTRICTS.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div style={{ marginBottom: 14 }}>
                  <label style={styles.label}>Email / User ID</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@domain.com"
                    style={styles.input}
                    required
                  />
                </div>

                {isSignUp && (
                  <div style={{ marginBottom: 14 }}>
                    <label style={styles.label}>Phone Number (Optional)</label>
                    <input
                      type="tel"
                      value={contact}
                      onChange={(e) => {
                        // Only allow digits, spaces, hyphens and leading +
                        const val = e.target.value.replace(/[^\d\s\-+]/g, '');
                        setContact(val);
                      }}
                      onBlur={() => {
                        const digits = contact.replace(/\D/g, '');
                        if (contact && digits.length < 10) {
                          setError('Phone number must be at least 10 digits.');
                        } else {
                          setError('');
                        }
                      }}
                      placeholder="+91 9876543210"
                      style={styles.input}
                      maxLength={15}
                    />
                  </div>
                )}

                <div style={{ marginBottom: isSignUp ? 14 : 20 }}>
                  <label style={styles.label}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      style={{ ...styles.input, paddingRight: 45 }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      style={styles.eyeBtn}
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  
                  {!isSignUp && activeRole.id !== 'admin' && (
                    <div style={{ marginTop: '8px', textAlign: 'right' }}>
                      <button 
                        type="button" 
                        onClick={() => setIsForgotPassword(true)}
                        style={{ background: 'none', border: 'none', color: activeRole.color, fontSize: '13px', fontWeight: 600, cursor: 'pointer', outline: 'none' }}
                      >
                        Forgot Password?
                      </button>
                    </div>
                  )}

                  {showPasswordError && (
                    <div style={{ color: '#b91c1c', fontSize: 12, marginTop: 6, display: 'flex', gap: 4, alignItems: 'center' }}>
                      <AlertCircle size={14} /> Must be 8+ chars, 1 uppercase, 1 lowercase, 1 number, 1 special char.
                    </div>
                  )}
                </div>

                {isSignUp && (
                  <div style={{ marginBottom: 20 }}>
                    <label style={styles.label}>Confirm Password</label>
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      style={styles.input}
                      required
                    />
                  </div>
                )}

                {error && (
                  <div style={{ ...styles.errorBanner, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertCircle size={16} /> {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{ ...styles.submitBtn, background: activeRole.color, opacity: loading ? 0.7 : 1, padding: '14px', fontSize: 16 }}
                >
                  {loading ? 'Processing...' : isSignUp ? `Register as ${activeRole.label.split(' ')[0]}` : `Sign in`}
                </button>
              </form>
            )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  pageWrapper: { display: 'flex', minHeight: '100vh', width: '100%' },
  brandPanel: { width: '42%', background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #1e40af 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 48px', position: 'relative', overflow: 'hidden' },
  formPanel: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 48px', background: '#ffffff', overflowY: 'auto' },
  formInner: { width: '100%', maxWidth: 480 },
  portalCard: { display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', borderRadius: '16px', border: '2px solid #e2e8f0', background: '#fff', cursor: 'pointer', transition: 'all 0.2s ease' },
  iconWrapper: { width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  toggleContainer: { display: 'flex', background: '#f1f5f9', padding: 5, borderRadius: 12, marginBottom: 28 },
  toggleBtn: { flex: 1, padding: '10px 0', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: '0.2s' },
  label: { display: 'block', fontSize: 14, fontWeight: 500, color: '#0f172a', marginBottom: 8 },
  input: { width: '100%', padding: '12px 16px', background: '#ffffff', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 15, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s, box-shadow 0.2s' },
  eyeBtn: { position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer', padding: '5px 10px', color: '#64748b' },
  submitBtn: { width: '100%', padding: '14px', background: '#2563eb', border: 'none', color: '#ffffff', fontSize: 16, fontWeight: 600, cursor: 'pointer', borderRadius: 8, transition: 'background 0.2s' },
  badge: { display: 'inline-block', padding: '8px 20px', borderRadius: 20, background: '#dbeafe', color: '#2563eb', fontWeight: 600, fontSize: 14 },
  logoutBtn: { padding: '10px 24px', border: '1px solid #e2e8f0', background: '#fff', borderRadius: 8, cursor: 'pointer', color: '#0f172a', fontWeight: 500, fontSize: 14 },
  errorBanner: { background: '#fee2e2', color: '#b91c1c', padding: '12px 14px', borderRadius: 8, fontSize: 14, marginBottom: 16 },
};
