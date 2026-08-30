import React from 'react';
import { Flame, AlertTriangle, Check } from 'lucide-react';

interface PriorityIndicatorProps {
  score: number;
  showLabel?: boolean;
}

export const PriorityIndicator: React.FC<PriorityIndicatorProps> = ({ score, showLabel = true }) => {
  const isHigh = score >= 80;
  const isMed = score >= 50 && score < 80;

  const getStyleClass = () => {
    if (isHigh) return 'priority-high';
    if (isMed) return 'priority-medium';
    return 'priority-low';
  };

  const getIcon = () => {
    if (isHigh) return <Flame size={13} />;
    if (isMed) return <AlertTriangle size={13} />;
    return <Check size={13} />;
  };

  const getLabel = () => {
    if (isHigh) return 'High Severity';
    if (isMed) return 'Moderate';
    return 'Standard';
  };

  return (
    <span className={`priority-pill ${getStyleClass()}`}>
      {getIcon()}
      <span>{score.toFixed(0)}/100</span>
      {showLabel && <span style={{ opacity: 0.85, fontSize: '0.72rem' }}>• {getLabel()}</span>}
    </span>
  );
};
