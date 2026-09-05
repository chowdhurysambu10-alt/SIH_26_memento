import React, { useState } from 'react';
import { X, ShieldCheck } from 'lucide-react';
import { authApi } from '../api/auth';
import { useAuth } from '../context/AuthContext';

interface VerificationRequestModalProps {
  onClose: () => void;
}

export const VerificationRequestModal: React.FC<VerificationRequestModalProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Institution State
  const [instRegId, setInstRegId] = useState('');
  const [mobile, setMobile] = useState('');
  const [principalName, setPrincipalName] = useState('');
  const [instAffiliation, setInstAffiliation] = useState('');

  // Student State
  const [studentId, setStudentId] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [dob, setDob] = useState('');
  const [collegeEmail, setCollegeEmail] = useState('');
  const [apaarId, setApaarId] = useState('');
  const [studentRegId, setStudentRegId] = useState('');
  const [studentAffiliation, setStudentAffiliation] = useState('');

  const isInstitution = user?.role === 'university_admin';
  const isStudent = user?.role === 'student';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let payload = {};
      
      if (isInstitution) {
        payload = {
          type: 'institution',
          registrationId: instRegId,
          mobileNumber: mobile,
          principalName: principalName,
          affiliation: instAffiliation,
        };
      } else if (isStudent) {
        payload = {
          type: 'student',
          studentId: studentId,
          collegeName: collegeName,
          dateOfBirth: dob,
          collegeEmail: collegeEmail,
          apaarId: apaarId,
          registrationId: studentRegId,
          affiliation: studentAffiliation,
        };
      }

      await authApi.submitVerificationRequest(payload);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit request');
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000 }}>
      <div className="modal-content" style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '500px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={24} color="#2563eb" />
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>Request Verification</h3>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <X size={20} color="#64748b" />
          </button>
        </div>

        {success ? (
          <div style={{ padding: '32px', textAlign: 'center', background: '#ecfdf5', borderRadius: '8px', color: '#065f46' }}>
            <ShieldCheck size={48} style={{ margin: '0 auto 16px' }} />
            <h4 style={{ margin: '0 0 8px', fontSize: '18px' }}>Request Submitted!</h4>
            <p style={{ margin: 0, opacity: 0.9 }}>Your verification request has been sent to the admin team for review.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>
              Please provide the following details to verify your {isInstitution ? 'institution' : 'student'} account.
            </p>

            {error && <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '12px', borderRadius: '6px', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}

            {isInstitution && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#475569', marginBottom: '4px' }}>Institution Registration ID *</label>
                  <input required type="text" value={instRegId} onChange={e => setInstRegId(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#475569', marginBottom: '4px' }}>Mobile Number *</label>
                  <input required type="tel" value={mobile} onChange={e => setMobile(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#475569', marginBottom: '4px' }}>Principal Name *</label>
                  <input required type="text" value={principalName} onChange={e => setPrincipalName(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#475569', marginBottom: '4px' }}>Under Affiliation (Optional)</label>
                  <input type="text" value={instAffiliation} onChange={e => setInstAffiliation(e.target.value)} style={inputStyle} />
                </div>
              </div>
            )}

            {isStudent && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#475569', marginBottom: '4px' }}>APAAR ID *</label>
                  <input required type="text" value={apaarId} onChange={e => setApaarId(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#475569', marginBottom: '4px' }}>Student ID *</label>
                  <input required type="text" value={studentId} onChange={e => setStudentId(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#475569', marginBottom: '4px' }}>College or School Name *</label>
                  <input required type="text" value={collegeName} onChange={e => setCollegeName(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#475569', marginBottom: '4px' }}>Date of Birth *</label>
                  <input required type="date" value={dob} onChange={e => setDob(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#475569', marginBottom: '4px' }}>Registration ID *</label>
                  <input required type="text" value={studentRegId} onChange={e => setStudentRegId(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#475569', marginBottom: '4px' }}>College Mail ID (Optional)</label>
                  <input type="email" value={collegeEmail} onChange={e => setCollegeEmail(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#475569', marginBottom: '4px' }}>College Affiliation (Optional)</label>
                  <input type="text" value={studentAffiliation} onChange={e => setStudentAffiliation(e.target.value)} style={inputStyle} />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '32px' }}>
              <button type="button" onClick={onClose} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>Cancel</button>
              <button type="submit" disabled={loading} style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer', fontWeight: 500 }}>
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '8px',
  border: '1px solid #cbd5e1',
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box' as const
};
