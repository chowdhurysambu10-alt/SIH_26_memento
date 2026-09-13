import React, { useState } from 'react';
import { X, User, Mail, Lock, ShieldAlert, CheckCircle } from 'lucide-react';
import { authApi, AuthUser } from '../api/auth';

interface ProfileModalProps {
  user: AuthUser;
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdate: (updatedUser: AuthUser) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, isOpen, onClose, onProfileUpdate }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');

  // Profile State
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Password State
  const [step, setStep] = useState<'request' | 'verify' | 'reset'>('request');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMessage, setPwdMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  if (!isOpen) return null;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMessage(null);
    try {
      const updatedUser = await authApi.updateProfile({ name, email });
      onProfileUpdate(updatedUser);
      setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err: any) {
      setProfileMessage({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleRequestOtp = async () => {
    setPwdLoading(true);
    setPwdMessage(null);
    try {
      await authApi.requestOtp(user.email);
      setStep('verify');
      setPwdMessage({ type: 'success', text: 'OTP sent to your email.' });
    } catch (err: any) {
      setPwdMessage({ type: 'error', text: err.message || 'Failed to send OTP' });
    } finally {
      setPwdLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdLoading(true);
    setPwdMessage(null);
    try {
      await authApi.verifyOtp(user.email, otp);
      setStep('reset');
      setPwdMessage({ type: 'success', text: 'OTP verified successfully. Now enter your new password.' });
    } catch (err: any) {
      setPwdMessage({ type: 'error', text: err.message || 'Failed to verify OTP' });
    } finally {
      setPwdLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdLoading(true);
    setPwdMessage(null);
    try {
      await authApi.resetPassword(user.email, newPassword);
      setPwdMessage({ type: 'success', text: 'Password reset successfully!' });
      setTimeout(() => {
        setStep('request');
        setOtp('');
        setNewPassword('');
        setPwdMessage(null);
      }, 3000);
    } catch (err: any) {
      setPwdMessage({ type: 'error', text: err.message || 'Failed to reset password' });
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
      <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '500px', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}>
        
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={20} color="#2563eb" /> Profile Settings
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', padding: '0 24px' }}>
          <button 
            onClick={() => setActiveTab('profile')}
            style={{ padding: '14px 20px', background: 'transparent', border: 'none', borderBottom: activeTab === 'profile' ? '2px solid #2563eb' : '2px solid transparent', color: activeTab === 'profile' ? '#2563eb' : '#64748b', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
          >
            Edit Profile
          </button>
          <button 
            onClick={() => setActiveTab('password')}
            style={{ padding: '14px 20px', background: 'transparent', border: 'none', borderBottom: activeTab === 'password' ? '2px solid #2563eb' : '2px solid transparent', color: activeTab === 'password' ? '#2563eb' : '#64748b', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
          >
            Change Password
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', overflowY: 'auto' }}>
          {activeTab === 'profile' ? (
            <form onSubmit={handleUpdateProfile}>
              {profileMessage && (
                <div style={{ padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', background: profileMessage.type === 'success' ? '#dcfce7' : '#fee2e2', color: profileMessage.type === 'success' ? '#166534' : '#991b1b' }}>
                  {profileMessage.type === 'success' ? <CheckCircle size={16} /> : <ShieldAlert size={16} />}
                  {profileMessage.text}
                </div>
              )}
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#475569' }}>Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
                  <input 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)}
                    style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} 
                    required 
                  />
                </div>
              </div>
              
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#475569' }}>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
                  <input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)}
                    style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} 
                    required 
                  />
                </div>
              </div>

              <button type="submit" disabled={profileLoading} style={{ width: '100%', padding: '12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: profileLoading ? 'not-allowed' : 'pointer', opacity: profileLoading ? 0.7 : 1 }}>
                {profileLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          ) : (
            <div>
              {pwdMessage && (
                <div style={{ padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', background: pwdMessage.type === 'success' ? '#dcfce7' : '#fee2e2', color: pwdMessage.type === 'success' ? '#166534' : '#991b1b' }}>
                  {pwdMessage.type === 'success' ? <CheckCircle size={16} /> : <ShieldAlert size={16} />}
                  {pwdMessage.text}
                </div>
              )}
              
              {step === 'request' ? (
                <div>
                  <p style={{ color: '#475569', fontSize: '14px', marginBottom: '20px', lineHeight: 1.5 }}>
                    To change your password, we'll send a one-time verification code (OTP) to your email address: <strong>{user.email}</strong>.
                  </p>
                  <button onClick={handleRequestOtp} disabled={pwdLoading} style={{ width: '100%', padding: '12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: pwdLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Mail size={16} /> {pwdLoading ? 'Sending...' : 'Send OTP to Email'}
                  </button>
                </div>
              ) : step === 'verify' ? (
                <form onSubmit={handleVerifyOtp}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#475569' }}>Enter OTP</label>
                    <input 
                      type="text" 
                      value={otp} 
                      onChange={e => setOtp(e.target.value)}
                      placeholder="6-digit code"
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', letterSpacing: '4px', textAlign: 'center', fontSize: '18px', fontWeight: 600 }} 
                      required 
                      maxLength={6}
                    />
                  </div>

                  <button type="submit" disabled={pwdLoading} style={{ width: '100%', padding: '12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: pwdLoading ? 'not-allowed' : 'pointer' }}>
                    {pwdLoading ? 'Verifying...' : 'Verify OTP'}
                  </button>
                  <button type="button" onClick={() => setStep('request')} style={{ width: '100%', padding: '12px', background: 'transparent', color: '#64748b', border: 'none', marginTop: '8px', fontSize: '13px', cursor: 'pointer' }}>
                    Go Back
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword}>
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#475569' }}>New Password</label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
                      <input 
                        type="password" 
                        value={newPassword} 
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} 
                        required 
                        minLength={6}
                      />
                    </div>
                  </div>

                  <button type="submit" disabled={pwdLoading} style={{ width: '100%', padding: '12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: pwdLoading ? 'not-allowed' : 'pointer' }}>
                    {pwdLoading ? 'Resetting...' : 'Set New Password'}
                  </button>
                  <button type="button" onClick={() => setStep('request')} style={{ width: '100%', padding: '12px', background: 'transparent', color: '#64748b', border: 'none', marginTop: '8px', fontSize: '13px', cursor: 'pointer' }}>
                    Go Back
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
