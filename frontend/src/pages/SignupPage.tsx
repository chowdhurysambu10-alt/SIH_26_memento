import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/auth.types';
import { JHARKHAND_DISTRICTS, MOCK_INSTITUTIONS } from '../services/mockData';
import { Sparkles, Users, GraduationCap, Building2, Landmark, UserCheck, Briefcase, ArrowRight, Check } from 'lucide-react';

interface SignupPageProps {
  onNavigate: (page: string) => void;
}

export const SignupPage: React.FC<SignupPageProps> = ({ onNavigate }) => {
  const { signup } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedRole, setSelectedRole] = useState<UserRole>('citizen');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [contact, setContact] = useState('');
  const [district, setDistrict] = useState(JHARKHAND_DISTRICTS[0]);
  const [orgId, setOrgId] = useState(MOCK_INSTITUTIONS[0].id);
  const [isLoading, setIsLoading] = useState(false);

  const handleCompleteSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signup({
        name,
        email,
        password,
        role: selectedRole,
        contact,
        district,
        org_id: selectedRole !== 'citizen' && selectedRole !== 'pri_ulb_official' ? orgId : undefined,
      });
      onNavigate('home');
    } finally {
      setIsLoading(false);
    }
  };

  const ROLE_OPTIONS = [
    { role: 'citizen', label: 'Citizen', desc: 'Submit grassroots problems & track resolution', icon: <Users size={20} /> },
    { role: 'student', label: 'Student Contributor', desc: 'Join university teams & submit engineering deliverables', icon: <UserCheck size={20} /> },
    { role: 'faculty', label: 'Faculty Mentor', desc: 'Lead university research labs & mentor student teams', icon: <Briefcase size={20} /> },
    { role: 'university_admin', label: 'University Dean', desc: 'Manage routed challenges & assign department faculty', icon: <GraduationCap size={20} /> },
    { role: 'industry_partner', label: 'Corporate CSR', desc: 'Sponsor high-impact projects & offer grant funding', icon: <Building2 size={20} /> },
    { role: 'pri_ulb_official', label: 'Panchayat / PRI', desc: 'Local civic governance monitoring & endorsement', icon: <Landmark size={20} /> },
  ];

  return (
    <div className="container" style={{ padding: '3.5rem 1.5rem 5rem', maxWidth: '640px', margin: '0 auto' }}>
      <div className="glass-panel" style={{ padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #10b981, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
            }}
          >
            <Sparkles size={24} color="#ffffff" />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
            Register on Jharkhand Innovation Portal
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Step {step} of 2: {step === 1 ? 'Select Your Persona' : 'Complete Profile Information'}
          </p>
        </div>

        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Choose your role in the innovation network:
            </span>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {ROLE_OPTIONS.map((opt) => {
                const isSelected = selectedRole === opt.role;
                return (
                  <div
                    key={opt.role}
                    onClick={() => setSelectedRole(opt.role as UserRole)}
                    style={{
                      background: isSelected ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-glass)',
                      border: isSelected ? '2px solid var(--emerald-500)' : '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1rem',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.35rem',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: isSelected ? 'var(--emerald-500)' : '#ffffff' }}>
                      {opt.icon}
                      <strong style={{ fontSize: '0.95rem' }}>{opt.label}</strong>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>
                      {opt.desc}
                    </p>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: '1rem', gap: '0.4rem' }}
            >
              <span>Continue to Profile Details</span>
              <ArrowRight size={18} />
            </button>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleCompleteSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dr. Priya Sharma"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. priya.sharma@bau.edu.in"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password *</label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contact Phone</label>
              <input
                type="tel"
                className="form-input"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="+91 9876543210"
              />
            </div>

            {selectedRole === 'citizen' || selectedRole === 'pri_ulb_official' ? (
              <div className="form-group">
                <label className="form-label">District (Jharkhand)</label>
                <select
                  className="form-select"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                >
                  {JHARKHAND_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label">Associated Institution / Organization</label>
                <select
                  className="form-select"
                  value={orgId}
                  onChange={(e) => setOrgId(e.target.value)}
                >
                  {MOCK_INSTITUTIONS.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name} ({inst.district})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <button type="button" onClick={() => setStep(1)} className="btn btn-secondary">
                Back
              </button>
              <button type="submit" disabled={isLoading} className="btn btn-primary" style={{ flex: 1, gap: '0.4rem' }}>
                <Check size={16} />
                <span>{isLoading ? 'Registering...' : 'Complete Registration'}</span>
              </button>
            </div>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Already registered?{' '}
          <button
            onClick={() => onNavigate('login')}
            style={{ background: 'none', border: 'none', color: 'var(--emerald-500)', fontWeight: 600, cursor: 'pointer' }}
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
};
