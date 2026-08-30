import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/auth.types';
import { Users, Shield, GraduationCap, Building2, UserCheck, Briefcase, Landmark, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

interface RoleMeta {
  role: UserRole;
  label: string;
  badge: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

const ROLES_LIST: RoleMeta[] = [
  {
    role: 'citizen',
    label: 'Citizen',
    badge: 'Civic Sourcing',
    icon: <Users size={16} />,
    description: 'Submit societal problems with GPS photos, track auto-routing',
    color: '#10b981'
  },
  {
    role: 'pri_ulb_official',
    label: 'Panchayat / PRI',
    badge: 'Local Governance',
    icon: <Landmark size={16} />,
    description: 'Monitor block/district feed & endorse local issues',
    color: '#06b6d4'
  },
  {
    role: 'university_admin',
    label: 'University Dean',
    badge: 'BIT Sindri Admin',
    icon: <GraduationCap size={16} />,
    description: 'Manage routed challenges, form teams, approve deliverables',
    color: '#3b82f6'
  },
  {
    role: 'faculty',
    label: 'Faculty Mentor',
    badge: 'Research Lead',
    icon: <Briefcase size={16} />,
    description: 'Lead student project teams, define milestones, review reports',
    color: '#8b5cf6'
  },
  {
    role: 'student',
    label: 'Student Innovator',
    badge: 'Contributor',
    icon: <UserCheck size={16} />,
    description: 'Work on assigned projects & submit deliverable reports/repos',
    color: '#ec4899'
  },
  {
    role: 'industry_partner',
    label: 'Industry CSR',
    badge: 'Tata Steel / CCL',
    icon: <Building2 size={16} />,
    description: 'Browse societal challenges & submit CSR funding grants',
    color: '#f59e0b'
  },
  {
    role: 'govt_viewer',
    label: 'Govt Authority',
    badge: 'State Monitoring',
    icon: <Shield size={16} />,
    description: 'Statewide GIS heatmap, department KPIs & solution validation',
    color: '#14b8a6'
  },
  {
    role: 'super_admin',
    label: 'Super Admin',
    badge: 'Full Control',
    icon: <Sparkles size={16} />,
    description: 'AI routing overrides, manual state transitions, user verification',
    color: '#f43f5e'
  }
];

export const PersonaSwitcher: React.FC = () => {
  const { role, user, switchPersona } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  const currentRoleMeta = ROLES_LIST.find((r) => r.role === role) || ROLES_LIST[0];

  return (
    <div
      style={{
        background: 'linear-gradient(90deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '0.45rem 1.5rem',
        fontSize: '0.85rem',
        zIndex: 100,
        position: 'sticky',
        top: 0,
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            <Sparkles size={14} color="#10b981" />
            <span>Interactive Demo Mode:</span>
          </span>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'rgba(255, 255, 255, 0.08)',
              padding: '0.2rem 0.65rem',
              borderRadius: 'var(--radius-full)',
              border: `1px solid ${currentRoleMeta.color}60`,
            }}
          >
            <span style={{ color: currentRoleMeta.color }}>{currentRoleMeta.icon}</span>
            <strong style={{ color: '#ffffff' }}>{currentRoleMeta.label}</strong>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>({user?.name})</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Quick Persona Switch:</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
            {ROLES_LIST.slice(0, isExpanded ? ROLES_LIST.length : 4).map((r) => {
              const isSelected = r.role === role;
              return (
                <button
                  key={r.role}
                  onClick={() => switchPersona(r.role)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: '0.25rem 0.6rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.78rem',
                    fontWeight: isSelected ? 700 : 500,
                    background: isSelected ? `${r.color}25` : 'rgba(255, 255, 255, 0.05)',
                    color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                    border: `1px solid ${isSelected ? r.color : 'rgba(255, 255, 255, 0.1)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  title={r.description}
                >
                  <span style={{ color: r.color }}>{r.icon}</span>
                  <span>{r.label}</span>
                </button>
              );
            })}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.2rem',
                padding: '0.25rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                background: 'transparent',
                color: 'var(--emerald-500)',
                border: '1px dashed var(--emerald-500)',
                cursor: 'pointer',
              }}
            >
              {isExpanded ? <>Less <ChevronUp size={12} /></> : <>+4 More Roles <ChevronDown size={12} /></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
