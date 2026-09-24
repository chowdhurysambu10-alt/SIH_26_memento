import React, { useEffect, useState } from 'react';
import { dashboardsApi, DashboardChallenge } from '../api/dashboards';
import { BookOpen, MapPin, Clock, ArrowRight, UserPlus, Award, CheckCircle, Search, Filter, Save, Bell, Mail, Download, RefreshCw, Copy, Trash, ArrowLeft, Send, Github, Linkedin, Link, Smartphone, User, Briefcase, FileText, X, Users, Trophy, Building2 } from 'lucide-react';
import { messagingApi, TempMessage } from '../api/messaging';
import { generateKeyPair, encryptMessage, decryptMessage } from '../utils/encryption';
import { authApi } from '../api/auth';
import { adminApi } from '../api/admin';
import { JHARKHAND_DISTRICTS } from '../constants/districts';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';

export const StudentDashboard: React.FC<{ activeView: string }> = ({ activeView }) => {
  const { user } = useAuth();
  const { showAlert, showConfirm } = useUI();
  const [myChallenges, setMyChallenges] = useState<DashboardChallenge[]>([]);
  const [opportunities, setOpportunities] = useState<DashboardChallenge[]>([]);
  const [selectedProject, setSelectedProject] = useState<DashboardChallenge | null>(null);
  const [loading, setLoading] = useState(false);

  // E2EE Temp Mail state
  const [alias, setAlias] = useState<string | null>(sessionStorage.getItem('student_temp_mail') || null);
  const [secretKey, setSecretKey] = useState<string | null>(sessionStorage.getItem('student_temp_mail_key') || null);
  const [aliasExpiry, setAliasExpiry] = useState<number | null>(parseInt(sessionStorage.getItem('student_temp_mail_expiry') || '0') || null);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [inboxMessages, setInboxMessages] = useState<any[]>([]);
  const [inboxLoading, setInboxLoading] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);
  
  // Compose state
  const [isComposing, setIsComposing] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  // Settings state
  const [fullName, setFullName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.contact || '');
  const [district, setDistrict] = useState(user?.district || '');
  const [savingSettings, setSavingSettings] = useState(false);

  // Verification state
  const [verificationForm, setVerificationForm] = useState({
    institution_name: '',
    student_id_card_url: ''
  });
  const [submittingVerification, setSubmittingVerification] = useState(false);

  // Autofill settings state
  const [autoEmail, setAutoEmail] = useState(() => localStorage.getItem('autofill_email') || '');
  const [autoMobile, setAutoMobile] = useState(() => localStorage.getItem('autofill_mobile') || '');
  const [autoAge, setAutoAge] = useState(() => localStorage.getItem('autofill_age') || '');
  const [autoGradYear, setAutoGradYear] = useState(() => localStorage.getItem('autofill_gradYear') || '');
  const [autoInstitution, setAutoInstitution] = useState(() => localStorage.getItem('autofill_institution') || '');
  const [autoMajor, setAutoMajor] = useState(() => localStorage.getItem('autofill_major') || '');
  const [autoCv, setAutoCv] = useState(() => localStorage.getItem('autofill_cv') || '');
  const [autoLinkedin, setAutoLinkedin] = useState(() => localStorage.getItem('autofill_linkedin') || '');
  const [autoGithub, setAutoGithub] = useState(() => localStorage.getItem('autofill_github') || '');
  const [autoPortfolio, setAutoPortfolio] = useState(() => localStorage.getItem('autofill_portfolio') || '');

  // Application form state
  const [appEmail, setAppEmail] = useState('');
  const [appMobile, setAppMobile] = useState('');
  const [appAge, setAppAge] = useState('');
  const [appGradYear, setAppGradYear] = useState('');
  const [appInstitution, setAppInstitution] = useState('');
  const [appMajor, setAppMajor] = useState('');
  const [appCv, setAppCv] = useState('');
  const [appLinkedin, setAppLinkedin] = useState('');
  const [appGithub, setAppGithub] = useState('');
  const [appPortfolio, setAppPortfolio] = useState('');
  const [appMotivation, setAppMotivation] = useState('');
  const [appRole, setAppRole] = useState('');
  const [appSolution, setAppSolution] = useState('');
  
  // Real Applications State
  const [myApplications, setMyApplications] = useState<any[]>([]);
  const [myAppsLoading, setMyAppsLoading] = useState(false);

  // Workspace Work Log state
  const [workLogEntry, setWorkLogEntry] = useState('');
  const [workLogProject, setWorkLogProject] = useState<string | null>(null);
  const [workLogs, setWorkLogs] = useState<Record<string, Array<{id: string, text: string, date: string}>>>({});

  // DB-backed milestone state (keyed by application id -> team.id)
  const [projectTeams, setProjectTeams] = useState<Record<string, any>>({}); // appId -> team object
  const [dbMilestones, setDbMilestones] = useState<Record<string, any[]>>({}); // appId -> milestones[]
  const [milestonesLoading, setMilestonesLoading] = useState<Record<string, boolean>>({});

  // Add milestone form state
  const [addingMilestone, setAddingMilestone] = useState<string | null>(null); // appId
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneDesc, setNewMilestoneDesc] = useState('');
  const [newMilestoneDue, setNewMilestoneDue] = useState('');
  const [savingMilestone, setSavingMilestone] = useState(false);

  // Deliverable submit state
  const [submittingDeliverable, setSubmittingDeliverable] = useState<string | null>(null); // milestoneId
  const [deliverableUrl, setDeliverableUrl] = useState('');
  const [deliverablesLoading, setDeliverablesLoading] = useState<Record<string, boolean>>({});

  // Team Roster state (JSON per project)
  type TeamMember = { id: string; name: string; role: string; note: string; joinedDate: string };
  const [teamRosters, setTeamRosters] = useState<Record<string, TeamMember[]>>({});
  const [addingMember, setAddingMember] = useState<string | null>(null); // projectId
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('');
  const [newMemberNote, setNewMemberNote] = useState('');
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);

  // Load work logs and team rosters from localStorage on mount
  useEffect(() => {
    const storedLogs = localStorage.getItem('memento_work_logs');
    const storedRosters = localStorage.getItem('memento_team_rosters');
    if (storedLogs) setWorkLogs(JSON.parse(storedLogs));
    if (storedRosters) setTeamRosters(JSON.parse(storedRosters));
  }, []);

  // Fetch real team + milestones from DB for a given app
  const fetchTeamAndMilestones = async (app: any) => {
    const challengeId = app.challenge_id || app.challenge?.id;
    if (!challengeId) return;
    setMilestonesLoading(prev => ({ ...prev, [app.id]: true }));
    try {
      const teams = await dashboardsApi.getTeamByChallenge(challengeId);
      if (teams && teams.length > 0) {
        const team = teams[0];
        setProjectTeams(prev => ({ ...prev, [app.id]: team }));
        // milestones are joined in getTeamByChallenge
        setDbMilestones(prev => ({ ...prev, [app.id]: team.milestones || [] }));
      }
    } catch (e) {
      console.error('Failed to fetch team/milestones:', e);
    }
    setMilestonesLoading(prev => ({ ...prev, [app.id]: false }));
  };

  const handleAddMilestone = async (app: any) => {
    if (!newMilestoneTitle.trim()) return;
    const team = projectTeams[app.id];
    if (!team?.id) {
      showAlert('No project team found for this application yet. A team must be assigned by your institution first.', 'error');
      return;
    }
    setSavingMilestone(true);
    try {
      const created = await dashboardsApi.createMilestone({
        project_id: team.id,
        title: newMilestoneTitle.trim(),
        description: newMilestoneDesc.trim() || undefined,
        due_date: newMilestoneDue || undefined,
      });
      setDbMilestones(prev => ({ ...prev, [app.id]: [...(prev[app.id] || []), created] }));
      setNewMilestoneTitle(''); setNewMilestoneDesc(''); setNewMilestoneDue('');
      setAddingMilestone(null);
      showAlert('Milestone created!', 'success');
    } catch (e: any) {
      showAlert(e.message || 'Failed to create milestone', 'error');
    }
    setSavingMilestone(false);
  };

  const handleSubmitDeliverable = async (app: any, milestoneId: string) => {
    if (!deliverableUrl.trim()) return;
    setDeliverablesLoading(prev => ({ ...prev, [milestoneId]: true }));
    try {
      const updated = await dashboardsApi.submitMilestoneDeliverable(milestoneId, deliverableUrl.trim());
      setDbMilestones(prev => ({
        ...prev,
        [app.id]: (prev[app.id] || []).map(m => m.id === milestoneId ? { ...m, ...updated } : m)
      }));
      setSubmittingDeliverable(null);
      setDeliverableUrl('');
      showAlert('Deliverable submitted for senior verification!', 'success');
    } catch (e: any) {
      showAlert(e.message || 'Failed to submit deliverable', 'error');
    }
    setDeliverablesLoading(prev => ({ ...prev, [milestoneId]: false }));
  };

  const addTeamMember = (projectId: string) => {
    if (!newMemberName.trim()) return;
    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: newMemberName.trim(),
      role: newMemberRole.trim() || 'Collaborator',
      note: newMemberNote.trim(),
      joinedDate: new Date().toLocaleDateString()
    };
    const updated = { ...teamRosters, [projectId]: [...(teamRosters[projectId] || []), newMember] };
    setTeamRosters(updated);
    localStorage.setItem('memento_team_rosters', JSON.stringify(updated));
    setNewMemberName(''); setNewMemberRole(''); setNewMemberNote('');
    setAddingMember(null);
  };

  const updateTeamMember = (projectId: string, memberId: string, field: keyof TeamMember, value: string) => {
    const updated = {
      ...teamRosters,
      [projectId]: (teamRosters[projectId] || []).map(m => m.id === memberId ? { ...m, [field]: value } : m)
    };
    setTeamRosters(updated);
    localStorage.setItem('memento_team_rosters', JSON.stringify(updated));
  };

  const deleteTeamMember = (projectId: string, memberId: string) => {
    const updated = {
      ...teamRosters,
      [projectId]: (teamRosters[projectId] || []).filter(m => m.id !== memberId)
    };
    setTeamRosters(updated);
    localStorage.setItem('memento_team_rosters', JSON.stringify(updated));
  };

  const downloadTeamPDF = (projectTitle: string, members: TeamMember[], selfName: string, selfRole: string) => {
    const allMembers = [
      { name: selfName, role: selfRole, note: 'Project owner / applicant', joinedDate: 'Project start' },
      ...members
    ];
    const rows = allMembers.map((m, i) =>
      `<tr style="background:${i % 2 === 0 ? '#f8fafc' : '#fff'}">
        <td style="padding:10px 14px;font-weight:600;color:#0f172a">${m.name}</td>
        <td style="padding:10px 14px;color:#3b82f6;font-weight:600">${m.role}</td>
        <td style="padding:10px 14px;color:#475569">${m.note || '—'}</td>
        <td style="padding:10px 14px;color:#94a3b8;font-size:12px">${m.joinedDate}</td>
      </tr>`
    ).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Team Roster – ${projectTitle}</title>
<style>body{font-family:Georgia,serif;margin:40px;color:#0f172a}h1{font-size:26px;margin-bottom:4px}p{color:#64748b;font-size:14px;margin:0 0 24px}table{width:100%;border-collapse:collapse;font-size:14px}th{background:#0f172a;color:#fff;padding:10px 14px;text-align:left;font-size:12px;letter-spacing:0.5px}td{border-bottom:1px solid #e2e8f0}footer{margin-top:40px;font-size:12px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:12px}</style>
</head><body>
<h1>Team Roster</h1><p>Project: <strong>${projectTitle}</strong> &nbsp;|&nbsp; Generated: ${new Date().toLocaleString()} &nbsp;|&nbsp; Powered by Memento</p>
<table><thead><tr><th>NAME</th><th>ROLE</th><th>NOTE</th><th>JOINED</th></tr></thead><tbody>${rows}</tbody></table>
<footer>This document was automatically generated by the Memento Student Portal. All information is stored locally on the student's device.</footer>
</body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, '_blank');
    if (w) { w.onload = () => { w.print(); }; }
  };

  const saveWorkLog = (projectId: string, text: string) => {
    if (!text.trim()) return;
    const newLog = { id: Date.now().toString(), text: text.trim(), date: new Date().toISOString() };
    const updated = { ...workLogs, [projectId]: [...(workLogs[projectId] || []), newLog] };
    setWorkLogs(updated);
    localStorage.setItem('memento_work_logs', JSON.stringify(updated));
    setWorkLogEntry('');
  };

  const deleteWorkLog = (projectId: string, logId: string) => {
    const updated = {
      ...workLogs,
      [projectId]: (workLogs[projectId] || []).filter(l => l.id !== logId)
    };
    setWorkLogs(updated);
    localStorage.setItem('memento_work_logs', JSON.stringify(updated));
  };

  useEffect(() => {
    const fetchMyChallenges = async () => {
      setLoading(true);
      try {
        const data = await dashboardsApi.getTopProblems({ limit: 50 });
        setMyChallenges(data.filter(c => c.user_id === user?.id || (c as any).submitted_by === user?.id));
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };

    const fetchOpportunities = async () => {
      setLoading(true);
      try {
        const data = await dashboardsApi.getClaimableChallenges();
        // Show all projects that have vacancies released
        setOpportunities(data);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };

    const fetchMyApps = async () => {
      setMyAppsLoading(true);
      try {
        const data = await dashboardsApi.getMyApplications();
        setMyApplications(data);
      } catch (e) {
        console.error(e);
      }
      setMyAppsLoading(false);
    };

    if (user?.id) {
      if (activeView === 'dashboard') fetchMyChallenges();
      if (activeView === 'apply-project') {
        fetchOpportunities();
        fetchMyApps();
      }
      if (activeView === 'my-applications' || activeView === 'portfolio' || activeView === 'workspace') fetchMyApps();
    }
  }, [user, activeView]);

  // Draft Auto-Save Effect
  useEffect(() => {
    if (activeView === 'apply-project' && selectedProject) {
      const draft = {
        appEmail, appMobile, appAge, appGradYear, appInstitution, appMajor, appCv,
        appLinkedin, appGithub, appPortfolio, appMotivation, appRole, appSolution
      };
      localStorage.setItem(`draft_app_${selectedProject.id}`, JSON.stringify(draft));
    }
  }, [appEmail, appMobile, appAge, appGradYear, appInstitution, appMajor, appCv, appLinkedin, appGithub, appPortfolio, appMotivation, appRole, appSolution, activeView, selectedProject]);

  const generateAlias = async () => {
    setInboxLoading(true);
    try {
      const { publicKey, privateKey } = await generateKeyPair();
      const res = await messagingApi.generateAlias(publicKey);
      
      setAlias(res.alias_id);
      setSecretKey(privateKey);
      
      const expiryTime = Date.now() + 10 * 60 * 1000;
      setAliasExpiry(expiryTime);
      
      sessionStorage.setItem('student_temp_mail', res.alias_id);
      sessionStorage.setItem('student_temp_mail_key', privateKey);
      sessionStorage.setItem('student_temp_mail_expiry', expiryTime.toString());
      
      setInboxMessages([]);
      setSelectedMessage(null);
      showAlert('New secure alias generated!', 'success');
    } catch (err) {
      console.error(err);
      showAlert('Failed to generate alias', 'error');
    }
    setInboxLoading(false);
  };

  const fetchInbox = async () => {
    if (!alias || !secretKey) return;
    setInboxLoading(true);
    try {
      const msgs = await messagingApi.getInbox();
      
      // Decrypt messages locally
      const decryptedMsgs = await Promise.all(msgs.map(async (msg) => {
        const decryptedSubject = await decryptMessage(msg.encrypted_subject, secretKey);
        const decryptedBody = await decryptMessage(msg.encrypted_body, secretKey);
        return {
          ...msg,
          subject: decryptedSubject,
          body: decryptedBody
        };
      }));
      
      setInboxMessages(decryptedMsgs);
    } catch (err) {
      console.error(err);
    }
    setInboxLoading(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTo) {
      showAlert('Recipient alias is required', 'error');
      return;
    }
    
    setSendingMessage(true);
    try {
      const recipientId = composeTo.trim();
      
      // Fetch the recipient's public key from the server
      const { public_key } = await messagingApi.getPublicKey(recipientId);
      
      // Encrypt with recipient's public key using hybrid encryption
      const encSubject = await encryptMessage(composeSubject, public_key);
      const encBody = await encryptMessage(composeBody, public_key);
      
      await messagingApi.sendMessage(recipientId, encSubject, encBody);
      showAlert('Encrypted message sent securely!', 'success');
      
      setIsComposing(false);
      setComposeTo('');
      setComposeSubject('');
      setComposeBody('');
    } catch (err) {
      console.error(err);
      showAlert('Failed to send message', 'error');
    }
    setSendingMessage(false);
  };

  useEffect(() => {
    if (activeView === 'mailing' && alias && secretKey) {
      fetchInbox();
    }
  }, [activeView, alias, secretKey]);

  useEffect(() => {
    if (!alias || !aliasExpiry) return;
    
    // Initial check
    if (aliasExpiry - Date.now() <= 0) {
      handleExpireAlias();
      return;
    }
    
    const interval = setInterval(() => {
      const remaining = aliasExpiry - Date.now();
      if (remaining <= 0) {
        clearInterval(interval);
        handleExpireAlias();
      } else {
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [alias, aliasExpiry]);

  const handleExpireAlias = async () => {
    try { await messagingApi.deleteAlias(); } catch (e) {}
    setAlias(null);
    setSecretKey(null);
    setAliasExpiry(null);
    sessionStorage.removeItem('student_temp_mail');
    sessionStorage.removeItem('student_temp_mail_key');
    sessionStorage.removeItem('student_temp_mail_expiry');
    showAlert('Your temporary mail has expired.', 'info');
  };

  const handleVolunteer = async (challengeId: string) => {
    const confirmed = await showConfirm('Are you sure you want to volunteer for this civic project? Your academic profile will be shared with the leading institution.');
    if (confirmed) {
      showAlert('Volunteer request sent successfully! You will be notified if selected.', 'success');
    }
  };

  const handleSaveAllSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    
    // Save Autofill
    localStorage.setItem('autofill_email', autoEmail);
    localStorage.setItem('autofill_mobile', autoMobile);
    localStorage.setItem('autofill_age', autoAge);
    localStorage.setItem('autofill_gradYear', autoGradYear);
    localStorage.setItem('autofill_institution', autoInstitution);
    localStorage.setItem('autofill_major', autoMajor);
    localStorage.setItem('autofill_cv', autoCv);
    localStorage.setItem('autofill_linkedin', autoLinkedin);
    localStorage.setItem('autofill_github', autoGithub);
    localStorage.setItem('autofill_portfolio', autoPortfolio);

    // Save DB
    try {
      await authApi.updateProfile({
        name: fullName,
        email: email,
        contact: phone,
        district: district,
      });
      if (user) {
        user.name = fullName;
        user.email = email;
        user.contact = phone;
        user.district = district;
      }
      showAlert('All settings saved successfully!', 'success');
    } catch (err: any) {
      console.error(err);
      showAlert(err.message || 'Failed to update database profile', 'error');
    }
    setSavingSettings(false);
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationForm.institution_name || !verificationForm.student_id_card_url) {
      alert('Please fill out all verification fields.');
      return;
    }
    setSubmittingVerification(true);
    try {
      await adminApi.submitStudentVerification(verificationForm.institution_name, verificationForm.student_id_card_url);
      alert('Verification request submitted successfully! An admin will review it shortly.');
      setVerificationForm({ institution_name: '', student_id_card_url: '' });
    } catch (err: any) {
      alert(err.message || 'Failed to submit verification request.');
    } finally {
      setSubmittingVerification(false);
    }
  };


  const handleUseAutofill = () => {
    setAppEmail(localStorage.getItem('autofill_email') || '');
    setAppMobile(localStorage.getItem('autofill_mobile') || '');
    setAppAge(localStorage.getItem('autofill_age') || '');
    setAppGradYear(localStorage.getItem('autofill_gradYear') || '');
    setAppInstitution(localStorage.getItem('autofill_institution') || '');
    setAppMajor(localStorage.getItem('autofill_major') || '');
    setAppCv(localStorage.getItem('autofill_cv') || '');
    setAppLinkedin(localStorage.getItem('autofill_linkedin') || '');
    setAppGithub(localStorage.getItem('autofill_github') || '');
    setAppPortfolio(localStorage.getItem('autofill_portfolio') || '');
  };

  // Opportunities section removed
  if (activeView === 'apply-project') {
    if (selectedProject) {
      const requiredFields = [appEmail, appMobile, appAge, appGradYear, appInstitution, appMajor, appCv, appMotivation, appRole, appSolution];
      const filledFieldsCount = requiredFields.filter(f => f.trim() !== '').length;
      const progressPercent = Math.round((filledFieldsCount / requiredFields.length) * 100);

      return (
        <div style={{ maxWidth: '800px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>Apply: {selectedProject.title}</h2>
              <p style={{ color: '#64748b', margin: 0 }}>Submit an application to lead or join this civic initiative.</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="button" onClick={handleUseAutofill} style={{ padding: '8px 16px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={16} /> Use Autofill
              </button>
              <button onClick={() => setSelectedProject(null)} style={{ padding: '8px 16px', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                Back to List
              </button>
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '32px' }}>
            {/* Progress Bar */}
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                <span>Application Progress</span>
                <span>{progressPercent}% Completed</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                <div className="progress-bar-fill" style={{ width: `${progressPercent}%`, height: '100%', background: progressPercent === 100 ? '#10b981' : '#3b82f6' }}></div>
              </div>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              const confirmed = await showConfirm('Submit your application for this project?');
              if (confirmed) {
                setLoading(true);
                try {
                  const payload = {
                    appEmail, appMobile, appAge, appGradYear, appInstitution, appMajor, appCv,
                    appLinkedin, appGithub, appPortfolio, appMotivation, appRole, appSolution
                  };
                  await dashboardsApi.applyToChallenge(selectedProject.id, payload);
                  
                  // Refetch applications so UI updates immediately
                  const updatedApps = await dashboardsApi.getMyApplications();
                  setMyApplications(updatedApps);
                  
                  showAlert('Project application submitted successfully!', 'success');
                  setSelectedProject(null);
                } catch (e) {
                  showAlert('Failed to submit application. Please try again.', 'error');
                }
                setLoading(false);
              }
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Email Address</label>
                    <input className="premium-input" type="email" value={appEmail} onChange={e => setAppEmail(e.target.value)} placeholder="your.email@example.com" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none' }} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Mobile Number</label>
                    <input className="premium-input" type="tel" value={appMobile} onChange={e => setAppMobile(e.target.value)} placeholder="+91 9876543210" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none' }} required />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Age</label>
                    <input className="premium-input" type="number" value={appAge} onChange={e => setAppAge(e.target.value)} placeholder="e.g. 21" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none' }} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Graduation Year</label>
                    <input className="premium-input" type="number" value={appGradYear} onChange={e => setAppGradYear(e.target.value)} placeholder="e.g. 2026" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none' }} required />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Institution Name</label>
                    <input className="premium-input" type="text" value={appInstitution} onChange={e => setAppInstitution(e.target.value)} placeholder="e.g. National Institute of Technology" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none' }} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Course / Major</label>
                    <input className="premium-input" type="text" value={appMajor} onChange={e => setAppMajor(e.target.value)} placeholder="e.g. Computer Science" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none' }} required />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>CV Link</label>
                    <input className="premium-input" type="url" value={appCv} onChange={e => setAppCv(e.target.value)} placeholder="https://..." style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none' }} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Portfolio (Optional)</label>
                    <input className="premium-input" type="url" value={appPortfolio} onChange={e => setAppPortfolio(e.target.value)} placeholder="https://..." style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>LinkedIn (Optional)</label>
                    <input className="premium-input" type="url" value={appLinkedin} onChange={e => setAppLinkedin(e.target.value)} placeholder="https://linkedin.com/in/..." style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>GitHub (Optional)</label>
                    <input className="premium-input" type="url" value={appGithub} onChange={e => setAppGithub(e.target.value)} placeholder="https://github.com/..." style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none' }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Why are you interested in this project?</label>
                  <textarea className="premium-input" value={appMotivation} onChange={e => setAppMotivation(e.target.value)} rows={3} placeholder="Briefly describe your motivation..." style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none', resize: 'vertical' }} required></textarea>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Intended Role & Contribution</label>
                  <textarea className="premium-input" value={appRole} onChange={e => setAppRole(e.target.value)} rows={3} placeholder="What specific tasks do you plan to take on? (e.g. Frontend Development, Data Collection, Project Management)..." style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none', resize: 'vertical' }} required></textarea>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Proposed Solution</label>
                  <textarea className="premium-input" value={appSolution} onChange={e => setAppSolution(e.target.value)} rows={4} placeholder="Describe the solution you have in mind to address this challenge..." style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none', resize: 'vertical' }} required></textarea>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                  <button type="submit" style={{ padding: '12px 24px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#1d4ed8'} onMouseLeave={e => e.currentTarget.style.background = '#2563eb'}>
                    Submit Application
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      );
    }

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>Open Projects</h2>
            <p style={{ color: '#64748b', margin: 0 }}>Browse and apply to civic initiatives.</p>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading projects...</div>
        ) : opportunities.length === 0 ? (
          <div style={{ padding: '48px', background: '#fff', borderRadius: '12px', border: '1px dashed #cbd5e1', textAlign: 'center', color: '#64748b' }}>
            No open projects available right now.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {opportunities.map(opp => (
              <div key={opp.id} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '20px', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <span style={{ fontSize: '12px', background: '#ecfdf5', color: '#059669', padding: '4px 10px', borderRadius: '12px', fontWeight: 600 }}>
                      {opp.category}
                    </span>
                    <span style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} /> {new Date(opp.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '0 0 12px', lineHeight: 1.4 }}>{opp.title}</h3>
                  <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 16px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {opp.description}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontSize: '13px', fontWeight: 500 }}>
                    <MapPin size={14} color="#64748b" /> {opp.district}
                  </div>
                </div>
                <div style={{ padding: '16px 20px', borderTop: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {(() => {
                    const existingApp = myApplications.find(a => a.challenge_id === opp.id || a.challenge?.id === opp.id);
                    if (existingApp) {
                      let statusColor = '#3b82f6';
                      let statusBg = '#eff6ff';
                      if (existingApp.status === 'approved' || existingApp.status === 'offered') {
                        statusColor = '#10b981';
                        statusBg = '#ecfdf5';
                      } else if (existingApp.status === 'rejected') {
                        statusColor = '#ef4444';
                        statusBg = '#fef2f2';
                      } else if (existingApp.status === 'waitlisted') {
                        statusColor = '#f59e0b';
                        statusBg = '#fffbeb';
                      }
                      
                      return (
                        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>Already Applied</span>
                          <span style={{ fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '12px', color: statusColor, background: statusBg, textTransform: 'uppercase' }}>
                            {existingApp.status === 'offered' ? 'APPROVED (OFFER)' : existingApp.status}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <button onClick={() => {
                        setSelectedProject(opp);
                        const savedDraft = localStorage.getItem(`draft_app_${opp.id}`);
                        if (savedDraft) {
                          try {
                            const draft = JSON.parse(savedDraft);
                            setAppEmail(draft.appEmail || ''); setAppMobile(draft.appMobile || ''); setAppAge(draft.appAge || '');
                            setAppGradYear(draft.appGradYear || ''); setAppInstitution(draft.appInstitution || ''); setAppMajor(draft.appMajor || '');
                            setAppCv(draft.appCv || ''); setAppLinkedin(draft.appLinkedin || ''); setAppGithub(draft.appGithub || '');
                            setAppPortfolio(draft.appPortfolio || ''); setAppMotivation(draft.appMotivation || ''); setAppRole(draft.appRole || '');
                            setAppSolution(draft.appSolution || '');
                          } catch (e) {}
                        } else {
                            setAppEmail(''); setAppMobile(''); setAppAge(''); setAppGradYear('');
                            setAppInstitution(''); setAppMajor(''); setAppCv(''); setAppLinkedin('');
                            setAppGithub(''); setAppPortfolio(''); setAppMotivation(''); setAppRole(''); setAppSolution('');
                        }
                      }} style={{ width: '100%', padding: '8px 16px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'background 0.2s' }}>
                        Apply Now
                      </button>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (activeView === 'my-applications') {
    return (
      <div>
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>My Applications</h2>
          <p style={{ fontSize: '15px', color: '#64748b', margin: 0 }}>Track the status of projects you have applied to join.</p>
        </div>
        {myAppsLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
            <p>Loading your applications...</p>
          </div>
        ) : myApplications.length === 0 ? (
          <div style={{ padding: '48px', background: '#fff', borderRadius: '12px', border: '1px dashed #cbd5e1', textAlign: 'center', color: '#64748b' }}>
            You haven't applied to any projects yet. Go to "Apply for a Project" to get started!
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {myApplications.map((app: any) => (
              <div key={app.id} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span style={{ fontSize: '12px', background: app.status === 'approved' ? '#dcfce7' : app.status === 'rejected' ? '#fee2e2' : app.status === 'waitlisted' ? '#e0e7ff' : '#fef3c7', color: app.status === 'approved' ? '#15803d' : app.status === 'rejected' ? '#b91c1c' : app.status === 'waitlisted' ? '#4338ca' : '#d97706', padding: '4px 10px', borderRadius: '12px', fontWeight: 700, textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {app.status === 'approved' && <CheckCircle size={14} />}
                    {app.status === 'rejected' && <X size={14} />}
                    {(app.status === 'pending' || app.status === 'waitlisted') && <Clock size={14} />}
                    {app.status}
                  </span>
                  <span style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} /> {new Date(app.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px', lineHeight: 1.4 }}>{app.challenge?.title || 'Unknown Project'}</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: 'auto', paddingTop: '16px' }}>
                  {app.app_role && <span style={{ fontSize: '12px', background: '#f1f5f9', color: '#475569', padding: '4px 8px', borderRadius: '4px' }}>Role: {app.app_role}</span>}
                  <span style={{ fontSize: '12px', background: '#f1f5f9', color: '#64748b', padding: '4px 8px', borderRadius: '4px' }}>ID: #{app.id.substring(0, 6)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (activeView === 'mailing') {
    const fullAlias = alias || '';
    
    return (
      <div style={{ maxWidth: '1000px', margin: '0 auto', height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>mmtomail</h2>
            <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>Secure, session-based end-to-end encrypted communication.</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {alias && !isComposing && !selectedMessage && (
              <>
                <button onClick={fetchInbox} disabled={inboxLoading} style={{ padding: '8px 16px', background: '#fff', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                  <RefreshCw size={16} className={inboxLoading ? "animate-spin" : ""} />
                  Refresh
                </button>
                <button onClick={() => setIsComposing(true)} style={{ padding: '8px 20px', background: '#c2e7ff', color: '#001d35', border: 'none', borderRadius: '16px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#b3d4ec'} onMouseLeave={e => e.currentTarget.style.background = '#c2e7ff'}>
                  <Send size={16} />
                  Compose
                </button>
              </>
            )}
          </div>
        </div>

        {!alias ? (
          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '64px 48px', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Mail size={56} color="#cbd5e1" style={{ marginBottom: '20px' }} />
            <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#334155', margin: '0 0 12px' }}>Welcome to Secure Mailing</h3>
            <p style={{ color: '#64748b', margin: '0 0 32px', fontSize: '15px', maxWidth: '400px' }}>Generate a secure alias to start sending and receiving end-to-end encrypted messages with project organizers.</p>
            <button onClick={generateAlias} disabled={inboxLoading} style={{ padding: '12px 32px', background: '#0b57d0', color: '#fff', border: 'none', borderRadius: '24px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s', opacity: inboxLoading ? 0.7 : 1 }} onMouseEnter={e => { if (!inboxLoading) e.currentTarget.style.background = '#0842a0' }} onMouseLeave={e => { if (!inboxLoading) e.currentTarget.style.background = '#0b57d0' }}>
              {inboxLoading ? 'Generating...' : 'Generate Secure Alias'}
            </button>
          </div>
        ) : isComposing ? (
          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px', background: '#f8fafc' }}>
              <button onClick={() => setIsComposing(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', padding: '8px', borderRadius: '50%', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <ArrowLeft size={20} />
              </button>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#1e293b' }}>New Message</h3>
            </div>
            <form onSubmit={handleSendMessage} style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '16px' }}>
                <input required type="text" placeholder="To: (Recipient Alias e.g. user@memento.com)" value={composeTo} onChange={e => setComposeTo(e.target.value)} style={{ width: '100%', border: 'none', fontSize: '15px', outline: 'none', color: '#1e293b' }} />
              </div>
              <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '16px' }}>
                <input required type="text" placeholder="Subject" value={composeSubject} onChange={e => setComposeSubject(e.target.value)} style={{ width: '100%', border: 'none', fontSize: '15px', outline: 'none', color: '#1e293b', fontWeight: 600 }} />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <textarea required placeholder="Write your message..." value={composeBody} onChange={e => setComposeBody(e.target.value)} style={{ width: '100%', flex: 1, border: 'none', fontSize: '15px', outline: 'none', resize: 'none', color: '#334155' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                <button type="submit" disabled={sendingMessage} style={{ padding: '10px 24px', background: '#0b57d0', color: '#fff', border: 'none', borderRadius: '24px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#0842a0'} onMouseLeave={e => e.currentTarget.style.background = '#0b57d0'}>
                  {sendingMessage ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
                  {sendingMessage ? 'Sending...' : 'Send'}
                </button>
              </div>
            </form>
          </div>
        ) : selectedMessage ? (
          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button onClick={() => setSelectedMessage(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', padding: '8px', borderRadius: '50%', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <ArrowLeft size={20} />
              </button>
            </div>
            <div style={{ padding: '24px 32px' }}>
              <h3 style={{ margin: '0 0 24px', fontSize: '22px', fontWeight: 600, color: '#1e293b' }}>{selectedMessage.subject || '(No Subject)'}</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, color: '#475569', fontSize: '16px' }}>
                    {(selectedMessage.sender?.full_name || 'U').charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '15px' }}>{selectedMessage.sender?.full_name || 'Unknown User'}</div>
                    <div style={{ color: '#64748b', fontSize: '13px' }}>to me</div>
                  </div>
                </div>
                <div style={{ color: '#64748b', fontSize: '13px' }}>
                  {new Date(selectedMessage.created_at).toLocaleString()}
                </div>
              </div>
              <div style={{ fontSize: '15px', color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {selectedMessage.body}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Your Secure Alias (Expires in <span style={{ color: '#ef4444' }}>{timeLeft}</span>)
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <code style={{ fontSize: '15px', fontWeight: 500, color: '#0f172a', background: '#e2e8f0', padding: '6px 12px', borderRadius: '6px', wordBreak: 'break-all' }}>{fullAlias}</code>
                  <button onClick={() => { navigator.clipboard.writeText(fullAlias); showAlert('Alias copied to clipboard!', 'success'); }} style={{ background: '#fff', border: '1px solid #cbd5e1', cursor: 'pointer', color: '#334155', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'} onMouseLeave={e => e.currentTarget.style.background = '#fff'} title="Copy to clipboard">
                    <Copy size={14} /> Copy
                  </button>
                </div>
              </div>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {inboxLoading && inboxMessages.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Decrypting messages...</div>
              ) : inboxMessages.length === 0 ? (
                <div style={{ padding: '80px 40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                    <Mail size={32} color="#94a3b8" />
                  </div>
                  <h3 style={{ margin: '0 0 8px', color: '#1e293b', fontWeight: 600, fontSize: '18px' }}>Your inbox is empty</h3>
                  <p style={{ color: '#64748b', margin: 0, fontSize: '15px' }}>Share your alias to receive encrypted messages.</p>
                </div>
              ) : (
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {inboxMessages.map((msg, idx) => (
                    <li key={msg.id} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                      <button onClick={() => setSelectedMessage(msg)} style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left', padding: '12px 24px', cursor: 'pointer', display: 'grid', gridTemplateColumns: '200px 1fr 100px', gap: '16px', alignItems: 'center', transition: 'box-shadow 0.2s' }} onMouseEnter={e => { e.currentTarget.style.boxShadow = 'inset 1px 0 0 #cbd5e1, inset -1px 0 0 #cbd5e1, 0 1px 2px 0 rgba(0,0,0,0.05)'; e.currentTarget.style.zIndex = '10'; e.currentTarget.style.position = 'relative'; }} onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.zIndex = '1'; }}>
                        <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{msg.sender?.full_name || 'Unknown'}</span>
                        <span style={{ fontSize: '14px', color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          <span style={{ fontWeight: 600, color: '#1e293b', marginRight: '6px' }}>{msg.subject || '(No Subject)'}</span>
                          <span style={{ color: '#94a3b8' }}>- {msg.body.substring(0, 60)}{msg.body.length > 60 ? '...' : ''}</span>
                        </span>
                        <span style={{ fontSize: '12px', color: '#64748b', textAlign: 'right', fontWeight: 500 }}>
                          {new Date(msg.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (activeView === 'workspace') {
    const activeProjects = myApplications.filter(app => app.status === 'approved' || app.status === 'offered');

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={24} color="#3b82f6" /> My Workspace
          </h2>
          <p style={{ color: '#64748b', margin: 0 }}>Track your active projects, log your work, and manage milestones.</p>
        </div>

        {myAppsLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading workspace...</div>
        ) : activeProjects.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#64748b', background: '#fff', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
            <Building2 size={48} color="#cbd5e1" style={{ marginBottom: '16px' }} />
            <p style={{ fontSize: '18px', fontWeight: 600, color: '#334155', margin: '0 0 8px' }}>No Active Projects</p>
            <p style={{ margin: 0 }}>Once your application is approved, your project workspace will appear here.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {activeProjects.map(app => {
              const projectMs = dbMilestones[app.id] || [];
              const completedCount = projectMs.filter(m => m.status === 'completed' || m.approval_status === 'approved').length;
              const progressPct = projectMs.length > 0 ? Math.round((completedCount / projectMs.length) * 100) : 0;

              // Fetch team/milestones if not yet loaded
              if (!projectTeams[app.id] && !milestonesLoading[app.id]) {
                fetchTeamAndMilestones(app);
              }

              const approvalColor = (s: string) => s === 'approved' ? '#10b981' : s === 'rejected' ? '#ef4444' : '#f59e0b';
              const approvalLabel = (s: string) => s === 'approved' ? 'Approved ✓' : s === 'rejected' ? 'Rejected ✗' : 'Pending Review';
              const statusColor = (s: string) => s === 'completed' ? '#10b981' : s === 'submitted' ? '#6366f1' : s === 'in_progress' ? '#3b82f6' : '#94a3b8';

              return (
                <div key={app.id} style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                  {/* Header */}
                  <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)', padding: '24px', color: '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span style={{ fontSize: '11px', background: 'rgba(59,130,246,0.35)', padding: '4px 10px', borderRadius: '12px', fontWeight: 700, marginBottom: '12px', display: 'inline-block', letterSpacing: '1px' }}>
                          ACTIVE PROJECT
                        </span>
                        <h3 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 8px' }}>{app.challenge?.title || 'Community Initiative'}</h3>
                        <p style={{ color: '#94a3b8', margin: 0, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
                          <Briefcase size={15} /> Role: <strong style={{ color: '#e2e8f0' }}>{app.app_role || 'Collaborator'}</strong>
                          <span style={{ marginLeft: '16px', color: '#64748b' }}>Applied: {new Date(app.created_at).toLocaleDateString()}</span>
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '28px', fontWeight: 800, color: progressPct === 100 ? '#10b981' : '#3b82f6' }}>{progressPct}%</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>MILESTONE PROGRESS</div>
                        <div style={{ marginTop: '8px', width: '120px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${progressPct}%`, height: '100%', background: progressPct === 100 ? '#10b981' : '#3b82f6', transition: 'width 0.4s ease' }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

                    {/* Left: Milestones (DB-backed) */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <CheckCircle size={17} color="#10b981" /> Milestones ({completedCount}/{projectMs.length})
                        </h4>
                        <button
                          onClick={() => { setAddingMilestone(app.id); }}
                          style={{ padding: '6px 14px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                        >
                          + Add Milestone
                        </button>
                      </div>

                      {/* Add Milestone Form (DB) */}
                      {addingMilestone === app.id && (
                        <div style={{ background: '#f0fdf4', borderRadius: '10px', padding: '14px', marginBottom: '14px', border: '1px solid #bbf7d0' }}>
                          <input
                            value={newMilestoneTitle}
                            onChange={e => setNewMilestoneTitle(e.target.value)}
                            placeholder="Milestone title *"
                            style={{ width: '100%', padding: '8px 12px', border: '1px solid #86efac', borderRadius: '6px', fontSize: '14px', marginBottom: '8px', outline: 'none', boxSizing: 'border-box' }}
                          />
                          <textarea
                            value={newMilestoneDesc}
                            onChange={e => setNewMilestoneDesc(e.target.value)}
                            placeholder="Description — explain what this milestone involves..."
                            rows={2}
                            style={{ width: '100%', padding: '8px 12px', border: '1px solid #86efac', borderRadius: '6px', fontSize: '13px', marginBottom: '8px', outline: 'none', boxSizing: 'border-box', resize: 'none', fontFamily: 'inherit' }}
                          />
                          <input
                            type="date"
                            value={newMilestoneDue}
                            onChange={e => setNewMilestoneDue(e.target.value)}
                            style={{ width: '100%', padding: '7px 12px', border: '1px solid #86efac', borderRadius: '6px', fontSize: '13px', marginBottom: '10px', outline: 'none', boxSizing: 'border-box', color: '#334155' }}
                          />
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => handleAddMilestone(app)} disabled={savingMilestone} style={{ padding: '6px 16px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', opacity: savingMilestone ? 0.7 : 1 }}>
                              {savingMilestone ? 'Saving...' : 'Save'}
                            </button>
                            <button onClick={() => { setAddingMilestone(null); setNewMilestoneTitle(''); setNewMilestoneDesc(''); setNewMilestoneDue(''); }} style={{ padding: '6px 16px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                          </div>
                        </div>
                      )}

                      {milestonesLoading[app.id] ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>Loading milestones from database...</div>
                      ) : projectMs.length === 0 ? (
                        <div style={{ padding: '32px', textAlign: 'center', border: '1px dashed #cbd5e1', borderRadius: '10px', color: '#94a3b8' }}>
                          <CheckCircle size={28} color="#cbd5e1" style={{ marginBottom: '8px' }} />
                          <p style={{ margin: 0, fontSize: '14px' }}>No milestones yet. Add one above — it saves directly to the database.</p>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '420px', overflowY: 'auto' }}>
                          {projectMs.map(m => (
                            <div key={m.id} style={{ background: '#f8fafc', borderRadius: '12px', border: `1px solid ${m.approval_status === 'approved' ? '#bbf7d0' : m.approval_status === 'rejected' ? '#fecaca' : m.status === 'submitted' ? '#e0e7ff' : '#e2e8f0'}`, overflow: 'hidden' }}>
                              {/* Milestone header row */}
                              <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0, background: statusColor(m.status), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      {(m.status === 'completed' || m.approval_status === 'approved') && <CheckCircle size={11} color="#fff" />}
                                    </div>
                                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.title}</span>
                                  </div>
                                  {m.description && (
                                    <p style={{ margin: '0 0 6px 26px', fontSize: '12px', color: '#64748b', lineHeight: 1.4 }}>{m.description}</p>
                                  )}
                                  <div style={{ display: 'flex', gap: '10px', marginLeft: '26px', flexWrap: 'wrap' }}>
                                    {m.due_date && (
                                      <span style={{ fontSize: '11px', color: '#475569', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                        <Clock size={10} /> Due: {new Date(m.due_date).toLocaleDateString()}
                                      </span>
                                    )}
                                    <span style={{ fontSize: '11px', fontWeight: 700, color: statusColor(m.status), textTransform: 'uppercase' }}>{m.status?.replace('_', ' ')}</span>
                                    <span style={{ fontSize: '11px', fontWeight: 700, color: approvalColor(m.approval_status || 'pending') }}>
                                      {approvalLabel(m.approval_status || 'pending')}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Approval notes from senior */}
                              {m.approval_notes && (
                                <div style={{ padding: '8px 14px', borderTop: '1px solid #e2e8f0', background: m.approval_status === 'approved' ? '#f0fdf4' : m.approval_status === 'rejected' ? '#fff1f2' : '#fffbeb', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                                  <span style={{ fontSize: '11px', fontWeight: 700, color: approvalColor(m.approval_status), flexShrink: 0, marginTop: '1px' }}>SENIOR NOTE:</span>
                                  <span style={{ fontSize: '12px', color: '#475569', fontStyle: 'italic', lineHeight: 1.4 }}>{m.approval_notes}</span>
                                </div>
                              )}

                              {/* Deliverable section */}
                              <div style={{ padding: '10px 14px', borderTop: '1px solid #f1f5f9', background: '#fff' }}>
                                {m.deliverable_url ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <a href={m.deliverable_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                      📎 {m.deliverable_url}
                                    </a>
                                    <span style={{ fontSize: '11px', color: '#64748b', flexShrink: 0 }}>Submitted</span>
                                  </div>
                                ) : submittingDeliverable === m.id ? (
                                  <div style={{ display: 'flex', gap: '6px' }}>
                                    <input
                                      value={deliverableUrl}
                                      onChange={e => setDeliverableUrl(e.target.value)}
                                      placeholder="Paste link (Google Drive, GitHub, etc.)..."
                                      style={{ flex: 1, border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px 10px', fontSize: '12px', outline: 'none' }}
                                    />
                                    <button onClick={() => handleSubmitDeliverable(app, m.id)} disabled={deliverablesLoading[m.id]} style={{ padding: '6px 12px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', opacity: deliverablesLoading[m.id] ? 0.7 : 1, whiteSpace: 'nowrap' }}>
                                      {deliverablesLoading[m.id] ? '...' : 'Submit'}
                                    </button>
                                    <button onClick={() => { setSubmittingDeliverable(null); setDeliverableUrl(''); }} style={{ padding: '6px 10px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>✕</button>
                                  </div>
                                ) : (
                                  <button onClick={() => { setSubmittingDeliverable(m.id); setDeliverableUrl(''); }} style={{ fontSize: '12px', color: '#6366f1', background: 'none', border: '1px dashed #c7d2fe', borderRadius: '6px', padding: '5px 12px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <ArrowRight size={12} /> Submit for Senior Verification
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Right: Work Log + Team Roster */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                      {/* Work Log */}
                      <div>
                        <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FileText size={17} color="#3b82f6" /> Work Log
                        </h4>
                        <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '14px', marginBottom: '12px', border: '1px solid #e2e8f0' }}>
                          <textarea
                            value={workLogProject === app.id ? workLogEntry : ''}
                            onChange={e => { setWorkLogProject(app.id); setWorkLogEntry(e.target.value); }}
                            onFocus={() => setWorkLogProject(app.id)}
                            placeholder="What did you work on today? Describe in plain English..."
                            rows={3}
                            style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', resize: 'none', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', color: '#334155' }}
                          />
                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                            <button
                              onClick={() => saveWorkLog(app.id, workLogProject === app.id ? workLogEntry : '')}
                              style={{ padding: '7px 18px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                              <Save size={13} /> Log Work
                            </button>
                          </div>
                        </div>
                        {(workLogs[app.id] || []).length === 0 ? (
                          <div style={{ padding: '16px', textAlign: 'center', border: '1px dashed #cbd5e1', borderRadius: '10px', color: '#94a3b8', fontSize: '13px' }}>
                            No entries yet. Start logging your work above!
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                            {[...(workLogs[app.id] || [])].reverse().map(log => (
                              <div key={log.id} style={{ background: '#fff', borderRadius: '8px', padding: '10px 12px', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    {new Date(log.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                  </span>
                                  <button onClick={() => deleteWorkLog(app.id, log.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '0', display: 'flex' }}>
                                    <X size={13} />
                                  </button>
                                </div>
                                <p style={{ margin: 0, fontSize: '13px', color: '#334155', lineHeight: 1.5 }}>{log.text}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Team Roster */}
                      {(() => {
                        const roster = teamRosters[app.id] || [];
                        return (
                          <div style={{ background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                            {/* Panel header */}
                            <div style={{ padding: '12px 16px', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Users size={16} color="#6366f1" /> Team Roster
                                <span style={{ fontSize: '11px', fontWeight: 600, background: '#e0e7ff', color: '#4338ca', padding: '2px 8px', borderRadius: '10px' }}>
                                  {roster.length + 1} members
                                </span>
                              </h4>
                              <button
                                onClick={() => downloadTeamPDF(app.challenge?.title || 'Project', roster, user?.name || 'You', app.app_role || 'Collaborator')}
                                style={{ padding: '5px 12px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '7px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                                title="Download as printable PDF"
                              >
                                <Download size={12} /> Team PDF
                              </button>
                            </div>

                            {/* Current user (self) */}
                            <div style={{ padding: '10px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px', background: '#eef2ff' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#6366f1', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px', flexShrink: 0 }}>
                                {(user?.name || 'U')[0].toUpperCase()}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>{user?.name || 'You'} <span style={{ fontSize: '11px', color: '#6366f1', fontWeight: 600, background: '#e0e7ff', padding: '1px 6px', borderRadius: '8px', marginLeft: '4px' }}>You</span></p>
                                <p style={{ margin: 0, fontSize: '12px', color: '#4338ca' }}>{app.app_role || 'Collaborator'}</p>
                              </div>
                            </div>

                            {/* Other members */}
                            <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                              {roster.map(m => (
                                <div key={m.id} style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                  <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#94a3b8', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px', flexShrink: 0 }}>
                                    {m.name[0].toUpperCase()}
                                  </div>
                                  {editingMemberId === m.id ? (
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                      <input value={m.name} onChange={e => updateTeamMember(app.id, m.id, 'name', e.target.value)} style={{ border: '1px solid #cbd5e1', borderRadius: '5px', padding: '4px 8px', fontSize: '13px', width: '100%', outline: 'none', boxSizing: 'border-box' }} placeholder="Name" />
                                      <input value={m.role} onChange={e => updateTeamMember(app.id, m.id, 'role', e.target.value)} style={{ border: '1px solid #cbd5e1', borderRadius: '5px', padding: '4px 8px', fontSize: '12px', width: '100%', outline: 'none', boxSizing: 'border-box', color: '#6366f1' }} placeholder="Role" />
                                      <input value={m.note} onChange={e => updateTeamMember(app.id, m.id, 'note', e.target.value)} style={{ border: '1px solid #cbd5e1', borderRadius: '5px', padding: '4px 8px', fontSize: '12px', width: '100%', outline: 'none', boxSizing: 'border-box', color: '#64748b' }} placeholder="Note (e.g. handles frontend)" />
                                      <button onClick={() => setEditingMemberId(null)} style={{ alignSelf: 'flex-start', padding: '3px 10px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Done</button>
                                    </div>
                                  ) : (
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>{m.name}</p>
                                      <p style={{ margin: '1px 0', fontSize: '12px', color: '#6366f1', fontWeight: 600 }}>{m.role}</p>
                                      {m.note && <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>{m.note}</p>}
                                    </div>
                                  )}
                                  <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                                    <button onClick={() => setEditingMemberId(editingMemberId === m.id ? null : m.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6366f1', padding: '2px', fontSize: '11px', fontWeight: 600 }} title="Edit">✎</button>
                                    <button onClick={() => deleteTeamMember(app.id, m.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '2px', display: 'flex' }} title="Remove"><X size={13} /></button>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div style={{ padding: '10px 16px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', color: '#64748b', fontSize: '11px', textAlign: 'center' }}>
                              Team members can only be added by your institution.
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if (activeView === 'portfolio') {
    const grantedApps = myApplications.filter(app => app.status === 'approved' || app.status === 'offered');

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trophy size={24} color="#f59e0b" /> Certifications & Portfolio
          </h2>
          <p style={{ color: '#64748b', margin: 0 }}>Showcase your verified achievements and granted opportunities through Memento.</p>
        </div>

        {myAppsLoading ? (
          <div style={{ padding: '20px', color: '#64748b' }}>Loading certificates...</div>
        ) : grantedApps.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#64748b', background: '#fff', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
            <Trophy size={48} color="#cbd5e1" style={{ marginBottom: '16px' }} />
            <p style={{ fontSize: '18px', fontWeight: 600, color: '#334155', margin: '0 0 8px' }}>No Certifications Yet</p>
            <p style={{ margin: 0 }}>When your applications are approved or you accept an offer, your official Memento certificates will appear here.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(600px, 1fr))', gap: '24px' }}>
            {grantedApps.map(app => (
              <div key={app.id} style={{
                position: 'relative',
                background: '#fff',
                padding: '16px',
                borderRadius: '8px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                margin: '0 auto',
                maxWidth: '900px',
                width: '100%',
              }}>
                <div style={{
                  position: 'relative',
                  background: 'linear-gradient(to bottom right, #fdfbfb, #f3f4f6)',
                  border: '12px solid #0f172a',
                  padding: '60px 40px',
                  textAlign: 'center',
                  overflow: 'hidden'
                }}>
                  {/* Decorative corner borders */}
                  <div style={{ position: 'absolute', top: '12px', left: '12px', width: '40px', height: '40px', borderTop: '4px solid #d4af37', borderLeft: '4px solid #d4af37' }}></div>
                  <div style={{ position: 'absolute', top: '12px', right: '12px', width: '40px', height: '40px', borderTop: '4px solid #d4af37', borderRight: '4px solid #d4af37' }}></div>
                  <div style={{ position: 'absolute', bottom: '12px', left: '12px', width: '40px', height: '40px', borderBottom: '4px solid #d4af37', borderLeft: '4px solid #d4af37' }}></div>
                  <div style={{ position: 'absolute', bottom: '12px', right: '12px', width: '40px', height: '40px', borderBottom: '4px solid #d4af37', borderRight: '4px solid #d4af37' }}></div>
                  
                  {/* Background Watermark */}
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.03, pointerEvents: 'none' }}>
                    <Award size={400} color="#0f172a" />
                  </div>

                  <div style={{ marginBottom: '40px', position: 'relative', zIndex: 2 }}>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                      <div style={{ height: '2px', width: '60px', background: '#d4af37' }}></div>
                      <Award size={56} color="#d4af37" />
                      <div style={{ height: '2px', width: '60px', background: '#d4af37' }}></div>
                    </div>
                    <h3 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '42px', color: '#0f172a', margin: '0 0 12px', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: 800 }}>
                      Certificate of Appointment
                    </h3>
                    <p style={{ color: '#b45309', textTransform: 'uppercase', fontSize: '14px', letterSpacing: '4px', fontWeight: 700, margin: 0 }}>
                      Official Document by the Memento Foundation
                    </p>
                  </div>

                  <div style={{ margin: '48px 0', position: 'relative', zIndex: 2 }}>
                    <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', color: '#475569', margin: '0 0 24px', fontSize: '18px' }}>
                      This document formally recognizes and certifies that
                    </p>
                    <h4 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '48px', color: '#1e293b', margin: '0 0 24px', borderBottom: '2px dashed #d4af37', paddingBottom: '12px', display: 'inline-block', fontWeight: 700 }}>
                      {user?.name || 'Student Participant'}
                    </h4>
                    <p style={{ fontFamily: 'Georgia, serif', color: '#334155', margin: '24px auto', fontSize: '18px', lineHeight: '1.8', maxWidth: '700px' }}>
                      Has demonstrated exceptional merit and has been officially granted the opportunity to serve in the esteemed capacity of 
                      <strong style={{ color: '#0f172a', fontSize: '20px', display: 'block', margin: '8px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>{app.app_role || 'Project Collaborator'}</strong>
                      In recognition of their commitment to civic duty, they shall contribute their expertise to the societal innovation initiative entitled:
                      <strong style={{ color: '#0f172a', fontSize: '22px', display: 'block', margin: '12px 0 0', fontFamily: '"Playfair Display", Georgia, serif' }}>"{app.challenge?.title || 'Community Project'}"</strong>
                    </p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '64px', padding: '0 40px', position: 'relative', zIndex: 2 }}>
                    <div style={{ textAlign: 'center', width: '200px' }}>
                      <div style={{ borderBottom: '1px solid #1e293b', paddingBottom: '8px', marginBottom: '12px' }}>
                        <p style={{ color: '#0f172a', fontSize: '16px', margin: 0, fontFamily: 'monospace', fontWeight: 600 }}>
                          {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <p style={{ color: '#64748b', fontSize: '11px', margin: 0, fontWeight: 700, letterSpacing: '2px' }}>DATE OF ISSUANCE</p>
                    </div>

                    <div style={{ textAlign: 'center', width: '200px' }}>
                      <div style={{ borderBottom: '1px solid #1e293b', paddingBottom: '8px', marginBottom: '12px' }}>
                        <p style={{ color: '#0f172a', fontSize: '14px', margin: 0, fontFamily: 'monospace', fontWeight: 600, wordBreak: 'break-all' }}>
                          {app.id}
                        </p>
                      </div>
                      <p style={{ color: '#64748b', fontSize: '11px', margin: 0, fontWeight: 700, letterSpacing: '2px' }}>CERTIFICATE NUMBER</p>
                    </div>

                    <div style={{ textAlign: 'center', width: '200px' }}>
                      <div style={{ borderBottom: '1px solid #1e293b', paddingBottom: '8px', marginBottom: '12px' }}>
                        <p style={{ color: '#0f172a', fontSize: '16px', margin: 0, fontWeight: 700, textTransform: 'uppercase' }}>
                          Memento Directors
                        </p>
                      </div>
                      <p style={{ color: '#64748b', fontSize: '11px', margin: 0, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase' }}>Authorized by</p>
                    </div>
                  </div>

                  <div style={{ marginTop: '48px', display: 'flex', justifyContent: 'center', gap: '16px', position: 'relative', zIndex: 2 }}>
                    <button style={{ padding: '10px 24px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                      <Download size={16} /> Download PDF
                    </button>
                    <button style={{ padding: '10px 24px', background: '#fff', color: '#0f172a', border: '2px solid #0f172a', borderRadius: '4px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                      <Linkedin size={16} /> Share to LinkedIn
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }



  if (activeView === 'settings') {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '60px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>Account Settings</h2>
        
        <form onSubmit={handleSaveAllSettings} style={{ display: 'flex', flexDirection: 'column', gap: '32px', marginTop: '24px' }}>
          
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '32px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '0 0 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={20} color="#3b82f6" /> Personal Profile (Database)
            </h3>
            <p style={{ color: '#64748b', marginBottom: '24px', fontSize: '14px', marginTop: '-16px' }}>Update your core account details securely stored in our system.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Full Name</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="Your Full Name" style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none' }} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="your.email@example.com" style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Phone Number (Optional)</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 9876543210" style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>District</label>
                <select value={district} onChange={e => setDistrict(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none', background: '#fff' }}>
                  <option value="">Select a District</option>
                  {JHARKHAND_DISTRICTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '32px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '0 0 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={20} color="#10b981" /> Application Autofill (Local Storage)
            </h3>
            <p style={{ color: '#64748b', marginBottom: '24px', fontSize: '14px', marginTop: '-16px' }}>This data is saved locally on your device and can be used to quickly fill out project applications.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Email Address</label>
                <input type="email" value={autoEmail} onChange={e => setAutoEmail(e.target.value)} placeholder="your.email@example.com" style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Mobile Number</label>
                <input type="tel" value={autoMobile} onChange={e => setAutoMobile(e.target.value)} placeholder="+91 9876543210" style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Age</label>
                <input type="number" value={autoAge} onChange={e => setAutoAge(e.target.value)} placeholder="21" style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Graduation Year</label>
                <input type="number" value={autoGradYear} onChange={e => setAutoGradYear(e.target.value)} placeholder="2026" style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none' }} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Institution Name</label>
                <input type="text" value={autoInstitution} onChange={e => setAutoInstitution(e.target.value)} placeholder="National Institute of Technology" style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Course / Major</label>
                <input type="text" value={autoMajor} onChange={e => setAutoMajor(e.target.value)} placeholder="Computer Science" style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>CV Link</label>
                <input type="url" value={autoCv} onChange={e => setAutoCv(e.target.value)} placeholder="https://..." style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Portfolio (Optional)</label>
                <input type="url" value={autoPortfolio} onChange={e => setAutoPortfolio(e.target.value)} placeholder="https://..." style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>LinkedIn (Optional)</label>
                <input type="url" value={autoLinkedin} onChange={e => setAutoLinkedin(e.target.value)} placeholder="https://linkedin.com/in/..." style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>GitHub (Optional)</label>
                <input type="url" value={autoGithub} onChange={e => setAutoGithub(e.target.value)} placeholder="https://github.com/..." style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none' }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button type="submit" disabled={savingSettings} style={{ padding: '14px 32px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 600, cursor: savingSettings ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', transition: 'transform 0.1s, background 0.2s', opacity: savingSettings ? 0.7 : 1 }} onMouseEnter={e => { if(!savingSettings) e.currentTarget.style.background = '#1e293b' }} onMouseLeave={e => { if(!savingSettings) e.currentTarget.style.background = '#0f172a' }}>
              {savingSettings ? <RefreshCw size={20} className="animate-spin" /> : <Save size={20} />} 
              {savingSettings ? 'Saving...' : 'Save All Changes'}
            </button>
          </div>
        </form>

      </div>
    );
  }

  return null;
};
