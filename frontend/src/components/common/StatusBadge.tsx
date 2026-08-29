import React from 'react';
import { ChallengeStatus } from '../../types/challenge.types';
import { Clock, CheckCircle, Search, Users, Wrench, CheckCheck, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: ChallengeStatus | string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'submitted':
        return { label: 'Submitted', class: 'badge-submitted', icon: <Clock size={11} /> };
      case 'under_review':
        return { label: 'Under Review', class: 'badge-under_review', icon: <Search size={11} /> };
      case 'routed':
        return { label: 'Routed to Univ', class: 'badge-routed', icon: <CheckCircle size={11} /> };
      case 'team_formed':
        return { label: 'Team Formed', class: 'badge-team_formed', icon: <Users size={11} /> };
      case 'in_progress':
        return { label: 'In Progress', class: 'badge-in_progress', icon: <Wrench size={11} /> };
      case 'completed':
        return { label: 'Completed', class: 'badge-completed', icon: <CheckCircle size={11} /> };
      case 'validated':
        return { label: 'Govt Validated', class: 'badge-validated', icon: <CheckCheck size={11} /> };
      case 'rejected':
        return { label: 'Rejected', class: 'badge-rejected', icon: <XCircle size={11} /> };
      default:
        return { label: status, class: 'badge-submitted', icon: <Clock size={11} /> };
    }
  };

  const config = getStatusConfig();

  return (
    <span className={`badge ${config.class}`}>
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
};
