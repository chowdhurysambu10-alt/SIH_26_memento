import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DEMO_USERS } from '../services/mockData';
import { UserRole } from '../types/auth.types';
import { Sparkles, Lock, Mail, ArrowRight, ShieldCheck, UserCheck, Users, Building2, GraduationCap, Landmark } from 'lucide-react';

interface LoginPageProps {
  onNavigate: (page: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login, switchPersona } = useAuth();
  const [email, setEmail] = useState('rajesh.soren@jharkhand.in');
  const [password, setPassword] = useState('Password123!');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login({ email, password });
      onNavigate('home');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (role: UserRole) => {
    const user = DEMO_USERS[role];
    if (user) {
      setEmail(user.email);
      switchPersona(role);
      onNavigate('home');
    }
  };

  return (
    <div className="container" style={{ padding: '3.5rem 1.5rem 5rem', maxWidth: '540px', margin: '0 auto' }}>
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
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)',
            }}
          >
            <Sparkles size={24} color="#ffffff" />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
            Sign In to Jharkhand Portal
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Societal Innovation & Multi-Stakeholder Collaboration Platform
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div className="form-group">
            <label className="form-label">
              <Mail size={15} /> Email Address
            </label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. name@jharkhand.in"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <Lock size={15} /> Password
            </label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '0.5rem', gap: '0.5rem' }}
          >
            <span>{isLoading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight size={18} />
          </button>
        </form>

        {/* Quick 1-Click Demo Persona Access */}
        <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.75rem', textAlign: 'center' }}>
            ⚡ 1-Click Hackathon Demo Logins:
          </span>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <button
              onClick={() => handleQuickLogin('citizen')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.78rem', justifyContent: 'flex-start' }}
            >
              <Users size={14} color="#10b981" /> Citizen (Rajesh)
            </button>
            <button
              onClick={() => handleQuickLogin('university_admin')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.78rem', justifyContent: 'flex-start' }}
            >
              <GraduationCap size={14} color="#3b82f6" /> Dean (BIT Sindri)
            </button>
            <button
              onClick={() => handleQuickLogin('faculty')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.78rem', justifyContent: 'flex-start' }}
            >
              <Users size={14} color="#8b5cf6" /> Faculty (Dr. Verma)
            </button>
            <button
              onClick={() => handleQuickLogin('student')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.78rem', justifyContent: 'flex-start' }}
            >
              <UserCheck size={14} color="#ec4899" /> Student (Ananya)
            </button>
            <button
              onClick={() => handleQuickLogin('industry_partner')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.78rem', justifyContent: 'flex-start' }}
            >
              <Building2 size={14} color="#f59e0b" /> Tata Steel CSR
            </button>
            <button
              onClick={() => handleQuickLogin('govt_viewer')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.78rem', justifyContent: 'flex-start' }}
            >
              <ShieldCheck size={14} color="#14b8a6" /> Govt IAS Monitor
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <button
            onClick={() => onNavigate('signup')}
            style={{ background: 'none', border: 'none', color: 'var(--emerald-500)', fontWeight: 600, cursor: 'pointer' }}
          >
            Register Here
          </button>
        </div>
      </div>
    </div>
  );
};
