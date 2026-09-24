import React, { useEffect, useState, useCallback } from 'react';
import { dashboardsApi, DashboardChallenge } from '../api/dashboards';
import { adminApi } from '../api/admin';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { 
  Building2, CheckCircle, Clock, FileText, ArrowRight, ShieldCheck, AlertCircle, 
  Bell, Lock, Mail, Users, Save, Download, MapPin, ClipboardList, Handshake,
  Search, Filter, Check, X, ExternalLink, GraduationCap, Briefcase, Phone, UserCheck, Eye, RefreshCw, UserPlus, Send
} from 'lucide-react';

interface InstitutionDashboardProps {
  activeView: string;
  setActiveView?: (view: string) => void;
}

export const InstitutionDashboard: React.FC<InstitutionDashboardProps> = ({ activeView, setActiveView }) => {
  const { user } = useAuth();
  const { showAlert } = useUI();
  const [challenges, setChallenges] = useState<DashboardChallenge[]>([]);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [filterTab, setFilterTab] = useState<'all' | 'verified' | 'pending' | 'available' | 'proposals'>('all');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    JSON.parse(localStorage.getItem('inst_categories') || '["Education", "Agriculture", "Healthcare"]')
  );
  const [summaryEnabled, setSummaryEnabled] = useState(localStorage.getItem('inst_summary') === 'true');
  const [emailNotifications, setEmailNotifications] = useState(localStorage.getItem('inst_email') !== 'false');
  const [inPlatformAlerts, setInPlatformAlerts] = useState(localStorage.getItem('inst_alerts') !== 'false');
  
  // Requests & Offers state
  const [studentReviewTab, setStudentReviewTab] = useState<'requests' | 'offers'>('requests');
  const [offerSubTab, setOfferSubTab] = useState<'sent' | 'received'>('sent');
  const [requestSubTab, setRequestSubTab] = useState<'received' | 'sent'>('received');
  const [offerForm, setOfferForm] = useState({ studentEmail: '', challengeId: '', role: '', message: '' });
  const [offerSubmitting, setOfferSubmitting] = useState(false);
  
  // Proposals state
  const [proposalModalOpen, setProposalModalOpen] = useState(false);
  const [selectedChallengeForProposal, setSelectedChallengeForProposal] = useState<DashboardChallenge | null>(null);
  const [proposalForm, setProposalForm] = useState({
    proposal_text: '',
    budget_estimate: '',
    timeline_estimate: '',
    proposed_collaboration: '',
    contact_phone: user?.contact || ''
  });
  const [myProposals, setMyProposals] = useState<any[]>([]);

  // Student Applications state (modal for single challenge)
  const [studentAppsModalOpen, setStudentAppsModalOpen] = useState(false);
  const [studentApps, setStudentApps] = useState<any[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [selectedChallengeForApps, setSelectedChallengeForApps] = useState<DashboardChallenge | null>(null);

  // Institution-wide Student Requests state (dedicated student-review view)
  const [institutionApps, setInstitutionApps] = useState<any[]>([]);
  const [institutionAppsLoading, setInstitutionAppsLoading] = useState(false);
  const [appsStatusFilter, setAppsStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'waitlisted'>('pending');
  const [appsChallengeFilter, setAppsChallengeFilter] = useState<string>('all');
  const [appsSearch, setAppsSearch] = useState('');
  const [selectedAppForDetail, setSelectedAppForDetail] = useState<any | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

  const [addMemberModalOpen, setAddMemberModalOpen] = useState<string | null>(null);
  const [addMemberForm, setAddMemberForm] = useState({ 
    name: '', email: '', contact: '', post: '', 
    memberType: 'Member', occupation: 'Student', address: '', employeeCode: '' 
  });
  const [addMemberSubmitting, setAddMemberSubmitting] = useState(false);

  // Collaboration state
  const [collabTab, setCollabTab] = useState<'inbound' | 'outbound'>('outbound');
  const [collabModalInst, setCollabModalInst] = useState<any | null>(null);
  const [collabForm, setCollabForm] = useState({ challengeId: '', type: 'technology', customType: '', email: '', contact: '', address: '', notes: '' });
  const [collabSubmitting, setCollabSubmitting] = useState(false);

  // Sub-Instance state
  const [instanceModalOpen, setInstanceModalOpen] = useState(false);
  const [instanceName, setInstanceName] = useState('');
  const [instanceSubmitting, setInstanceSubmitting] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState<{ email: string; password: string } | null>(null);
  const [subInstances, setSubInstances] = useState<any[]>([]);
  const [fetchingSubInstances, setFetchingSubInstances] = useState(false);

  // Workspace state
  const [dbMilestones, setDbMilestones] = useState<Record<string, any[]>>({});
  const [projectTeams, setProjectTeams] = useState<Record<string, any>>({});
  const [teamRosters, setTeamRosters] = useState<Record<string, any[]>>({});
  const [milestonesLoading, setMilestonesLoading] = useState<Record<string, boolean>>({});
  const [addingMilestone, setAddingMilestone] = useState<string | null>(null);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneDesc, setNewMilestoneDesc] = useState('');
  const [newMilestoneDue, setNewMilestoneDue] = useState('');
  const [savingMilestone, setSavingMilestone] = useState(false);
  const [workLogProject, setWorkLogProject] = useState<string | null>(null);
  const [workLogEntry, setWorkLogEntry] = useState('');
  const [workLogs, setWorkLogs] = useState<Record<string, any[]>>(
    JSON.parse(localStorage.getItem('memento_work_logs') || '{}')
  );
  const [submittingDeliverable, setSubmittingDeliverable] = useState<string | null>(null);
  const [deliverableUrl, setDeliverableUrl] = useState('');
  const [deliverablesLoading, setDeliverablesLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    localStorage.setItem('inst_categories', JSON.stringify(selectedCategories));
    localStorage.setItem('inst_summary', String(summaryEnabled));
    localStorage.setItem('inst_email', String(emailNotifications));
    localStorage.setItem('inst_alerts', String(inPlatformAlerts));
  }, [selectedCategories, summaryEnabled, emailNotifications, inPlatformAlerts]);

  const fetchInstitutions = async () => {
    try {
      const data = await adminApi.getInstitutions();
      setInstitutions(data);
      if (user?.org_id) {
        setSelectedOrgId(user.org_id);
      } else {
        const myInst = data.find(i => 
          user?.name && i.name && (
            i.name.toLowerCase().includes(user.name.toLowerCase()) ||
            user.name.toLowerCase().includes(i.name.toLowerCase())
          )
        );
        if (myInst) {
          setSelectedOrgId(myInst.id);
        } else if (data.length > 0 && !selectedOrgId) {
          setSelectedOrgId(data[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to fetch institutions:', e);
    }
  };

  const fetchChallenges = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await adminApi.getAllChallenges();
      setChallenges(data);
      if (user?.org_id) {
        const proposals = await dashboardsApi.getMyProposals();
        setMyProposals(proposals);
      }
    } catch (e) {
      console.error(e);
    }
    if (!silent) setLoading(false);
  };

  const isSuperAdmin = user?.role === 'super_admin' || (user?.role as any) === 'admin' || user?.role === 'govt_viewer';
  const activeOrgId = user?.org_id || selectedOrgId;
  const currentInstitution = institutions.find(i => 
    (activeOrgId && i.id === activeOrgId) ||
    (user?.org_id && i.id === user.org_id) ||
    (user?.name && i.name && (
      i.name.toLowerCase().includes(user.name.toLowerCase()) ||
      user.name.toLowerCase().includes(i.name.toLowerCase())
    ))
  );

  const fetchTeamAndMilestones = async (app: any) => {
    if (!app.challenge?.id) return;
    setMilestonesLoading(prev => ({ ...prev, [app.id]: true }));
    try {
      const teamRes = await dashboardsApi.getTeamByChallenge(app.challenge.id);
      if (teamRes && teamRes.team) {
        setProjectTeams(prev => ({ ...prev, [app.id]: teamRes.team }));
        setDbMilestones(prev => ({ ...prev, [app.id]: teamRes.milestones || [] }));
        setTeamRosters(prev => ({ ...prev, [app.id]: teamRes.team.members || [] }));
      }
    } catch (e) {
      console.error(e);
    }
    setMilestonesLoading(prev => ({ ...prev, [app.id]: false }));
  };

  const handleAddMilestone = async (app: any) => {
    if (!newMilestoneTitle.trim()) {
      showAlert('Milestone title is required', 'error');
      return;
    }
    const team = projectTeams[app.id];
    if (!team?.id) {
      showAlert('No project team found for this application yet.', 'error');
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

  const downloadTeamPDF = (projectTitle: string, members: any[], selfName: string, selfRole: string) => {
    const rows = members.map((m: any, i) =>
      `<tr style="background:${i % 2 === 0 ? '#f8fafc' : '#fff'}">
        <td style="padding:10px 14px;font-weight:600;color:#0f172a">${m.name}</td>
        <td style="padding:10px 14px;color:#3b82f6;font-weight:600">${m.role}</td>
        <td style="padding:10px 14px;color:#475569">${m.note || '—'}</td>
        <td style="padding:10px 14px;color:#94a3b8;font-size:12px">${m.joinedDate || ''}</td>
      </tr>`
    ).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Team Roster – ${projectTitle}</title>
<style>body{font-family:Georgia,serif;margin:40px;color:#0f172a}h1{font-size:26px;margin-bottom:4px}p{color:#64748b;font-size:14px;margin:0 0 24px}table{width:100%;border-collapse:collapse;font-size:14px}th{background:#0f172a;color:#fff;padding:10px 14px;text-align:left;font-size:12px;letter-spacing:0.5px}td{border-bottom:1px solid #e2e8f0}footer{margin-top:40px;font-size:12px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:12px}</style>
</head><body>
<h1>Team Roster</h1><p>Project: <strong>${projectTitle}</strong> &nbsp;|&nbsp; Generated: ${new Date().toLocaleString()} &nbsp;|&nbsp; Powered by Memento</p>
<table><thead><tr><th>NAME</th><th>ROLE</th><th>NOTE</th><th>JOINED</th></tr></thead><tbody>${rows}</tbody></table>
<footer>This document was automatically generated by the Memento Institution Portal.</footer>
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

  const fetchInstitutionApps = useCallback(async (silent = false) => {
    if (!silent) setInstitutionAppsLoading(true);
    try {
      const data = await dashboardsApi.getInstitutionApplications(activeOrgId);
      setInstitutionApps(data);
    } catch (e) {
      console.error('Failed to fetch institution applications:', e);
    } finally {
      if (!silent) setInstitutionAppsLoading(false);
    }
  }, [activeOrgId]);

  const handleUpdateAppStatus = async (appId: string, newStatus: 'approved' | 'rejected' | 'waitlisted' | 'pending', currentRole?: string) => {
    let finalRole = currentRole;
    if (newStatus === 'approved') {
      const userInput = window.prompt("Confirm the final assigned role/post for this student (you can change it if you agreed on a different role offline):", currentRole || '');
      if (userInput === null) return; // cancelled
      finalRole = userInput.trim() || currentRole;
    }

    setStatusUpdatingId(appId);
    try {
      await dashboardsApi.updateApplicationStatus(appId, newStatus, finalRole);
      showAlert(`Application ${newStatus === 'approved' ? 'approved' : 'declined'} successfully!`, 'success');
      setInstitutionApps(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus, app_role: finalRole || a.app_role } : a));
      if (selectedAppForDetail && selectedAppForDetail.id === appId) {
        setSelectedAppForDetail((prev: any) => prev ? { ...prev, status: newStatus, app_role: finalRole || prev.app_role } : null);
      }
      if (studentAppsModalOpen) {
        setStudentApps(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus, app_role: finalRole || a.app_role } : a));
      }
    } catch (e: any) {
      showAlert(e.message || 'Failed to update application status.', 'error');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleSendDirectOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerForm.studentEmail || !offerForm.challengeId || !offerForm.role) return;

    setOfferSubmitting(true);
    try {
      await dashboardsApi.sendDirectOffer(offerForm.challengeId, offerForm.studentEmail, offerForm.role, offerForm.message);
      showAlert('Direct offer sent successfully!', 'success');
      setOfferForm({ studentEmail: '', challengeId: '', role: '', message: '' });
      fetchInstitutionApps(); // refresh the list so the offer appears in 'Sent' tab
    } catch (e: any) {
      showAlert(e.message || 'Failed to send direct offer.', 'error');
    } finally {
      setOfferSubmitting(false);
    }
  };

  const handleAddManualMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addMemberModalOpen || !addMemberForm.name || !addMemberForm.email || !addMemberForm.contact) return;
    
    setAddMemberSubmitting(true);
    try {
      await dashboardsApi.addManualTeamMember(addMemberModalOpen, addMemberForm);
      showAlert('Offline member added to team successfully', 'success');
      setAddMemberModalOpen(null);
      setAddMemberForm({ name: '', email: '', contact: '', post: '', memberType: 'Member', occupation: 'Student', address: '', employeeCode: '' });
      fetchInstitutionApps(true);
    } catch (error) {
      console.error(error);
      showAlert('Failed to add offline member', 'error');
    } finally {
      setAddMemberSubmitting(false);
    }
  };

  const handleCollabSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collabModalInst || !collabForm.challengeId || !collabForm.email || !collabForm.contact || !collabForm.address) return;

    setCollabSubmitting(true);
    try {
      let finalNotes = '';
      if (collabForm.type === 'other' && collabForm.customType) {
        finalNotes += `Engagement Type: ${collabForm.customType}\n`;
      }
      finalNotes += `Contact Email: ${collabForm.email}\n`;
      finalNotes += `Contact Phone: ${collabForm.contact}\n`;
      finalNotes += `Address: ${collabForm.address}\n\n`;
      finalNotes += collabForm.notes;

      await dashboardsApi.createEngagement({
        challenge_id: collabForm.challengeId,
        engagement_type: collabForm.type,
        proposal_notes: finalNotes
      });
      showAlert('Collaboration request sent successfully!', 'success');
      setCollabModalInst(null);
      setCollabForm({ challengeId: '', type: 'technology', customType: '', email: '', contact: '', address: '', notes: '' });
    } catch (error) {
      console.error(error);
      showAlert('Failed to send collaboration request.', 'error');
    } finally {
      setCollabSubmitting(false);
    }
  };

  const handleCreateInstance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instanceName) return;
    setInstanceSubmitting(true);
    try {
      const data = await apiClient('/auth/create-sub-instance', {
        method: 'POST',
        body: JSON.stringify({ name: instanceName })
      });
      setGeneratedCredentials(data);
      showAlert('Instance created successfully!', 'success');
      setInstanceName('');
      setInstanceModalOpen(false);
      fetchSubInstances();
    } catch (err: any) {
      console.error(err);
      showAlert(err.message || 'Failed to create instance.', 'error');
    } finally {
      setInstanceSubmitting(false);
    }
  };

  const fetchSubInstances = async () => {
    setFetchingSubInstances(true);
    try {
      const data = await apiClient('/auth/sub-instances');
      setSubInstances(data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setFetchingSubInstances(false);
    }
  };

  const handleRemoveInstance = async (id: string) => {
    if (!window.confirm('Are you sure you want to completely remove this instance? They will lose access.')) return;
    try {
      await apiClient(`/auth/sub-instances/${id}`, { method: 'DELETE' });
      showAlert('Instance removed successfully.', 'success');
      fetchSubInstances();
    } catch (err: any) {
      console.error(err);
      showAlert(err.message || 'Failed to remove instance.', 'error');
    }
  };

  useEffect(() => {
    fetchInstitutions();
  }, []);

  useEffect(() => {
    if (activeView === 'challenges' || activeView === 'dashboard' || activeView === 'summary' || activeView === 'team' || activeView === 'workspace') {
      fetchChallenges();
    }
    if (activeView === 'dashboard') {
      fetchInstitutionApps(true);
    }
    if (activeView === 'student-review' || activeView === 'team' || activeView === 'workspace') {
      fetchInstitutionApps();
      fetchChallenges(true);
    }
    if (activeView === 'settings') {
      fetchSubInstances();
    }
  }, [activeView, activeOrgId, fetchInstitutionApps]);

  // Auto-refresh: keep challenges and student applications up-to-date every 15 s — silent
  const refreshData = useCallback(() => {
    if (activeView === 'student-review' || activeView === 'dashboard' || activeView === 'team' || activeView === 'workspace') {
      fetchInstitutionApps(true);
    }
    if (activeView !== 'student-review' && activeView !== 'team' && activeView !== 'workspace') {
      fetchChallenges(true);
    }
  }, [activeView, fetchInstitutionApps]);

  useAutoRefresh(refreshData, 15000);

  // Helper to test if a challenge is associated with this institution
  const isMine = (c: DashboardChallenge): boolean => {
    return Boolean(
      (activeOrgId && (c.assigned_institution_id === activeOrgId || c.institutions?.id === activeOrgId)) ||
      (user?.org_id && (c.assigned_institution_id === user.org_id || c.institutions?.id === user.org_id)) ||
      (user?.name && c.institutions?.name && (
        c.institutions.name.toLowerCase().includes(user.name.toLowerCase()) ||
        user.name.toLowerCase().includes(c.institutions.name.toLowerCase())
      )) ||
      (currentInstitution?.name && c.institutions?.name && (
        c.institutions.name.toLowerCase().includes(currentInstitution.name.toLowerCase()) ||
        currentInstitution.name.toLowerCase().includes(c.institutions.name.toLowerCase())
      ))
    );
  };

  // Grouped challenges
  const myVerifiedChallenges = challenges.filter(c => 
    isMine(c) && ['in_progress', 'team_formed', 'under_action', 'completed', 'resolved'].includes(c.status)
  );

  const myPendingClaims = challenges.filter(c => 
    isMine(c) && c.status === 'under_review'
  );

  const availableChallenges = challenges.filter(c => 
    !c.assigned_institution_id && c.status === 'routed'
  );

  const displayedChallenges = challenges.filter(c => {
    if (filterTab === 'verified') {
      return isMine(c) && ['in_progress', 'team_formed', 'under_action', 'completed', 'resolved'].includes(c.status);
    }
    if (filterTab === 'pending') {
      return isMine(c) && c.status === 'under_review';
    }
    if (filterTab === 'available') {
      return !c.assigned_institution_id && c.status === 'routed';
    }
    return true;
  });

  const handleExportCSV = (dataList: DashboardChallenge[], filename: string) => {
    const headers = ['ID', 'Title', 'Category', 'District', 'Status', 'Date'];
    const rows = (dataList || []).map(c => {
      const escapedTitle = (c.title || '').replace(/"/g, '""');
      return [
        c.id,
        `"${escapedTitle}"`,
        `"${c.category || 'General'}"`,
        `"${c.district || ''}"`,
        c.status || 'N/A',
        new Date(c.created_at).toLocaleDateString()
      ];
    });
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showAlert('Export downloaded successfully!', 'success');
  };

  const handleClaim = async (id: string) => {
    try {
      await dashboardsApi.claimChallenge(id, activeOrgId);
      await fetchChallenges();
      showAlert(`Claim request submitted for ${currentInstitution?.name || user?.name || 'your institution'}! Waiting for Admin verification.`, 'success');
    } catch (e: any) {
      showAlert('Failed to claim challenge: ' + (e.message || 'Error occurred'), 'error');
    }
  };

  const handleSubmitProposal = async () => {
    if (!selectedChallengeForProposal) return;
    if (!proposalForm.proposal_text.trim() || !proposalForm.budget_estimate.trim() || !proposalForm.timeline_estimate.trim() || !(proposalForm.contact_phone || user?.contact)) {
      showAlert('Please fill in all mandatory fields.', 'error');
      return;
    }
    setLoading(true);
    try {
      const finalProposalText = proposalForm.proposed_collaboration.trim() 
        ? `${proposalForm.proposal_text}\n\n### Proposed Collaborators / Partners\n${proposalForm.proposed_collaboration}`
        : proposalForm.proposal_text;

      await dashboardsApi.submitProposal(selectedChallengeForProposal.id, {
        ...proposalForm,
        proposal_text: finalProposalText,
        contact_phone: proposalForm.contact_phone || user?.contact || ''
      });
      showAlert('Proposal submitted successfully! The admin will review your bid.', 'success');
      setProposalModalOpen(false);
      setSelectedChallengeForProposal(null);
      setProposalForm({ proposal_text: '', budget_estimate: '', timeline_estimate: '', proposed_collaboration: '', contact_phone: user?.contact || '' });
      await fetchChallenges();
    } catch (e: any) {
      showAlert(e.message || 'Failed to submit proposal', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 1. OVERVIEW VIEW
  if (activeView === 'dashboard') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {/* Header */}
        <div>
          <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
            Institution Portal Overview
          </h2>
          <p style={{ color: '#64748b', margin: 0, fontSize: '15px' }}>
            Logged in as <strong style={{ color: '#0f172a' }}>{currentInstitution?.name || user?.name || 'Authorized Institution'}</strong>
          </p>
        </div>

        {/* Pending Claim Notice if any */}
        {myPendingClaims.length > 0 && (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Clock size={20} color="#d97706" />
              <div>
                <strong style={{ color: '#92400e', fontSize: '14px' }}>
                  {myPendingClaims.length} Claim Request{myPendingClaims.length > 1 ? 's' : ''} Pending Admin Verification
                </strong>
                <p style={{ margin: '2px 0 0', color: '#b45309', fontSize: '13px' }}>
                  Your claim requests have been submitted to the Memento Admin. As soon as the Admin verifies them, they will appear in your active problem list.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setFilterTab('pending');
                setActiveView?.('challenges');
              }}
              style={{ padding: '8px 16px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              View Requests
            </button>
          </div>
        )}

        {/* Quick Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          {/* 1. Verified & In Progress */}
          <div 
            onClick={() => { setFilterTab('verified'); setActiveView?.('challenges'); }}
            style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '14px', padding: '20px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Verified & Assigned</span>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle size={20} color="#16a34a" />
              </div>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#15803d' }}>{myVerifiedChallenges.length}</div>
            <div style={{ fontSize: '13px', color: '#166534', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>Verified by Admin • In Progress</span>
              <ArrowRight size={14} />
            </div>
          </div>
          {/* 2. Pending Verification (Bids) */}
          <div 
            onClick={() => { setFilterTab('proposals'); setActiveView?.('challenges'); }}
            style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '14px', padding: '20px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Submitted Bids</span>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={20} color="#d97706" />
              </div>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#b45309' }}>{myProposals.filter(p => p.status === 'submitted').length}</div>
            <div style={{ fontSize: '13px', color: '#92400e', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>Awaiting Admin Verification</span>
              <ArrowRight size={14} />
            </div>
          </div>

          {/* 3. Available Unclaimed */}
          <div 
            onClick={() => { setFilterTab('available'); setActiveView?.('challenges'); }}
            style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '14px', padding: '20px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Available to Claim</span>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 size={20} color="#2563eb" />
              </div>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#1d4ed8' }}>{availableChallenges.length}</div>
            <div style={{ fontSize: '13px', color: '#1e40af', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>Open for Adoption</span>
              <ArrowRight size={14} />
            </div>
          </div>

          {/* 4. Total Platform Challenges */}
          <div 
            onClick={() => { setFilterTab('all'); setActiveView?.('challenges'); }}
            style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Tracked</span>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={20} color="#475569" />
              </div>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a' }}>{challenges.length}</div>
            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>Explore All Challenges</span>
              <ArrowRight size={14} />
            </div>
          </div>

          {/* 5. Student Applications */}
          <div 
            onClick={() => { setActiveView?.('student-review'); }}
            style={{ background: '#fdf4ff', border: '1px solid #fbcfe8', borderRadius: '14px', padding: '20px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#9d174d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Student Apps</span>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#fce7f3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={20} color="#be185d" />
              </div>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#831843' }}>{institutionApps.filter(app => app.status === 'pending').length}</div>
            <div style={{ fontSize: '13px', color: '#9d174d', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>Pending Review</span>
              <ArrowRight size={14} />
            </div>
          </div>
        </div>

        {/* Section: Verified & Active Problems for This Institution */}
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={20} color="#16a34a" />
                Verified & Assigned Problems to Your Institution ({myVerifiedChallenges.length})
              </h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
                Problems verified by Admin and officially allocated for student teams and faculty to solve.
              </p>
            </div>
            {myVerifiedChallenges.length > 0 && (
              <button
                onClick={() => { setFilterTab('verified'); setActiveView?.('challenges'); }}
                style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 600, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                View in Full List <ArrowRight size={16} />
              </button>
            )}
          </div>

          {myVerifiedChallenges.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
              <Building2 size={40} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
              <h4 style={{ margin: '0 0 6px', color: '#334155', fontSize: '16px' }}>No Problems Currently Assigned</h4>
              <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '14px', maxWidth: '480px', marginInline: 'auto' }}>
                Browse civic problems submitted by citizens and claim them, or wait for the Admin to allocate challenges directly to your institution.
              </p>
              <button
                onClick={() => { setFilterTab('available'); setActiveView?.('challenges'); }}
                style={{ padding: '10px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '14px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                Browse & Claim Challenges <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {myVerifiedChallenges.map(c => (
                <div 
                  key={c.id} 
                  style={{ 
                    border: '1px solid #bbf7d0', 
                    background: '#f0fdf4', 
                    borderRadius: '12px', 
                    padding: '18px 20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '16px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle size={12} /> VERIFIED & ASSIGNED BY ADMIN
                      </span>
                      {c.district && (
                        <span style={{ fontSize: '12px', background: '#fff', color: '#2563eb', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, border: '1px solid #e2e8f0' }}>
                          {c.district}
                        </span>
                      )}
                      {c.location_text && (
                        <a 
                          href={c.location_text.startsWith('http') ? c.location_text : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.location_text)}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          style={{ fontSize: '12px', display: 'inline-flex', alignItems: 'center', background: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, border: '1px solid #bfdbfe', textDecoration: 'none' }}
                        >
                          <MapPin size={12} style={{ marginRight: 4 }} />
                          Location Link
                        </a>
                      )}
                      {c.category && (
                        <span style={{ fontSize: '12px', background: '#fff', color: '#475569', padding: '2px 8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                          {c.category}
                        </span>
                      )}
                    </div>
                    <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>{c.title}</h4>
                    <p style={{ fontSize: '14px', color: '#475569', margin: 0, maxWidth: '700px' }}>{c.description}</p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, padding: '6px 14px', borderRadius: '8px', background: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 1px 2px rgba(16, 185, 129, 0.2)' }}>
                      <CheckCircle size={16} /> Occupied by You
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
  // 2. SETTINGS & PROFILE
  if (activeView === 'settings' || activeView === 'profile') {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>
              Institution Settings
            </h2>
            <p style={{ color: '#64748b', margin: 0 }}>Manage your organization's preferences, notifications, and security.</p>
          </div>
          <button 
            onClick={() => {
              localStorage.setItem('inst_summary', String(summaryEnabled));
              localStorage.setItem('inst_categories', JSON.stringify(selectedCategories));
              showAlert('Settings saved successfully', 'success');
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#4c1d95', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 6px rgba(76, 29, 149, 0.2)' }}
          >
            <Save size={18} /> Save Changes
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
          
          {/* Organization Profile Settings */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={18} color="#4c1d95" /> Organization Details
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Registered Name</label>
                <input type="text" defaultValue={currentInstitution?.name || user?.name || 'Institution'} disabled style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#64748b' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Primary Contact Email</label>
                <input type="email" defaultValue={user?.email || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Phone Number</label>
                <input type="tel" defaultValue={user?.contact || currentInstitution?.contact || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>District Location</label>
                <input type="text" defaultValue={currentInstitution?.district || 'Jharkhand'} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
              </div>
            </div>
          </div>

          {/* Notification Preferences */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bell size={18} color="#f59e0b" /> Notification Preferences
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                <div>
                  <span style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155' }}>Email Notifications</span>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Receive updates on new assigned challenges</span>
                </div>
                <input type="checkbox" checked={emailNotifications} onChange={(e) => setEmailNotifications(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#4c1d95' }} />
              </label>
              <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9' }} />
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                <div>
                  <span style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155' }}>In-Platform Alerts</span>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Show badges and modal alerts for activity</span>
                </div>
                <input type="checkbox" checked={inPlatformAlerts} onChange={(e) => setInPlatformAlerts(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#4c1d95' }} />
              </label>
              <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9' }} />
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                <div>
                  <span style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155' }}>Daily Summary Report</span>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Get a daily digest of civic problem metrics</span>
                </div>
                <input type="checkbox" checked={summaryEnabled} onChange={(e) => setSummaryEnabled(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#4c1d95' }} />
              </label>
            </div>
          </div>



          {/* Research & Departments */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} color="#ef4444" /> Active Departments
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>Select the departments your institution has. This helps AI route problems accurately.</p>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {['Education', 'Agriculture', 'Healthcare', 'Water Resources', 'Environment', 'Energy', 'Urban Development', 'Accessibility', 'Public Administration', 'Rural Livelihoods'].map(dept => (
                <label key={dept} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', cursor: 'pointer', border: '1px solid #e2e8f0', transition: 'all 0.2s', borderColor: selectedCategories.includes(dept) ? '#8b5cf6' : '#e2e8f0', backgroundColor: selectedCategories.includes(dept) ? '#ede9fe' : '#f1f5f9' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedCategories.includes(dept)} 
                    onChange={(e) => {
                      if (e.target.checked) setSelectedCategories([...selectedCategories, dept]);
                      else setSelectedCategories(selectedCategories.filter(c => c !== dept));
                    }}
                    style={{ accentColor: '#4c1d95' }} 
                  />
                  <span style={{ color: selectedCategories.includes(dept) ? '#4c1d95' : '#475569', fontWeight: selectedCategories.includes(dept) ? 600 : 400 }}>{dept}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Make an Instance (Faculty / Sub-accounts) */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserPlus size={18} color="#8b5cf6" /> Sub-Instances (Faculty)
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>Create sub-accounts for faculty members or departments to collaborate under your institution.</p>
            <button
              onClick={() => {
                setInstanceModalOpen(true);
                setGeneratedCredentials(null);
              }}
              style={{ padding: '10px 20px', background: '#8b5cf6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '14px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', width: '100%', justifyContent: 'center' }}
            >
              <UserPlus size={16} /> Make an Instance
            </button>

            {generatedCredentials && (
              <div style={{ marginTop: '20px', padding: '16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px' }}>
                <p style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 700, color: '#166534' }}>Instance Created Successfully!</p>
                <div style={{ fontSize: '13px', color: '#14532d', marginBottom: '8px' }}><strong>Email:</strong> {generatedCredentials.email}</div>
                <div style={{ fontSize: '13px', color: '#14532d', marginBottom: '12px' }}><strong>Password:</strong> {generatedCredentials.password}</div>
                <p style={{ margin: 0, fontSize: '11px', color: '#16a34a' }}>Please save these credentials and share them securely. This email acts as a login but sends notifications to your main inbox.</p>
              </div>
            )}

            {fetchingSubInstances ? (
              <div style={{ marginTop: '20px', fontSize: '13px', color: '#64748b' }}>Loading instances...</div>
            ) : (
              <div style={{ marginTop: '24px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#334155', margin: '0 0 12px' }}>Existing Instances</h4>
                {subInstances.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {subInstances.map(inst => (
                      <div key={inst.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{inst.name}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>{inst.email}</div>
                        </div>
                        <button 
                          onClick={() => handleRemoveInstance(inst.id)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', borderRadius: '4px', transition: 'all 0.2s' }}
                          onMouseOver={(e) => e.currentTarget.style.background = '#fee2e2'}
                          onMouseOut={(e) => e.currentTarget.style.background = 'none'}
                          title="Remove Instance"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '16px', textAlign: 'center', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '8px', color: '#64748b', fontSize: '13px' }}>
                    You have not created any sub-instances yet.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Data & Export */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Download size={18} color="#0284c7" /> Data & Export
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px' }}>Download a complete archive of your assigned civic challenges and institutional reports for auditing purposes.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: 'auto' }}>
              <button
                onClick={() => handleExportCSV(challenges.filter(isMine), 'institution_assigned_challenges')}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '24px 12px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', color: '#334155', cursor: 'pointer', transition: 'all 0.2s', width: '100%' }}
                onMouseOver={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#94a3b8'; e.currentTarget.style.color = '#0f172a'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#334155'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ background: '#e0f2fe', padding: '12px', borderRadius: '50%' }}>
                  <Download size={24} color="#0284c7" />
                </div>
                <span style={{ fontSize: '13px', fontWeight: 600, textAlign: 'center', lineHeight: '1.3' }}>Export<br/>Assigned</span>
              </button>
              <button
                onClick={() => {
                  const summaryChallenges = challenges.filter(c => {
                    if (selectedCategories.length === 0) return false;
                    const targetStr = (c.category || c.title || '').toLowerCase();
                    return selectedCategories.some(cat => {
                      const words = cat.toLowerCase().split(' ').filter(w => w.length > 3);
                      if (words.length === 0) return targetStr.includes(cat.toLowerCase());
                      return words.some(w => targetStr.includes(w));
                    });
                  });
                  handleExportCSV(summaryChallenges, 'daily_summary_report');
                }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '24px 12px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', color: '#334155', cursor: 'pointer', transition: 'all 0.2s', width: '100%' }}
                onMouseOver={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#94a3b8'; e.currentTarget.style.color = '#0f172a'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#334155'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ background: '#d1fae5', padding: '12px', borderRadius: '50%' }}>
                  <FileText size={24} color="#10b981" />
                </div>
                <span style={{ fontSize: '13px', fontWeight: 600, textAlign: 'center', lineHeight: '1.3' }}>Export<br/>Summary</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. SUMMARY VIEW
  if (activeView === 'summary') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={24} color="#10b981" /> Daily Summary Report
            </h2>
            <p style={{ color: '#64748b', margin: 0 }}>Review the latest civic problems matching your selected departments.</p>
          </div>
          {summaryEnabled && (
            <button
              onClick={() => {
                const summaryChallenges = challenges.filter(c => {
                  if (selectedCategories.length === 0) return false;
                  const targetStr = (c.category || c.title || '').toLowerCase();
                  return selectedCategories.some(cat => {
                    const words = cat.toLowerCase().split(' ').filter(w => w.length > 3);
                    if (words.length === 0) return targetStr.includes(cat.toLowerCase());
                    return words.some(w => targetStr.includes(w));
                  });
                });
                handleExportCSV(summaryChallenges, 'daily_summary_report');
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: '#0f172a', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', transition: 'all 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'}
              onMouseOut={(e) => e.currentTarget.style.background = '#fff'}
            >
              <Download size={16} /> Export CSV
            </button>
          )}
        </div>
        
        {!summaryEnabled ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#64748b', background: '#fff', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
            <p style={{ fontSize: '16px', fontWeight: 600, color: '#334155' }}>Daily Summary is disabled.</p>
            <p>Please enable the Daily Summary Report in your Settings to view the digest.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {challenges.filter(c => {
              if (selectedCategories.length === 0) return false;
              const targetStr = (c.category || c.title || '').toLowerCase();
              return selectedCategories.some(cat => {
                const words = cat.toLowerCase().split(' ').filter(w => w.length > 3);
                if (words.length === 0) return targetStr.includes(cat.toLowerCase());
                return words.some(w => targetStr.includes(w));
              });
            }).map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                {c.media_urls && c.media_urls.length > 0 ? (
                  <div style={{ width: '200px', height: '135px', flexShrink: 0, borderRadius: '10px', overflow: 'hidden', background: '#f1f5f9', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)' }}>
                    <img src={c.media_urls[0]} alt={c.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ) : (
                  <div style={{ width: '200px', height: '135px', flexShrink: 0, borderRadius: '10px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', border: '1px solid #e2e8f0' }}>
                    <FileText size={32} />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '6px', background: '#ede9fe', color: '#6d28d9' }}>{c.category || 'General'}</span>
                    <span style={{ fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '6px', background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>{c.status.replace('_', ' ').toUpperCase()}</span>
                    {c.district && <span style={{ fontSize: '12px', color: '#64748b' }}>{c.district}</span>}
                    {c.location_text && (
                      <a 
                        href={c.location_text.startsWith('http') ? c.location_text : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.location_text)}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        style={{ fontSize: '12px', color: '#2563eb', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '2px' }}
                      >
                        <MapPin size={12} /> Map Link
                      </a>
                    )}
                  </div>
                  <h4 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>{c.title}</h4>
                </div>
              </div>
            ))}
            {challenges.filter(c => {
              if (selectedCategories.length === 0) return false;
              const targetStr = (c.category || c.title || '').toLowerCase();
              return selectedCategories.some(cat => {
                const words = cat.toLowerCase().split(' ').filter(w => w.length > 3);
                if (words.length === 0) return targetStr.includes(cat.toLowerCase());
                return words.some(w => targetStr.includes(w));
              });
            }).length === 0 && (
              <div style={{ padding: '48px', textAlign: 'center', color: '#64748b', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', gridColumn: '1 / -1' }}>
                <p style={{ fontSize: '15px' }}>No matching problems found for your selected departments today.</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // 4. TEAM FORMATION VIEW
  if (activeView === 'team') {
    const approvedApps = institutionApps.filter(app => app.status === 'approved');
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div>
          <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={28} color="#4c1d95" /> Teams Configuration
          </h2>
          <p style={{ color: '#64748b', margin: 0, fontSize: '15px' }}>
            View and manage the student volunteer teams working on your assigned civic projects.
          </p>
        </div>
        
        {loading || institutionAppsLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
            <p>Loading your teams...</p>
          </div>
        ) : myVerifiedChallenges.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', background: '#fff', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
            <Building2 size={48} color="#cbd5e1" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#334155', margin: '0 0 8px' }}>No Assigned Problems</h3>
            <p style={{ color: '#64748b', margin: 0 }}>You don't have any verified assigned problems yet to form teams around.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '24px' }}>
            {myVerifiedChallenges.map(challenge => {
              const teamMembers = approvedApps.filter(app => app.challenge_id === challenge.id || app.challenge?.id === challenge.id);
              
              return (
                <div key={challenge.id} style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
                  {/* Header */}
                  <div style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '20px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ClipboardList size={20} color="#10b981" />
                      {challenge.title}
                    </h3>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <span style={{ fontSize: '12px', background: '#e0e7ff', color: '#4338ca', padding: '4px 10px', borderRadius: '20px', fontWeight: 700 }}>
                        {teamMembers.length} Member{teamMembers.length !== 1 ? 's' : ''}
                      </span>
                      {challenge.category && (
                        <span style={{ fontSize: '12px', background: '#f1f5f9', color: '#64748b', padding: '4px 10px', borderRadius: '20px', fontWeight: 600 }}>
                          {challenge.category.replace('_', ' ').toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Team Members */}
                  <div style={{ padding: '20px', flex: 1, background: '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
                        Assigned Volunteers
                      </h4>
                      <button 
                        onClick={() => setAddMemberModalOpen(challenge.id)}
                        style={{ padding: '4px 10px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <UserPlus size={14} /> Add Offline
                      </button>
                    </div>
                    
                    {teamMembers.length === 0 ? (
                      <div style={{ padding: '24px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', textAlign: 'center' }}>
                        <Users size={24} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
                        <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: 500 }}>No students approved yet.</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {teamMembers.map(member => (
                          <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '16px' }}>
                              {member.student?.name?.charAt(0) || 'S'}
                            </div>
                            <div style={{ flex: 1 }}>
                              <h5 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{member.student?.name || 'Unknown Student'}</h5>
                              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Briefcase size={12} /> {member.app_role || 'General Volunteer'}
                              </p>
                            </div>
                            {member.student?.contact && (
                              <a href={`tel:${member.student.contact}`} style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }} title="Call Student">
                                <Phone size={14} />
                              </a>
                            )}
                            {member.student?.email && (
                              <a href={`mailto:${member.student.email}`} style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }} title="Email Student">
                                <Mail size={14} />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Action */}
                  <div style={{ padding: '16px 20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                    <button 
                      onClick={() => {
                        setAppsChallengeFilter(challenge.id);
                        setAppsStatusFilter('all');
                        setActiveView?.('student-review');
                      }}
                      style={{ width: '100%', padding: '10px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a', fontWeight: 600, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}
                      onMouseOver={(e) => e.currentTarget.style.background = '#f1f5f9'}
                      onMouseOut={(e) => e.currentTarget.style.background = '#fff'}
                    >
                      <UserCheck size={16} /> Manage Recruitment
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add Offline Member Modal */}
        {addMemberModalOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', padding: '20px' }}>
            <div style={{ background: '#fff', width: '100%', maxWidth: '500px', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
              <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Add Offline Member</h3>
                <button onClick={() => setAddMemberModalOpen(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleAddManualMember} style={{ padding: '24px', maxHeight: '75vh', overflowY: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Member Name *</label>
                    <input required type="text" value={addMemberForm.name} onChange={e => setAddMemberForm({...addMemberForm, name: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }} placeholder="e.g. John Doe" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Member Type *</label>
                    <select required value={addMemberForm.memberType} onChange={e => setAddMemberForm({...addMemberForm, memberType: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', background: '#fff' }}>
                      <option value="Member">Member</option>
                      <option value="Mentor">Mentor</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Post or Job *</label>
                    <input required type="text" value={addMemberForm.post} onChange={e => setAddMemberForm({...addMemberForm, post: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }} placeholder="e.g. Frontend Developer" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Current Occupation *</label>
                    <select required value={addMemberForm.occupation} onChange={e => setAddMemberForm({...addMemberForm, occupation: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', background: '#fff' }}>
                      <option value="Student">Student</option>
                      <option value="Employee">Employee</option>
                      <option value="Self-Employed">Self-Employed</option>
                      <option value="Freelancer">Freelancer</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Email *</label>
                    <input required type="email" value={addMemberForm.email} onChange={e => setAddMemberForm({...addMemberForm, email: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }} placeholder="john@example.com" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Phone *</label>
                    <input required type="tel" value={addMemberForm.contact} onChange={e => setAddMemberForm({...addMemberForm, contact: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }} placeholder="+91 XXXXX XXXXX" />
                  </div>
                </div>

                {addMemberForm.occupation !== 'Student' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Employee Code *</label>
                      <input required type="text" value={addMemberForm.employeeCode} onChange={e => setAddMemberForm({...addMemberForm, employeeCode: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }} placeholder="e.g. EMP12345" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Address *</label>
                      <input required type="text" value={addMemberForm.address} onChange={e => setAddMemberForm({...addMemberForm, address: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }} placeholder="City, State" />
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: addMemberForm.occupation === 'Student' ? '24px' : '0' }}>
                  <button type="button" onClick={() => setAddMemberModalOpen(null)} style={{ padding: '10px 20px', borderRadius: '8px', background: '#f1f5f9', color: '#475569', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" disabled={addMemberSubmitting || !addMemberForm.name || !addMemberForm.email || !addMemberForm.contact} style={{ padding: '10px 20px', borderRadius: '8px', background: '#4f46e5', color: '#fff', fontWeight: 600, border: 'none', cursor: (!addMemberForm.name || !addMemberForm.email || !addMemberForm.contact || addMemberSubmitting) ? 'not-allowed' : 'pointer', opacity: (!addMemberForm.name || !addMemberForm.email || !addMemberForm.contact || addMemberSubmitting) ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {addMemberSubmitting ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                    Confirm & Add Member
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 5. STUDENT REQUEST VIEW
  if (activeView === 'student-review') {
    const filteredApps = institutionApps.filter(app => {
      if (appsStatusFilter !== 'all' && app.status !== appsStatusFilter) return false;
      if (appsChallengeFilter !== 'all' && app.challenge?.id !== appsChallengeFilter) return false;
      if (appsSearch) {
        const term = appsSearch.toLowerCase();
        const studentName = (app.student?.name || '').toLowerCase();
        const studentEmail = (app.student?.email || '').toLowerCase();
        const challengeTitle = (app.challenge?.title || '').toLowerCase();
        const appInst = (app.app_institution || '').toLowerCase();
        return studentName.includes(term) || studentEmail.includes(term) || challengeTitle.includes(term) || appInst.includes(term);
      }
      return true;
    });

    const pendingCount = institutionApps.filter(a => a.status === 'pending').length;
    const waitlistedCount = institutionApps.filter(a => a.status === 'waitlisted').length;
    const approvedCount = institutionApps.filter(a => a.status === 'approved').length;
    const rejectedCount = institutionApps.filter(a => a.status === 'rejected').length;

    // Get unique challenges for filter
    const uniqueChallenges = Array.from(new Set(institutionApps.map(a => a.challenge?.id))).map(id => {
      return institutionApps.find(a => a.challenge?.id === id)?.challenge;
    }).filter(Boolean);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClipboardList size={24} color="#4c1d95" /> Requests & Offers
          </h2>
          <p style={{ color: '#64748b', margin: 0 }}>Review student applications or send direct offers to students.</p>
        </div>

        {/* MAIN TABS */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
          <button 
            onClick={() => setStudentReviewTab('requests')}
            style={{ padding: '8px 16px', background: studentReviewTab === 'requests' ? '#4c1d95' : 'transparent', color: studentReviewTab === 'requests' ? '#fff' : '#475569', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
          >
            Requests
          </button>
          <button 
            onClick={() => setStudentReviewTab('offers')}
            style={{ padding: '8px 16px', background: studentReviewTab === 'offers' ? '#4c1d95' : 'transparent', color: studentReviewTab === 'offers' ? '#fff' : '#475569', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
          >
            Offers
          </button>
        </div>

        {studentReviewTab === 'requests' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '-8px' }}>
              <button 
                onClick={() => setRequestSubTab('received')}
                style={{ padding: '6px 12px', background: requestSubTab === 'received' ? '#e2e8f0' : 'transparent', color: requestSubTab === 'received' ? '#0f172a' : '#64748b', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
              >
                Received (From Students)
              </button>
              <button 
                onClick={() => setRequestSubTab('sent')}
                style={{ padding: '6px 12px', background: requestSubTab === 'sent' ? '#e2e8f0' : 'transparent', color: requestSubTab === 'sent' ? '#0f172a' : '#64748b', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
              >
                Sent
              </button>
            </div>

            {requestSubTab === 'sent' ? (
              <div style={{ padding: '48px', textAlign: 'center', background: '#fff', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#64748b' }}>
                <Send size={48} color="#cbd5e1" style={{ marginBottom: '16px' }} />
                <p style={{ fontSize: '18px', fontWeight: 600, color: '#334155', margin: '0 0 8px' }}>No Sent Requests</p>
                <p style={{ margin: 0 }}>You haven't sent any requests.</p>
              </div>
            ) : (
              <>
        
        {/* Metrics Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: '#e2e8f0', padding: '12px', borderRadius: '50%' }}><Users size={24} color="#475569" /></div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Requests</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>{institutionApps.length}</div>
            </div>
          </div>
          <div onClick={() => setAppsStatusFilter('pending')} style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', boxShadow: appsStatusFilter === 'pending' ? '0 0 0 2px #f59e0b' : 'none' }}>
            <div style={{ background: '#fef3c7', padding: '12px', borderRadius: '50%' }}><Clock size={24} color="#d97706" /></div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#b45309', textTransform: 'uppercase' }}>Pending Review</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#92400e' }}>{pendingCount}</div>
            </div>
          </div>
          <div onClick={() => setAppsStatusFilter('approved')} style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', boxShadow: appsStatusFilter === 'approved' ? '0 0 0 2px #10b981' : 'none' }}>
            <div style={{ background: '#dcfce7', padding: '12px', borderRadius: '50%' }}><CheckCircle size={24} color="#15803d" /></div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>Onboarded</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#14532d' }}>{approvedCount}</div>
            </div>
          </div>
          <div onClick={() => setAppsStatusFilter('waitlisted')} style={{ background: '#e0e7ff', border: '1px solid #c7d2fe', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', boxShadow: appsStatusFilter === 'waitlisted' ? '0 0 0 2px #6366f1' : 'none' }}>
            <div style={{ background: '#c7d2fe', padding: '12px', borderRadius: '50%' }}><Clock size={24} color="#4338ca" /></div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#3730a3', textTransform: 'uppercase' }}>Waitlisted</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#312e81' }}>{waitlistedCount}</div>
            </div>
          </div>
          <div onClick={() => setAppsStatusFilter('rejected')} style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', boxShadow: appsStatusFilter === 'rejected' ? '0 0 0 2px #ef4444' : 'none' }}>
            <div style={{ background: '#fee2e2', padding: '12px', borderRadius: '50%' }}><X size={24} color="#b91c1c" /></div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#991b1b', textTransform: 'uppercase' }}>Rejected</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#7f1d1d' }}>{rejectedCount}</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
            <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search by student name, email, or project..." 
              value={appsSearch}
              onChange={(e) => setAppsSearch(e.target.value)}
              style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px' }}
            />
          </div>
          <select 
            value={appsStatusFilter} 
            onChange={(e) => setAppsStatusFilter(e.target.value as any)}
            style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', background: '#f8fafc', color: '#334155', fontWeight: 600 }}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="waitlisted">Waitlisted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select 
            value={appsChallengeFilter} 
            onChange={(e) => setAppsChallengeFilter(e.target.value)}
            style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', background: '#f8fafc', color: '#334155', fontWeight: 600, maxWidth: '250px' }}
          >
            <option value="all">All Assigned Problems</option>
            {uniqueChallenges.map((c: any) => (
              <option key={c.id} value={c.id}>{c.title.substring(0, 40)}{c.title.length > 40 ? '...' : ''}</option>
            ))}
          </select>
          {(appsSearch || appsStatusFilter !== 'all' || appsChallengeFilter !== 'all') && (
            <button 
              onClick={() => { setAppsSearch(''); setAppsStatusFilter('all'); setAppsChallengeFilter('all'); }}
              style={{ padding: '10px 16px', background: '#f1f5f9', border: 'none', borderRadius: '8px', color: '#475569', fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={14} /> Clear Filters
            </button>
          )}
        </div>

        {/* Applications List */}
        {institutionAppsLoading && institutionApps.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
            <p>Loading student requests...</p>
          </div>
        ) : filteredApps.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
            <UserCheck size={48} color="#94a3b8" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#334155', margin: '0 0 8px' }}>No student requests found</h3>
            <p style={{ color: '#64748b', margin: 0, maxWidth: '400px', marginInline: 'auto' }}>
              {institutionApps.length === 0 
                ? "Students haven't submitted any volunteer requests for your assigned civic problems yet." 
                : "No requests match your current search and filter criteria."}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {(() => {
              const groupedApps = filteredApps.reduce((acc, app) => {
                const challengeId = app.challenge?.id || 'unknown';
                if (!acc[challengeId]) {
                  acc[challengeId] = {
                    challengeTitle: app.challenge?.title || 'Unknown Project',
                    apps: []
                  };
                }
                acc[challengeId].apps.push(app);
                return acc;
              }, {} as Record<string, { challengeTitle: string, apps: any[] }>);

              return Object.entries(groupedApps).map(([challengeId, group]: [string, any]) => (
                <div key={challengeId} style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <ClipboardList size={24} color="#6366f1" />
                      {group.challengeTitle}
                    </h3>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#4f46e5', background: '#e0e7ff', padding: '6px 12px', borderRadius: '20px', border: '1px solid #c7d2fe' }}>
                      {group.apps.length} Candidate{group.apps.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '16px' }}>
                    {group.apps.map(app => (
                      <div key={app.id} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                        {/* Card Header */}
                        <div style={{ padding: '16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#4c1d95', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 700 }}>
                              {app.student?.name?.charAt(0) || 'S'}
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>{app.student?.name || 'Unknown Student'}</h4>
                                {app.student?.verified && <span title="Verified User"><ShieldCheck size={14} color="#10b981" /></span>}
                              </div>
                              <p style={{ fontSize: '13px', color: '#64748b', margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <GraduationCap size={12} /> {app.app_institution || 'University Not Specified'}
                              </p>
                            </div>
                          </div>
                          <div>
                            {app.status === 'pending' && <span style={{ padding: '4px 8px', borderRadius: '20px', background: '#fef3c7', color: '#b45309', fontSize: '12px', fontWeight: 700, border: '1px solid #fde68a', display: 'inline-block' }}>PENDING</span>}
                            {app.status === 'waitlisted' && <span style={{ padding: '4px 8px', borderRadius: '20px', background: '#e0e7ff', color: '#4338ca', fontSize: '12px', fontWeight: 700, border: '1px solid #c7d2fe', display: 'inline-block' }}>WAITLISTED</span>}
                            {app.status === 'approved' && <span style={{ padding: '4px 8px', borderRadius: '20px', background: '#dcfce7', color: '#15803d', fontSize: '12px', fontWeight: 700, border: '1px solid #bbf7d0', display: 'inline-block' }}>APPROVED</span>}
                            {app.status === 'rejected' && <span style={{ padding: '4px 8px', borderRadius: '20px', background: '#fee2e2', color: '#b91c1c', fontSize: '12px', fontWeight: 700, border: '1px solid #fecaca', display: 'inline-block' }}>REJECTED</span>}
                          </div>
                        </div>
                        
                        {/* Card Body */}
                        <div style={{ padding: '16px', flex: 1 }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                            {app.app_role && <span style={{ fontSize: '12px', background: '#f1f5f9', color: '#475569', padding: '4px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><Briefcase size={12}/> Role: {app.app_role}</span>}
                            {app.app_major && <span style={{ fontSize: '12px', background: '#f1f5f9', color: '#475569', padding: '4px 8px', borderRadius: '4px' }}>Degree: {app.app_major}</span>}
                          </div>
                          
                          <div>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Motivation Snippet</span>
                            <p style={{ fontSize: '13px', color: '#475569', margin: '4px 0 0', fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              "{app.app_motivation || 'No motivation provided.'}"
                            </p>
                          </div>
                        </div>
                        
                        {/* Card Footer (Actions) */}
                        <div style={{ padding: '12px 16px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '10px' }}>
                          <button 
                            onClick={() => setSelectedAppForDetail(app)}
                            style={{ flex: 1, padding: '8px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a', fontWeight: 600, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.2s' }}
                            onMouseOver={(e) => e.currentTarget.style.background = '#f1f5f9'}
                            onMouseOut={(e) => e.currentTarget.style.background = '#fff'}
                          >
                            <Eye size={16} /> View Full Details
                          </button>
                          
                          {(app.status === 'pending' || app.status === 'waitlisted') && (
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button 
                                onClick={() => handleUpdateAppStatus(app.id, 'approved', app.app_role)}
                                disabled={statusUpdatingId === app.id}
                                style={{ padding: '8px 12px', background: '#10b981', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 600, fontSize: '13px', cursor: statusUpdatingId === app.id ? 'not-allowed' : 'pointer', opacity: statusUpdatingId === app.id ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                title="Approve & Onboard"
                              >
                                {statusUpdatingId === app.id ? <RefreshCw size={16} className="animate-spin" /> : <Check size={18} />}
                              </button>
                              {app.status !== 'waitlisted' && (
                                <button 
                                  onClick={() => handleUpdateAppStatus(app.id, 'waitlisted')}
                                  disabled={statusUpdatingId === app.id}
                                  style={{ padding: '8px 12px', background: '#6366f1', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 600, fontSize: '13px', cursor: statusUpdatingId === app.id ? 'not-allowed' : 'pointer', opacity: statusUpdatingId === app.id ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                  title="Waitlist Request"
                                >
                                  {statusUpdatingId === app.id ? <RefreshCw size={16} className="animate-spin" /> : <Clock size={18} />}
                                </button>
                              )}
                              <button 
                                onClick={() => handleUpdateAppStatus(app.id, 'rejected')}
                                disabled={statusUpdatingId === app.id}
                                style={{ padding: '8px 12px', background: '#ef4444', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 600, fontSize: '13px', cursor: statusUpdatingId === app.id ? 'not-allowed' : 'pointer', opacity: statusUpdatingId === app.id ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                title="Reject Request"
                              >
                                {statusUpdatingId === app.id ? <RefreshCw size={16} className="animate-spin" /> : <X size={18} />}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ));
            })()}
          </div>
        )}

        {/* Application Details Modal */}
        {selectedAppForDetail && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', padding: '20px' }} onClick={() => setSelectedAppForDetail(null)}>
            <div 
              style={{ background: '#fff', width: '100%', maxWidth: '800px', maxHeight: '90vh', borderRadius: '16px', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', animation: 'fadeIn 0.2s ease-out' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', borderRadius: '16px 16px 0 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#4c1d95', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 700, border: '3px solid #fff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                    {selectedAppForDetail.student?.name?.charAt(0) || 'S'}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {selectedAppForDetail.student?.name || 'Unknown Student'}
                      {selectedAppForDetail.student?.verified && <span title="Verified Account"><ShieldCheck size={18} color="#10b981" /></span>}
                    </h3>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={14} /> {selectedAppForDetail.student?.email || 'No email provided'}</span>
                      {selectedAppForDetail.student?.contact && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={14} /> {selectedAppForDetail.student?.contact}</span>}
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedAppForDetail(null)} style={{ background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', cursor: 'pointer', transition: 'all 0.2s' }}>
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                
                {/* Status Banner */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderRadius: '12px', marginBottom: '24px', background: selectedAppForDetail.status === 'pending' ? '#fffbeb' : selectedAppForDetail.status === 'approved' ? '#f0fdf4' : selectedAppForDetail.status === 'waitlisted' ? '#e0e7ff' : '#fef2f2', border: '1px solid', borderColor: selectedAppForDetail.status === 'pending' ? '#fde68a' : selectedAppForDetail.status === 'approved' ? '#bbf7d0' : selectedAppForDetail.status === 'waitlisted' ? '#c7d2fe' : '#fecaca' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {selectedAppForDetail.status === 'pending' && <Clock size={24} color="#d97706" />}
                    {selectedAppForDetail.status === 'waitlisted' && <Clock size={24} color="#4338ca" />}
                    {selectedAppForDetail.status === 'approved' && <CheckCircle size={24} color="#15803d" />}
                    {selectedAppForDetail.status === 'rejected' && <X size={24} color="#b91c1c" />}
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: selectedAppForDetail.status === 'pending' ? '#b45309' : selectedAppForDetail.status === 'approved' ? '#166534' : selectedAppForDetail.status === 'waitlisted' ? '#3730a3' : '#991b1b', textTransform: 'uppercase' }}>Current Status</div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: selectedAppForDetail.status === 'pending' ? '#92400e' : selectedAppForDetail.status === 'approved' ? '#14532d' : selectedAppForDetail.status === 'waitlisted' ? '#312e81' : '#7f1d1d' }}>
                        {selectedAppForDetail.status.toUpperCase()}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
                    Applied on: {selectedAppForDetail.submitted_at ? new Date(selectedAppForDetail.submitted_at).toLocaleDateString() : 'N/A'}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                  {/* Left Column */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div>
                      <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', borderBottom: '2px solid #f1f5f9', paddingBottom: '8px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ClipboardList size={16} color="#6366f1" /> Application Details
                      </h4>
                      <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Target Initiative</span>
                          <div style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', marginTop: '4px' }}>{selectedAppForDetail.challenge?.title}</div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Desired Role</span>
                            <div style={{ fontSize: '14px', fontWeight: 500, color: '#334155', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Briefcase size={14} color="#64748b" /> {selectedAppForDetail.app_role || 'Not Specified'}
                            </div>
                          </div>
                          <div>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Institution/Degree</span>
                            <div style={{ fontSize: '14px', fontWeight: 500, color: '#334155', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <GraduationCap size={14} color="#64748b" /> {selectedAppForDetail.app_major || 'N/A'} at {selectedAppForDetail.app_institution || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', borderBottom: '2px solid #f1f5f9', paddingBottom: '8px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ExternalLink size={16} color="#ec4899" /> Professional Links
                      </h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                        {selectedAppForDetail.app_cv ? (
                          <a href={selectedAppForDetail.app_cv} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: '#eff6ff', color: '#2563eb', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none', border: '1px solid #bfdbfe', transition: 'all 0.2s' }}>
                            <FileText size={16} /> View Resume / CV
                          </a>
                        ) : (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: '#f8fafc', color: '#94a3b8', borderRadius: '8px', fontSize: '13px', fontWeight: 500, border: '1px solid #e2e8f0' }}>
                            <FileText size={16} /> No Resume Provided
                          </span>
                        )}
                        
                        {selectedAppForDetail.app_linkedin && (
                          <a href={selectedAppForDetail.app_linkedin} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: '#f0f9ff', color: '#0369a1', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none', border: '1px solid #bae6fd', transition: 'all 0.2s' }}>
                            <ExternalLink size={14} /> LinkedIn
                          </a>
                        )}
                        {selectedAppForDetail.app_github && (
                          <a href={selectedAppForDetail.app_github} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: '#f1f5f9', color: '#334155', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none', border: '1px solid #cbd5e1', transition: 'all 0.2s' }}>
                            <ExternalLink size={14} /> GitHub
                          </a>
                        )}
                        {selectedAppForDetail.app_portfolio && (
                          <a href={selectedAppForDetail.app_portfolio} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: '#fdf4ff', color: '#c026d3', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none', border: '1px solid #fbcfe8', transition: 'all 0.2s' }}>
                            <ExternalLink size={14} /> Portfolio
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div>
                      <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', borderBottom: '2px solid #f1f5f9', paddingBottom: '8px', marginBottom: '12px' }}>
                        Motivation Statement
                      </h4>
                      <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '14px', color: '#334155', lineHeight: '1.6', whiteSpace: 'pre-wrap', fontStyle: 'italic', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                        "{selectedAppForDetail.app_motivation || 'No motivation statement provided.'}"
                      </div>
                    </div>

                    <div>
                      <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', borderBottom: '2px solid #f1f5f9', paddingBottom: '8px', marginBottom: '12px' }}>
                        Proposed Approach / Solution
                      </h4>
                      <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '14px', color: '#334155', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                        {selectedAppForDetail.app_solution || 'No specific approach was outlined by the candidate.'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer (Actions) */}
              <div style={{ padding: '20px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', borderRadius: '0 0 16px 16px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button 
                  onClick={() => setSelectedAppForDetail(null)} 
                  style={{ padding: '10px 20px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#475569', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
                >
                  Close
                </button>
                
                {(selectedAppForDetail.status === 'pending' || selectedAppForDetail.status === 'waitlisted') && (
                  <>
                    <button 
                      onClick={() => handleUpdateAppStatus(selectedAppForDetail.id, 'rejected')}
                      disabled={statusUpdatingId === selectedAppForDetail.id}
                      style={{ padding: '10px 20px', background: '#ef4444', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, fontSize: '14px', cursor: statusUpdatingId === selectedAppForDetail.id ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: statusUpdatingId === selectedAppForDetail.id ? 0.7 : 1 }}
                    >
                      {statusUpdatingId === selectedAppForDetail.id ? <RefreshCw size={18} className="animate-spin" /> : <X size={18} />} Reject
                    </button>
                    {selectedAppForDetail.status !== 'waitlisted' && (
                      <button 
                        onClick={() => handleUpdateAppStatus(selectedAppForDetail.id, 'waitlisted')}
                        disabled={statusUpdatingId === selectedAppForDetail.id}
                        style={{ padding: '10px 20px', background: '#6366f1', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, fontSize: '14px', cursor: statusUpdatingId === selectedAppForDetail.id ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: statusUpdatingId === selectedAppForDetail.id ? 0.7 : 1 }}
                      >
                        {statusUpdatingId === selectedAppForDetail.id ? <RefreshCw size={18} className="animate-spin" /> : <Clock size={18} />} Waitlist
                      </button>
                    )}
                    <button 
                      onClick={() => handleUpdateAppStatus(selectedAppForDetail.id, 'approved', selectedAppForDetail.app_role)}
                      disabled={statusUpdatingId === selectedAppForDetail.id}
                      style={{ padding: '10px 24px', background: '#10b981', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, fontSize: '14px', cursor: statusUpdatingId === selectedAppForDetail.id ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)', opacity: statusUpdatingId === selectedAppForDetail.id ? 0.7 : 1 }}
                    >
                      {statusUpdatingId === selectedAppForDetail.id ? <RefreshCw size={18} className="animate-spin" /> : <CheckCircle size={18} />} Approve & Onboard
                    </button>
                  </>
                )}
                
                {(selectedAppForDetail.status === 'approved' || selectedAppForDetail.status === 'rejected') && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: selectedAppForDetail.status === 'approved' ? '#15803d' : '#b91c1c', fontWeight: 600, fontSize: '14px', padding: '0 12px' }}>
                    {selectedAppForDetail.status === 'approved' ? <CheckCircle size={18} /> : <X size={18} />}
                    This application has been {selectedAppForDetail.status}.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        </>
            )}
          </div>
        )}

        {studentReviewTab === 'offers' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '-8px' }}>
              <button 
                onClick={() => setOfferSubTab('sent')}
                style={{ padding: '6px 12px', background: offerSubTab === 'sent' ? '#e2e8f0' : 'transparent', color: offerSubTab === 'sent' ? '#0f172a' : '#64748b', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
              >
                Sent (Direct Hires)
              </button>
              <button 
                onClick={() => setOfferSubTab('received')}
                style={{ padding: '6px 12px', background: offerSubTab === 'received' ? '#e2e8f0' : 'transparent', color: offerSubTab === 'received' ? '#0f172a' : '#64748b', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
              >
                Received
              </button>
            </div>

            {offerSubTab === 'received' ? (
              <div style={{ padding: '48px', textAlign: 'center', background: '#fff', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#64748b' }}>
                <Briefcase size={48} color="#cbd5e1" style={{ marginBottom: '16px' }} />
                <p style={{ fontSize: '18px', fontWeight: 600, color: '#334155', margin: '0 0 8px' }}>No Received Offers</p>
                <p style={{ margin: 0 }}>Institutions typically send direct offers to students, not receive them.</p>
              </div>
            ) : (
              <>
              <div style={{ padding: '32px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', margin: '0 0 24px' }}>Direct Hire (Send Offer)</h3>
                <form onSubmit={handleSendDirectOffer} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Student Email *</label>
                    <input 
                      type="email" 
                      required 
                      value={offerForm.studentEmail}
                      onChange={e => setOfferForm({ ...offerForm, studentEmail: e.target.value })}
                      placeholder="student@example.com"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Assign to Project *</label>
                    <select 
                      required
                      value={offerForm.challengeId}
                      onChange={e => setOfferForm({ ...offerForm, challengeId: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: '#fff' }}
                    >
                      <option value="">Select a project...</option>
                      {uniqueChallenges.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Role / Post *</label>
                    <input 
                      type="text" 
                      required 
                      value={offerForm.role}
                      onChange={e => setOfferForm({ ...offerForm, role: e.target.value })}
                      placeholder="e.g. Lead Developer, Researcher..."
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Message to Student</label>
                    <textarea 
                      rows={4}
                      value={offerForm.message}
                      onChange={e => setOfferForm({ ...offerForm, message: e.target.value })}
                      placeholder="Why are you offering them this role? What will they be doing?"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', resize: 'vertical' }}
                    />
                  </div>
                  <div style={{ marginTop: '8px' }}>
                    <button 
                      type="submit"
                      disabled={offerSubmitting}
                      style={{ padding: '10px 24px', background: '#4c1d95', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: offerSubmitting ? 'not-allowed' : 'pointer', opacity: offerSubmitting ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      {offerSubmitting ? 'Sending...' : <><Send size={18} /> Send Offer</>}
                    </button>
                  </div>
                </form>
              </div>
              
              {/* Sent Offers List */}
              <div style={{ marginTop: '32px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', margin: '0 0 16px' }}>Offers Sent</h3>
                {institutionApps.filter(a => a.status === 'offered').length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', color: '#64748b' }}>
                    <p style={{ margin: 0 }}>You haven't sent any offers yet.</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '16px' }}>
                    {institutionApps.filter(a => a.status === 'offered').map(app => (
                      <div key={app.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '16px' }}>{app.student?.name || 'Unknown Student'} ({app.student?.email})</div>
                          <div style={{ color: '#4c1d95', fontSize: '14px', fontWeight: 500, marginTop: '4px' }}>Offered Role: {app.app_role}</div>
                          <div style={{ color: '#64748b', fontSize: '13px', marginTop: '2px' }}>Project: {app.challenge?.title}</div>
                          <div style={{ color: '#64748b', fontSize: '13px', marginTop: '2px', fontStyle: 'italic' }}>Message: {app.app_motivation}</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                          <span style={{ background: '#dbeafe', color: '#1e3a8a', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Send size={12} /> Pending Acceptance
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
            )}
          </div>
        )}
      </div>
    );
  }

  // 6. COLLABORATION VIEW
  if (activeView === 'collaboration') {
    const otherInstitutions = institutions.filter(inst => inst.id !== activeOrgId);
    
    // Determine inbound engagements
    const myChallenges = challenges.filter(c => c.org_id === activeOrgId || c.institutions?.id === activeOrgId || (Array.isArray(c.institutions) && c.institutions.some((i:any) => i.id === activeOrgId)));
    const inboundEngagements = myChallenges.flatMap(c => 
      (c as any).industry_engagements ? (c as any).industry_engagements.map((eng: any) => ({ ...eng, challengeTitle: c.title })) : []
    );

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Handshake size={24} color="#4c1d95" /> Collaboration Hub
          </h2>
          <p style={{ color: '#64748b', margin: 0 }}>Manage inbound requests and find new partners to collaborate with.</p>
        </div>
        
        {/* Collaboration Tabs */}
        <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid #e2e8f0' }}>
          <button
            onClick={() => setCollabTab('inbound')}
            style={{ padding: '12px 16px', fontWeight: 600, background: 'none', border: 'none', borderBottom: collabTab === 'inbound' ? '2px solid #4f46e5' : '2px solid transparent', color: collabTab === 'inbound' ? '#4f46e5' : '#64748b', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Download size={18} /> Inbound Requests ({inboundEngagements.length})
          </button>
          <button
            onClick={() => setCollabTab('outbound')}
            style={{ padding: '12px 16px', fontWeight: 600, background: 'none', border: 'none', borderBottom: collabTab === 'outbound' ? '2px solid #4f46e5' : '2px solid transparent', color: collabTab === 'outbound' ? '#4f46e5' : '#64748b', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Search size={18} /> Find Partners
          </button>
        </div>

        {collabTab === 'inbound' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
            {inboundEngagements.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center', color: '#64748b', background: '#fff', borderRadius: '12px', border: '1px dashed #cbd5e1', gridColumn: '1 / -1' }}>
                <ClipboardList size={48} color="#cbd5e1" style={{ marginBottom: '16px' }} />
                <p style={{ fontSize: '15px' }}>No inbound collaboration requests yet.</p>
              </div>
            ) : (
              inboundEngagements.map((eng: any) => (
                <div key={eng.id} style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>{eng.institutions?.name || 'Unknown Partner'}</h3>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Project: {eng.challengeTitle}</p>
                  </div>
                  <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', fontSize: '14px', color: '#334155', whiteSpace: 'pre-wrap' }}>
                    {eng.proposal_notes}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px', background: eng.status === 'accepted' ? '#dcfce7' : eng.status === 'declined' ? '#fee2e2' : '#fef3c7', color: eng.status === 'accepted' ? '#166534' : eng.status === 'declined' ? '#991b1b' : '#92400e' }}>
                      {eng.status.toUpperCase()}
                    </span>
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>{eng.engagement_type.toUpperCase()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {otherInstitutions.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center', color: '#64748b', background: '#fff', borderRadius: '12px', border: '1px dashed #cbd5e1', gridColumn: '1 / -1' }}>
                <Handshake size={48} color="#cbd5e1" style={{ marginBottom: '16px' }} />
                <p style={{ fontSize: '15px' }}>No other institutions available for collaboration right now.</p>
              </div>
            ) : (
              otherInstitutions.map((inst: any) => (
                <div key={inst.id} style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f3e8ff', color: '#7e22ce', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '20px' }}>
                      {inst.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>{inst.name}</h3>
                      <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>{inst.type?.toUpperCase()} • {inst.district}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setCollabModalInst(inst);
                      setCollabForm({ challengeId: '', type: 'technology', customType: '', email: '', contact: '', address: '', notes: '' });
                    }}
                    style={{ padding: '10px', background: '#4c1d95', color: '#fff', borderRadius: '8px', fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s', marginTop: 'auto' }}
                  >
                    <Handshake size={16} /> Connect / Apply
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Collaboration Modal */}
        {collabModalInst && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', padding: '20px' }}>
            <div style={{ background: '#fff', width: '100%', maxWidth: '600px', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
              <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Connect with {collabModalInst.name}</h3>
                <button onClick={() => setCollabModalInst(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleCollabSubmit} style={{ padding: '24px', maxHeight: '75vh', overflowY: 'auto' }}>
                
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Select Target Project *</label>
                  <p style={{ fontSize: '12px', color: '#64748b', marginTop: 0, marginBottom: '8px' }}>Choose the project assigned to {collabModalInst.name} that you want to collaborate on.</p>
                  <select required value={collabForm.challengeId} onChange={e => setCollabForm({...collabForm, challengeId: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', background: '#fff' }}>
                    <option value="">-- Choose a project --</option>
                    {challenges.filter(c => c.org_id === collabModalInst.id || c.institutions?.id === collabModalInst.id || (Array.isArray(c.institutions) && c.institutions.some((i:any) => i.id === collabModalInst.id))).map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Engagement Type *</label>
                    <select required value={collabForm.type} onChange={e => setCollabForm({...collabForm, type: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', background: '#fff' }}>
                      <option value="technology">Technology & Technical Support</option>
                      <option value="research">Joint Research</option>
                      <option value="training">Training & Workshops</option>
                      <option value="resources">Shared Resources</option>
                      <option value="mentorship">Mentorship</option>
                      <option value="funding">Funding</option>
                      <option value="internships">Internships</option>
                      <option value="other">Other (Type below)</option>
                    </select>
                  </div>
                  {collabForm.type === 'other' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Specify Type *</label>
                      <input required type="text" value={collabForm.customType} onChange={e => setCollabForm({...collabForm, customType: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }} placeholder="e.g. Specialized Hardware" />
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Contact Email *</label>
                    <input required type="email" value={collabForm.email} onChange={e => setCollabForm({...collabForm, email: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }} placeholder="university@example.com" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Contact Phone *</label>
                    <input required type="tel" value={collabForm.contact} onChange={e => setCollabForm({...collabForm, contact: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }} placeholder="+91 XXXXX XXXXX" />
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Address *</label>
                  <input required type="text" value={collabForm.address} onChange={e => setCollabForm({...collabForm, address: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }} placeholder="Full Institution Address" />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Proposal Notes *</label>
                  <textarea required value={collabForm.notes} onChange={e => setCollabForm({...collabForm, notes: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', minHeight: '100px', resize: 'vertical' }} placeholder="How do you want to collaborate?" />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button type="button" onClick={() => setCollabModalInst(null)} style={{ padding: '10px 20px', borderRadius: '8px', background: '#f1f5f9', color: '#475569', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" disabled={collabSubmitting || !collabForm.challengeId || !collabForm.email || !collabForm.contact || !collabForm.address || !collabForm.notes} style={{ padding: '10px 20px', borderRadius: '8px', background: '#4c1d95', color: '#fff', fontWeight: 600, border: 'none', cursor: (collabSubmitting || !collabForm.challengeId || !collabForm.notes) ? 'not-allowed' : 'pointer', opacity: (collabSubmitting || !collabForm.challengeId || !collabForm.notes) ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {collabSubmitting ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
                    Send Proposal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 5a. TEAM FORMATION VIEW
  if (activeView === 'team') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={24} color="#4c1d95" /> Team Formation
          </h2>
          <p style={{ color: '#64748b', margin: 0 }}>Form and manage project teams.</p>
        </div>
        <div style={{ padding: '48px', textAlign: 'center', background: '#fff', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
          <p style={{ color: '#64748b' }}>Select an applicant from Requests & Offers to build your team.</p>
          <button onClick={() => setActiveView?.('workspace')} style={{ padding: '8px 16px', marginTop: '16px', background: '#4c1d95', color: '#fff', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Back to Workspace</button>
        </div>
      </div>
    );
  }

  // 5b. WORKSPACE VIEW
  if (activeView === 'workspace') {
    const activeProjects = institutionApps.filter(app => app.status === 'approved' || app.status === 'offered');

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={24} color="#4c1d95" /> Institution Workspace
          </h2>
          <p style={{ color: '#64748b', margin: 0 }}>Track active student projects, verify milestones, and review work logs.</p>
        </div>

        {institutionAppsLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading workspace...</div>
        ) : activeProjects.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#64748b', background: '#fff', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
            <Building2 size={48} color="#cbd5e1" style={{ marginBottom: '16px' }} />
            <p style={{ fontSize: '18px', fontWeight: 600, color: '#334155', margin: '0 0 8px' }}>No Active Projects</p>
            <p style={{ margin: 0 }}>Once you approve students or they accept offers, their project workspaces will appear here.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {activeProjects.map(app => {
              const projectMs = dbMilestones[app.id] || [];
              const completedCount = projectMs.filter(m => m.status === 'completed' || m.approval_status === 'approved').length;
              const progressPct = projectMs.length > 0 ? Math.round((completedCount / projectMs.length) * 100) : 0;

              if (!projectTeams[app.id] && !milestonesLoading[app.id]) {
                fetchTeamAndMilestones(app);
              }

              const approvalColor = (s: string) => s === 'approved' ? '#10b981' : s === 'rejected' ? '#ef4444' : '#f59e0b';
              const approvalLabel = (s: string) => s === 'approved' ? 'Approved ✓' : s === 'rejected' ? 'Rejected ✗' : 'Pending Review';
              const statusColor = (s: string) => s === 'completed' ? '#10b981' : s === 'submitted' ? '#6366f1' : s === 'in_progress' ? '#3b82f6' : '#94a3b8';

              return (
                <div key={app.id} style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                  <div style={{ background: 'linear-gradient(135deg, #4c1d95 0%, #1e3a8a 100%)', padding: '24px', color: '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '12px', fontWeight: 700, marginBottom: '12px', display: 'inline-block', letterSpacing: '1px' }}>
                          STUDENT PROJECT
                        </span>
                        <h3 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 8px' }}>{app.challenge?.title || 'Community Initiative'}</h3>
                        <p style={{ color: '#cbd5e1', margin: 0, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
                          <Briefcase size={15} /> Student: <strong style={{ color: '#fff' }}>{app.student?.name || 'Unknown'}</strong> ({app.app_role || 'Collaborator'})
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '28px', fontWeight: 800, color: progressPct === 100 ? '#10b981' : '#a78bfa' }}>{progressPct}%</div>
                        <div style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 600 }}>MILESTONE PROGRESS</div>
                        <div style={{ marginTop: '8px', width: '120px', height: '6px', background: 'rgba(255,255,255,0.2)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${progressPct}%`, height: '100%', background: progressPct === 100 ? '#10b981' : '#a78bfa', transition: 'width 0.4s ease' }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
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
                            placeholder="Description..."
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
                            <button onClick={() => handleAddMilestone(app)} disabled={savingMilestone} style={{ padding: '6px 16px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
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
                          <p style={{ margin: 0, fontSize: '14px' }}>No milestones yet. Add one above.</p>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '420px', overflowY: 'auto' }}>
                          {projectMs.map(m => (
                            <div key={m.id} style={{ background: '#f8fafc', borderRadius: '12px', border: `1px solid ${m.approval_status === 'approved' ? '#bbf7d0' : m.approval_status === 'rejected' ? '#fecaca' : m.status === 'submitted' ? '#e0e7ff' : '#e2e8f0'}`, overflow: 'hidden' }}>
                              <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0, background: statusColor(m.status), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      {(m.status === 'completed' || m.approval_status === 'approved') && <CheckCircle size={11} color="#fff" />}
                                    </div>
                                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>{m.title}</span>
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
                              {m.approval_notes && (
                                <div style={{ padding: '8px 14px', borderTop: '1px solid #e2e8f0', background: m.approval_status === 'approved' ? '#f0fdf4' : m.approval_status === 'rejected' ? '#fff1f2' : '#fffbeb', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                                  <span style={{ fontSize: '11px', fontWeight: 700, color: approvalColor(m.approval_status), flexShrink: 0, marginTop: '1px' }}>YOUR NOTE:</span>
                                  <span style={{ fontSize: '12px', color: '#475569', fontStyle: 'italic', lineHeight: 1.4 }}>{m.approval_notes}</span>
                                </div>
                              )}
                              {m.deliverable_url && (
                                <div style={{ padding: '10px 14px', borderTop: '1px solid #f1f5f9', background: '#fff' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <a href={m.deliverable_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                      📎 {m.deliverable_url}
                                    </a>
                                    <span style={{ fontSize: '11px', color: '#64748b', flexShrink: 0 }}>Submitted</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      <div>
                        <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FileText size={17} color="#4c1d95" /> Student Work Logs
                        </h4>
                        {(workLogs[app.id] || []).length === 0 ? (
                          <div style={{ padding: '16px', textAlign: 'center', border: '1px dashed #cbd5e1', borderRadius: '10px', color: '#94a3b8', fontSize: '13px' }}>
                            No logs submitted by student yet.
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                            {[...(workLogs[app.id] || [])].reverse().map(log => (
                              <div key={log.id} style={{ background: '#fff', borderRadius: '8px', padding: '10px 12px', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                                    {new Date(log.date).toLocaleDateString()}
                                  </span>
                                </div>
                                <p style={{ margin: 0, fontSize: '13px', color: '#334155', lineHeight: 1.5 }}>{log.text}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {(() => {
                        const roster = teamRosters[app.id] || [];
                        return (
                          <div style={{ background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                            <div style={{ padding: '12px 16px', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Users size={16} color="#4c1d95" /> Team Roster
                              </h4>
                              <button
                                onClick={() => downloadTeamPDF(app.challenge?.title || 'Project', roster, app.student?.name || 'Student', app.app_role || 'Role')}
                                style={{ padding: '5px 12px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '7px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                              >
                                <Download size={12} /> PDF
                              </button>
                            </div>

                            <div style={{ padding: '10px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px', background: '#eef2ff' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#4c1d95', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px', flexShrink: 0 }}>
                                {(app.student?.name || 'U')[0].toUpperCase()}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>{app.student?.name || 'Student'}</p>
                                <p style={{ margin: 0, fontSize: '12px', color: '#4338ca' }}>{app.app_role || 'Collaborator'}</p>
                              </div>
                            </div>

                            <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                              {roster.map(m => (
                                <div key={m.id} style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                  <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#94a3b8', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px', flexShrink: 0 }}>
                                    {m.name[0].toUpperCase()}
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>{m.name}</p>
                                    <p style={{ margin: '1px 0', fontSize: '12px', color: '#6366f1', fontWeight: 600 }}>{m.role}</p>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <button
                              onClick={() => setActiveView?.('team')}
                              style={{ width: '100%', padding: '10px', background: 'transparent', border: 'none', borderTop: '1px solid #e2e8f0', color: '#4c1d95', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                            >
                              + Add Team Member
                            </button>
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

  // 7. CHALLENGES VIEW (Assigned & Claimable Challenges)
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>
            Assigned & Claimable Challenges
          </h2>
          <p style={{ fontSize: '15px', color: '#64748b', margin: 0 }}>
            Review, claim, and work on civic challenges. When claimed, the Memento Admin verifies and assigns the problem to your institution.
          </p>
        </div>
        
        {/* Active Institution Badge */}
        {(currentInstitution || user?.name) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', padding: '8px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
            <Building2 size={16} color="#4c1d95" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Institution:</span>
            {isSuperAdmin && institutions.length > 1 ? (
              <select
                value={activeOrgId}
                onChange={(e) => setSelectedOrgId(e.target.value)}
                style={{ border: 'none', background: 'transparent', fontWeight: 700, color: '#0f172a', fontSize: '13px', cursor: 'pointer', outline: 'none' }}
              >
                {institutions.map(inst => (
                  <option key={inst.id} value={inst.id}>{inst.name} ({inst.district || inst.type})</option>
                ))}
              </select>
            ) : (
              <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '13px' }}>
                {currentInstitution ? `${currentInstitution.name}${currentInstitution.district ? ` (${currentInstitution.district})` : ''}` : (user?.name || 'My Institution')}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => setFilterTab('all')}
          style={{
            padding: '8px 16px',
            borderRadius: '24px',
            border: '1px solid',
            borderColor: filterTab === 'all' ? '#4c1d95' : '#cbd5e1',
            background: filterTab === 'all' ? '#f5f3ff' : '#fff',
            color: filterTab === 'all' ? '#4c1d95' : '#475569',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer'
          }}
        >
          All Challenges ({challenges.length})
        </button>

        <button
          type="button"
          onClick={() => setFilterTab('verified')}
          style={{
            padding: '8px 16px',
            borderRadius: '24px',
            border: '1px solid',
            borderColor: filterTab === 'verified' ? '#10b981' : '#cbd5e1',
            background: filterTab === 'verified' ? '#ecfdf5' : '#fff',
            color: filterTab === 'verified' ? '#047857' : '#475569',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <CheckCircle size={14} /> Verified & Assigned to Us ({myVerifiedChallenges.length})
        </button>

        <button
          type="button"
          onClick={() => setFilterTab('pending')}
          style={{
            padding: '8px 16px',
            borderRadius: '24px',
            border: '1px solid',
            borderColor: filterTab === 'pending' ? '#f59e0b' : '#cbd5e1',
            background: filterTab === 'pending' ? '#fef3c7' : '#fff',
            color: filterTab === 'pending' ? '#b45309' : '#475569',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Clock size={14} /> Pending Claims ({myPendingClaims.length})
        </button>

        <button
          type="button"
          onClick={() => setFilterTab('available')}
          style={{
            padding: '8px 16px',
            borderRadius: '24px',
            border: '1px solid',
            borderColor: filterTab === 'available' ? '#2563eb' : '#cbd5e1',
            background: filterTab === 'available' ? '#eff6ff' : '#fff',
            color: filterTab === 'available' ? '#1d4ed8' : '#475569',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer'
          }}
        >
          Available to Claim ({availableChallenges.length})
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading challenges...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {challenges.length === 0 && filterTab !== 'proposals' && (
            <div style={{ textAlign: 'center', padding: '40px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#64748b' }}>
              No challenges currently assigned to your institution.
            </div>
          )}

          {filterTab === 'proposals' && (
            myProposals.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#64748b' }}>
                <FileText size={40} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
                <h4 style={{ margin: '0 0 6px', color: '#334155', fontSize: '16px' }}>No Bids Submitted</h4>
                <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>You haven't submitted any proposals yet.</p>
              </div>
            ) : (
              myProposals.map(p => (
                <div key={p.id} style={{ background: p.status === 'approved' ? '#f0fdf4' : p.status === 'rejected' ? '#fef2f2' : '#fff', border: `1px solid ${p.status === 'approved' ? '#bbf7d0' : p.status === 'rejected' ? '#fecaca' : '#e2e8f0'}`, borderRadius: '12px', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', background: p.status === 'approved' ? '#dcfce7' : p.status === 'rejected' ? '#fee2e2' : '#fef3c7', color: p.status === 'approved' ? '#166534' : p.status === 'rejected' ? '#991b1b' : '#92400e', padding: '4px 10px', borderRadius: '6px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        {p.status === 'approved' ? <CheckCircle size={13} /> : p.status === 'rejected' ? <AlertCircle size={13} /> : <Clock size={13} />} 
                        {p.status.toUpperCase()}
                      </span>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>Submitted: {new Date(p.created_at).toLocaleDateString()}</span>
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>{p.challenges?.title || 'Unknown Challenge'}</h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '12px 24px', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '16px' }}>
                      <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 600 }}>Budget:</div>
                      <div style={{ color: '#0f172a', fontSize: '14px', fontWeight: 500 }}>{p.budget_estimate}</div>
                      
                      <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 600 }}>Timeline:</div>
                      <div style={{ color: '#0f172a', fontSize: '14px', fontWeight: 500 }}>{p.timeline_estimate}</div>
                      
                      <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 600 }}>Solution:</div>
                      <div style={{ color: '#334155', fontSize: '14px', whiteSpace: 'pre-wrap' }}>{p.proposal_text}</div>
                    </div>
                  </div>
                </div>
              ))
            )
          )}

          {filterTab !== 'proposals' && displayedChallenges.map(c => {
            const isMineChallenge = isMine(c);
            const isPendingClaimByMe = isMineChallenge && c.status === 'under_review';
            const isVerifiedAndOccupiedByMe = isMineChallenge && ['in_progress', 'team_formed', 'under_action', 'completed', 'resolved'].includes(c.status);
            const isOccupiedByOther = Boolean(c.assigned_institution_id && !isMineChallenge && ['in_progress', 'team_formed', 'under_action', 'completed', 'resolved'].includes(c.status));
            const isUnderAction = ['under_action', 'in_progress', 'team_formed'].includes(c.status);

            const occupiedInstName = (isVerifiedAndOccupiedByMe || isOccupiedByOther) 
              ? (c.institutions?.name || (institutions.find(i => i.id === c.assigned_institution_id)?.name)) 
              : null;

            return (
              <div 
                key={c.id} 
                style={{ 
                  background: isVerifiedAndOccupiedByMe ? '#f0fdf4' : isPendingClaimByMe ? '#fffbeb' : '#fff', 
                  border: isVerifiedAndOccupiedByMe ? '2px solid #86efac' : isPendingClaimByMe ? '2px solid #fde68a' : '1px solid #e2e8f0', 
                  borderRadius: '12px', 
                  padding: '24px', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  gap: '20px',
                  boxShadow: isVerifiedAndOccupiedByMe ? '0 2px 6px rgba(16, 185, 129, 0.08)' : '0 1px 3px rgba(0,0,0,0.02)'
                }}
              >
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>{c.title}</h3>
                  <p style={{ fontSize: '15px', color: '#475569', margin: '0 0 12px', maxWidth: '750px' }}>{c.description}</p>
                  
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} /> {new Date(c.created_at).toLocaleDateString()}
                    </span>

                    {c.district && (
                      <span style={{ fontSize: '11px', background: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                        {c.district}
                      </span>
                    )}
                    {c.location_text && (
                      <a 
                        href={c.location_text.startsWith('http') ? c.location_text : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.location_text)}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', background: '#eff6ff', color: '#2563eb', padding: '2px 6px', borderRadius: '4px', fontWeight: 600, textDecoration: 'none' }}
                      >
                        <MapPin size={10} style={{ marginRight: 2 }} />
                        Map Link
                      </a>
                    )}

                    {c.category && (
                      <span style={{ fontSize: '12px', background: '#f8fafc', color: '#475569', padding: '4px 8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                        {c.category}
                      </span>
                    )}

                    {/* Status Badge */}
                    {c.status === 'under_review' ? (
                      <span style={{ fontSize: '12px', background: '#fef3c7', color: '#b45309', padding: '4px 8px', borderRadius: '4px', border: '1px solid #fde68a', fontWeight: 600 }}>
                        CLAIM PENDING ADMIN VERIFICATION
                      </span>
                    ) : (
                      <span style={{ 
                        fontSize: '12px', 
                        background: isUnderAction ? '#fefce8' : '#eef2ff', 
                        color: isUnderAction ? '#a16207' : '#4f46e5', 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        border: `1px solid ${isUnderAction ? '#fef08a' : '#c7d2fe'}`,
                        fontWeight: 600 
                      }}>
                        {c.status.replace('_', ' ').toUpperCase()}
                      </span>
                    )}

                    {/* Pending Claim or Occupied Institution Badge */}
                    {isPendingClaimByMe ? (
                      <span style={{ 
                        fontSize: '12px', 
                        background: '#fef3c7', 
                        color: '#92400e', 
                        padding: '4px 10px', 
                        borderRadius: '6px', 
                        border: '1px solid #fde68a',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}>
                        <Clock size={13} /> Claim Requested by Your Institution
                      </span>
                    ) : occupiedInstName ? (
                      <span style={{ 
                        fontSize: '12px', 
                        background: isVerifiedAndOccupiedByMe ? '#dcfce7' : '#f0fdf4', 
                        color: isVerifiedAndOccupiedByMe ? '#15803d' : '#166534', 
                        padding: '4px 10px', 
                        borderRadius: '6px', 
                        border: `1px solid ${isVerifiedAndOccupiedByMe ? '#86efac' : '#bbf7d0'}`,
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}>
                        <Building2 size={13} /> {isVerifiedAndOccupiedByMe ? `✓ Verified & Assigned to: ${occupiedInstName}` : `Occupied by: ${occupiedInstName}`}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div>
                  {isVerifiedAndOccupiedByMe ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <button 
                        disabled
                        style={{
                          background: '#10b981',
                          color: '#fff',
                          border: 'none',
                          padding: '10px 18px',
                          borderRadius: '8px',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'default',
                          boxShadow: '0 1px 2px rgba(16, 185, 129, 0.2)'
                        }}
                      >
                        <CheckCircle size={18} /> Verified & Occupied by You
                      </button>

                      {c.ai_classification?.vacancies_released ? (
                        <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                          <button
                            onClick={async () => {
                              setSelectedChallengeForApps(c);
                              setStudentAppsModalOpen(true);
                              setAppsLoading(true);
                              const apps = await dashboardsApi.getChallengeApplications(c.id);
                              setStudentApps(apps);
                              setAppsLoading(false);
                            }}
                            style={{
                              flex: 1,
                              background: '#eff6ff',
                              color: '#1d4ed8',
                              border: '1px solid #bfdbfe',
                              padding: '10px 18px',
                              borderRadius: '8px',
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.background = '#dbeafe'; }}
                            onMouseOut={(e) => { e.currentTarget.style.background = '#eff6ff'; }}
                          >
                            <Users size={16} /> View Student Requests
                          </button>
                          <button
                          onClick={async () => {
                            try {
                              await dashboardsApi.releaseVacancy(c.id, false);
                              await fetchChallenges();
                              showAlert('Vacancy closed. Students can no longer apply.', 'success');
                            } catch (e: any) {
                              showAlert('Failed to close vacancy: ' + (e.message || 'Error occurred'), 'error');
                            }
                          }}
                          style={{
                            background: '#f1f5f9',
                            color: '#475569',
                            border: '1px solid #cbd5e1',
                            padding: '10px 18px',
                            borderRadius: '8px',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                          onMouseOver={(e) => { e.currentTarget.style.background = '#e2e8f0'; }}
                          onMouseOut={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
                        >
                          <CheckCircle size={16} /> Vacancy Open (Click to Close)
                        </button>
                        </div>
                      ) : (
                        <button
                          onClick={async () => {
                            try {
                              await dashboardsApi.releaseVacancy(c.id, true);
                              await fetchChallenges();
                              showAlert('Vacancy released successfully! Students can now apply.', 'success');
                            } catch (e: any) {
                              showAlert('Failed to release vacancy: ' + (e.message || 'Error occurred'), 'error');
                            }
                          }}
                          style={{
                            background: '#2563eb',
                            color: '#fff',
                            border: 'none',
                            padding: '10px 18px',
                            borderRadius: '8px',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            cursor: 'pointer',
                            boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
                          }}
                        >
                          <Users size={16} /> Release Vacancy
                        </button>
                      )}
                    </div>
                  ) : isPendingClaimByMe ? (
                    <button 
                      disabled
                      style={{
                        background: '#fef3c7',
                        color: '#b45309',
                        border: '1px solid #fde68a',
                        padding: '10px 18px',
                        borderRadius: '8px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'default'
                      }}
                    >
                      <Clock size={16} /> Pending Verification
                    </button>
                  ) : isOccupiedByOther ? (
                    <button 
                      disabled
                      style={{
                        background: '#94a3b8',
                        color: '#fff',
                        border: 'none',
                        padding: '10px 18px',
                        borderRadius: '8px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'not-allowed'
                      }}
                    >
                      <Building2 size={16} /> {c.status === 'under_review' ? 'Claim Pending Other Inst' : 'Occupied by Other'}
                    </button>
                  ) : (c.status === 'submitted') ? (
                    <button 
                      disabled
                      style={{
                        background: '#f1f5f9',
                        color: '#94a3b8',
                        border: '1px solid #e2e8f0',
                        padding: '10px 18px',
                        borderRadius: '8px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'not-allowed'
                      }}
                    >
                      <Building2 size={16} /> Bidding Not Open
                    </button>
                  ) : myProposals.some(p => p.challenge_id === c.id) ? (
                    <button 
                      disabled
                      style={{
                        background: '#f8fafc',
                        color: '#334155',
                        border: '1px solid #cbd5e1',
                        padding: '10px 18px',
                        borderRadius: '8px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'default'
                      }}
                    >
                      <FileText size={16} /> Proposal Submitted
                    </button>
                  ) : (c.status !== 'routed') ? (
                    <button 
                      disabled
                      style={{
                        background: '#f1f5f9',
                        color: '#94a3b8',
                        border: '1px solid #e2e8f0',
                        padding: '10px 18px',
                        borderRadius: '8px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'not-allowed'
                      }}
                    >
                      <Building2 size={16} /> Submit Proposal
                    </button>
                  ) : (
                    <button 
                      onClick={() => {
                        setSelectedChallengeForProposal(c);
                        setProposalModalOpen(true);
                      }}
                      style={{
                        background: '#2563eb',
                        color: '#fff',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
                      }}
                    >
                      <Building2 size={16} /> Submit Proposal
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PROPOSAL SUBMISSION MODAL */}
      {proposalModalOpen && selectedChallengeForProposal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px'
        }}>
          <div style={{
            background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '600px',
            maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>Submit Tender Proposal</h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>For: <strong style={{ color: '#0f172a' }}>{selectedChallengeForProposal.title}</strong></p>
              </div>
              <button 
                onClick={() => setProposalModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '24px', color: '#94a3b8', cursor: 'pointer', lineHeight: 1 }}
              >&times;</button>
            </div>
            
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                  Proposed Solution & Strategy <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea 
                  value={proposalForm.proposal_text}
                  onChange={e => setProposalForm({ ...proposalForm, proposal_text: e.target.value })}
                  placeholder="Describe how your institution plans to solve this civic problem..."
                  style={{ width: '100%', minHeight: '120px', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                    Estimated Budget <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input 
                    type="text" 
                    value={proposalForm.budget_estimate}
                    onChange={e => setProposalForm({ ...proposalForm, budget_estimate: e.target.value })}
                    placeholder="e.g. ₹50,000 or Nil"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                    Estimated Timeline <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input 
                    type="text" 
                    value={proposalForm.timeline_estimate}
                    onChange={e => setProposalForm({ ...proposalForm, timeline_estimate: e.target.value })}
                    placeholder="e.g. 3 Months"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                  Proposed Collaborators (if any)
                </label>
                <input 
                  type="text" 
                  value={proposalForm.proposed_collaboration}
                  onChange={e => setProposalForm({ ...proposalForm, proposed_collaboration: e.target.value })}
                  placeholder="e.g. Seeking collaboration with IIT Bombay for IoT sensors"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                  Contact Phone <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input 
                  type="tel" 
                  value={proposalForm.contact_phone}
                  onChange={e => setProposalForm({ ...proposalForm, contact_phone: e.target.value })}
                  placeholder="Your verified mobile number"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px' }}
                />
              </div>
            </div>

            <div style={{ padding: '20px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', borderRadius: '0 0 16px 16px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                onClick={() => setProposalModalOpen(false)}
                style={{ padding: '10px 20px', background: '#fff', border: '1px solid #cbd5e1', color: '#475569', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
              >Cancel</button>
              <button 
                onClick={handleSubmitProposal}
                disabled={loading || !proposalForm.proposal_text.trim() || !proposalForm.budget_estimate.trim() || !proposalForm.timeline_estimate.trim() || !(proposalForm.contact_phone || user?.contact)}
                style={{ padding: '10px 24px', background: '#2563eb', border: 'none', color: '#fff', borderRadius: '8px', fontWeight: 600, cursor: loading || !proposalForm.proposal_text.trim() || !proposalForm.budget_estimate.trim() || !proposalForm.timeline_estimate.trim() || !(proposalForm.contact_phone || user?.contact) ? 'not-allowed' : 'pointer', opacity: loading || !proposalForm.proposal_text.trim() || !proposalForm.budget_estimate.trim() || !proposalForm.timeline_estimate.trim() || !(proposalForm.contact_phone || user?.contact) ? 0.7 : 1 }}
              >
                {loading ? 'Submitting...' : 'Submit Proposal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Applications Modal */}
      {studentAppsModalOpen && selectedChallengeForApps && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>Student Requests</h2>
                <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#64748b' }}>For {selectedChallengeForApps.title}</p>
              </div>
              <button 
                onClick={() => setStudentAppsModalOpen(false)}
                style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}
              >×</button>
            </div>
            
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              {appsLoading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading applications...</div>
              ) : studentApps.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                  <Users size={48} color="#94a3b8" style={{ margin: '0 auto 16px' }} />
                  <h3 style={{ margin: '0 0 8px', color: '#334155', fontSize: '18px' }}>No student requests yet</h3>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Wait for students to volunteer for this project.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {studentApps.map((app, idx) => (
                    <div key={idx} style={{ padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#fff' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <div>
                          <h4 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>Student from {app.app_institution || 'Unknown Institution'}</h4>
                          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Submitted: {new Date(app.submitted_at).toLocaleDateString()}</p>
                        </div>
                        <span style={{ padding: '4px 10px', background: '#dbeafe', color: '#1d4ed8', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
                          {app.app_role || 'Volunteer'}
                        </span>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ fontSize: '14px' }}><strong style={{ color: '#475569' }}>Major:</strong> {app.app_major}</div>
                        <div style={{ fontSize: '14px' }}><strong style={{ color: '#475569' }}>Graduation Year:</strong> {app.app_grad_year}</div>
                      </div>

                      <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                        <h5 style={{ margin: '0 0 8px', fontSize: '14px', color: '#334155' }}>Motivation / Proposed Solution</h5>
                        <p style={{ margin: 0, fontSize: '14px', color: '#475569', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                          {app.app_solution || app.app_motivation || 'No details provided.'}
                        </p>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                        {app.app_email && (
                          <a href={`mailto:${app.app_email}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#2563eb', textDecoration: 'none', background: '#eff6ff', padding: '6px 12px', borderRadius: '6px', fontWeight: 500 }}>
                            <Mail size={14} /> Contact
                          </a>
                        )}
                        {app.app_linkedin && (
                          <a href={app.app_linkedin} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#0f172a', textDecoration: 'none', background: '#f1f5f9', padding: '6px 12px', borderRadius: '6px', fontWeight: 500 }}>
                            <ClipboardList size={14} /> LinkedIn
                          </a>
                        )}
                        {app.app_github && (
                          <a href={app.app_github} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#0f172a', textDecoration: 'none', background: '#f1f5f9', padding: '6px 12px', borderRadius: '6px', fontWeight: 500 }}>
                            <ClipboardList size={14} /> GitHub
                          </a>
                        )}
                        {app.app_portfolio && (
                          <a href={app.app_portfolio} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#0f172a', textDecoration: 'none', background: '#f1f5f9', padding: '6px 12px', borderRadius: '6px', fontWeight: 500 }}>
                            <ClipboardList size={14} /> Portfolio
                          </a>
                        )}
                        {app.app_cv && (
                          <a href={app.app_cv} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#16a34a', textDecoration: 'none', background: '#dcfce7', padding: '6px 12px', borderRadius: '6px', fontWeight: 500 }}>
                            <FileText size={14} /> View CV
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Make an Instance Modal */}
      {instanceModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', padding: '20px' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: '400px', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={20} color="#8b5cf6" /> Make an Instance
              </h3>
              <button onClick={() => setInstanceModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateInstance} style={{ padding: '24px' }}>
              <p style={{ fontSize: '14px', color: '#475569', marginBottom: '20px' }}>
                Create a sub-account for a faculty member or department. They will get a unique login but notifications will route to the main institutional email.
              </p>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Instance Name / Faculty Name *</label>
                <input 
                  required 
                  type="text" 
                  value={instanceName} 
                  onChange={e => setInstanceName(e.target.value)} 
                  placeholder="e.g. Computer Science Dept" 
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }} 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setInstanceModalOpen(false)} style={{ padding: '10px 16px', borderRadius: '8px', background: '#f1f5f9', color: '#475569', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={instanceSubmitting || !instanceName} 
                  style={{ padding: '10px 16px', borderRadius: '8px', background: '#8b5cf6', color: '#fff', fontWeight: 600, border: 'none', cursor: (instanceSubmitting || !instanceName) ? 'not-allowed' : 'pointer', opacity: (instanceSubmitting || !instanceName) ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {instanceSubmitting ? <RefreshCw size={16} className="animate-spin" /> : <UserPlus size={16} />}
                  Generate Instance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
