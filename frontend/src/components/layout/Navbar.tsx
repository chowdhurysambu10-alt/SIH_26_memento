import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Compass,
  PlusCircle,
  Bell,
  Sun,
  Moon,
  LogOut,
  LayoutDashboard,
  Shield,
  GraduationCap,
  Briefcase,
  Users,
  Building2,
  Menu,
  X,
  Sparkles,
  MapPin
} from 'lucide-react';

interface NavbarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentPage }) => {
  const { user, role, logout } = useAuth();
  const { unreadCount, setIsDrawerOpen } = useNotifications();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getDashboardPage = () => {
    switch (role) {
      case 'citizen': return 'citizen';
      case 'pri_ulb_official': return 'panchayat';
      case 'university_admin': return 'university';
      case 'faculty': return 'university';
      case 'student': return 'student';
      case 'industry_partner': return 'industry';
      case 'govt_viewer': return 'govt';
      case 'super_admin': return 'admin';
      default: return 'citizen';
    }
  };

  const getDashboardLabel = () => {
    switch (role) {
      case 'citizen': return 'Citizen Workspace';
      case 'pri_ulb_official': return 'PRI / ULB Console';
      case 'university_admin': return 'Dean Dashboard';
      case 'faculty': return 'Faculty Portal';
      case 'student': return 'Student Workspace';
      case 'industry_partner': return 'CSR Hub';
      case 'govt_viewer': return 'State Command Center';
      case 'super_admin': return 'Super Admin Console';
      default: return 'Dashboard';
    }
  };

  return (
    <header
      style={{
        background: 'rgba(9, 13, 22, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'sticky',
        top: '38px', // directly beneath persona bar
        zIndex: 90,
      }}
    >
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '72px' }}>
        {/* Brand Logo */}
        <div
          onClick={() => onNavigate('home')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', cursor: 'pointer' }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #10b981, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(16, 185, 129, 0.4)',
            }}
          >
            <Sparkles size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em', color: '#ffffff' }}>
                JHARKHAND
              </span>
              <span className="text-gradient-emerald" style={{ fontWeight: 800, fontSize: '1.2rem' }}>
                INNOVATION
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '0.05rem 0.35rem', borderRadius: '4px', fontWeight: 600 }}>
                SIH 2026
              </span>
              <span>• AI Sourcing & Multi-Stakeholder Portal</span>
            </div>
          </div>
        </div>

        {/* Desktop Nav Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} className="desktop-nav">
          <button
            onClick={() => onNavigate('home')}
            className={`btn ${currentPage === 'home' ? 'btn-secondary' : 'btn-ghost'}`}
            style={{ fontSize: '0.9rem' }}
          >
            <Compass size={16} /> Discovery Portal
          </button>

          <button
            onClick={() => onNavigate(getDashboardPage())}
            className={`btn ${currentPage === getDashboardPage() ? 'btn-sapphire' : 'btn-secondary'}`}
            style={{ fontSize: '0.9rem', gap: '0.4rem' }}
          >
            <LayoutDashboard size={16} />
            <span>{getDashboardLabel()}</span>
          </button>

          {role === 'citizen' && (
            <button
              onClick={() => onNavigate('citizen-new')}
              className="btn btn-primary"
              style={{ fontSize: '0.9rem' }}
            >
              <PlusCircle size={16} /> Submit Problem
            </button>
          )}

          {role === 'industry_partner' && (
            <button
              onClick={() => onNavigate('industry')}
              className="btn btn-amber"
              style={{ fontSize: '0.9rem' }}
            >
              <Building2 size={16} /> CSR Opportunities
            </button>
          )}

          {(role === 'govt_viewer' || role === 'super_admin') && (
            <button
              onClick={() => onNavigate('govt')}
              className="btn btn-primary"
              style={{ fontSize: '0.9rem' }}
            >
              <Shield size={16} /> Statewide Heatmap
            </button>
          )}
        </nav>

        {/* User & Global Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="btn btn-ghost"
            style={{ padding: '0.5rem', borderRadius: 'var(--radius-full)', color: 'var(--text-secondary)' }}
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Notifications Bell */}
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="btn btn-ghost"
            style={{ padding: '0.5rem', borderRadius: 'var(--radius-full)', position: 'relative' }}
            title="Notifications"
          >
            <Bell size={19} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  background: 'var(--rose-500)',
                  color: '#ffffff',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 8px rgba(244, 63, 94, 0.6)',
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {/* User Profile info */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.35rem 0.75rem',
              background: 'var(--bg-glass)',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.85rem',
                color: '#ffffff',
              }}
            >
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name || 'User'}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {user?.district ? `${user.district}` : 'Jharkhand'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
