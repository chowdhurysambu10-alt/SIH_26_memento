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
} from 'lucide-react';

interface LoginPageProps {
  onSuccess: () => void;
}

const ROLES = [
  { id: 'student', label: 'Student', icon: GraduationCap, backendRole: 'student' },
  { id: 'institution', label: 'Institution', icon: Building, backendRole: 'university_admin' },
  { id: 'admin', label: 'Admin', icon: Shield, backendRole: 'super_admin' },
  { id: 'citizen', label: 'Public', icon: Users, backendRole: 'citizen' },
];

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  const { user, login, signup, logout } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [activeRole, setActiveRole] = useState(ROLES[0]);
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
      if (activeRole.id !== 'citizen' && !orgName.trim()) {
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
          name: name.trim(),
          role: activeRole.backendRole,
          district: 'Ranchi',
        });
      } else {
        await login(email.trim(), password);
      }
      onSuccess();
    } catch (err: any) {
      if (!isSignUp && (err.message?.includes('Invalid') || err.message?.includes('401') || err.statusCode === 401)) {
        setError('Invalid email or password. If you are new to the portal, please click the "Register" tab above to create an account.');
      } else {
        setError(err.message || (isSignUp ? 'Registration failed.' : 'Invalid credentials.'));
      }
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <div style={styles.pageWrapper}>
        <div style={styles.brandPanel}>
          <div>
            <div style={{ marginBottom: 16 }}><Globe size={48} color="#fff" /></div>
            <h1 style={{ fontSize: 32, fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>Momento</h1>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', margin: 0, lineHeight: 1.6 }}>Societal Innovation & Collaboration Platform</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 8 }}>by Team Momento · SIH26043</p>
          </div>
        </div>
        <div style={styles.formPanel}>
          <div style={styles.formInner}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ marginBottom: 12 }}><CheckCircle2 size={48} color="#2563eb" style={{ margin: '0 auto' }} /></div>
              <h2 style={{ fontSize: 28, fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>Welcome, {user.name || 'User'}!</h2>
              <p style={{ color: '#64748b', fontSize: 15, margin: '0 0 20px' }}>{user.email}</p>
              <div style={styles.badge}>Role: {user.role || activeRole.label}</div>
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
    <div style={styles.pageWrapper}>
      <div style={styles.brandPanel}>
        <div>
          <div style={{ marginBottom: 16 }}><Globe size={48} color="#fff" /></div>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>Momento</h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', margin: 0, lineHeight: 1.6 }}>Societal Innovation &<br />Collaboration Platform</p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 8 }}>by Team Momento · SIH26043</p>
          <div style={{ marginTop: 40, padding: '16px 20px', background: 'rgba(255,255,255,0.1)', borderRadius: 12, backdropFilter: 'blur(8px)' }}>
            <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, margin: 0, lineHeight: 1.6, display: 'flex', alignItems: 'center', gap: 8 }}>
              <ArrowRight size={16} /> Connect with citizens, institutions & government bodies to solve real societal challenges across Jharkhand.
            </p>
          </div>
        </div>
      </div>

      <div style={styles.formPanel}>
        <div style={styles.formInner}>
          <button onClick={onSuccess} style={{ display: 'inline-block', marginBottom: 24, color: '#64748b', background: 'none', border: 'none', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>
            ← Back to Home
          </button>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h2>
          <p style={{ color: '#64748b', fontSize: 15, margin: '0 0 32px' }}>
            {isSignUp ? 'Join the platform and start collaborating' : 'Sign in to continue to your dashboard'}
          </p>

          {/* Toggle */}
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

          {/* Role Tabs */}
          <div style={styles.roleGrid}>
            {ROLES.map((r) => {
              const isActive = activeRole.id === r.id;
              const IconComp = r.icon;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => { setActiveRole(r); setError(''); }}
                  style={{
                    ...styles.roleBtn,
                    background: isActive ? '#2563eb' : '#f1f5f9',
                    color: isActive ? '#ffffff' : '#64748b',
                    opacity: isActive ? 1 : 0.75,
                    border: isActive ? 'none' : '1px solid #e2e8f0',
                  }}
                >
                  <IconComp size={20} color={isActive ? '#ffffff' : '#64748b'} />
                  <div style={{ fontSize: 12, fontWeight: 600, marginTop: 4 }}>{r.label}</div>
                </button>
              );
            })}
          </div>

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

            {isSignUp && activeRole.id !== 'citizen' && (
              <div style={{ marginBottom: 14 }}>
                <label style={styles.label}>Institution / Organization Name</label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. NIT Jamshedpur / BIT Mesra / Tata Steel"
                  style={styles.input}
                  required
                />
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
              style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1, padding: '14px', fontSize: 16 }}
            >
              {loading ? 'Processing...' : isSignUp ? `Register as ${activeRole.label}` : `Sign in as ${activeRole.label}`}
            </button>
          </form>
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
  toggleContainer: { display: 'flex', background: '#f1f5f9', padding: 5, borderRadius: 12, marginBottom: 28 },
  toggleBtn: { flex: 1, padding: '10px 0', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: '0.2s' },
  roleGrid: { display: 'flex', justifyContent: 'space-between', marginBottom: 28, gap: 10 },
  roleBtn: { flex: 1, border: 'none', borderRadius: 12, padding: '14px 0', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'all 0.2s' },
  label: { display: 'block', fontSize: 14, fontWeight: 500, color: '#0f172a', marginBottom: 8 },
  input: { width: '100%', padding: '12px 16px', background: '#ffffff', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 15, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s, box-shadow 0.2s' },
  eyeBtn: { position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer', padding: '5px 10px', color: '#64748b' },
  submitBtn: { width: '100%', padding: '14px', background: '#2563eb', border: 'none', color: '#ffffff', fontSize: 16, fontWeight: 600, cursor: 'pointer', borderRadius: 8, transition: 'background 0.2s' },
  badge: { display: 'inline-block', padding: '8px 20px', borderRadius: 20, background: '#dbeafe', color: '#2563eb', fontWeight: 600, fontSize: 14 },
  logoutBtn: { padding: '10px 24px', border: '1px solid #e2e8f0', background: '#fff', borderRadius: 8, cursor: 'pointer', color: '#0f172a', fontWeight: 500, fontSize: 14 },
  errorBanner: { background: '#fee2e2', color: '#b91c1c', padding: '12px 14px', borderRadius: 8, fontSize: 14, marginBottom: 16 },
};
