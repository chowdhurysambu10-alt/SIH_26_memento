import React from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useNotifications();

  if (toasts.length === 0) return null;

  return (
    <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '420px', width: '100%' }}>
      {toasts.map((toast) => {
        const getIcon = () => {
          switch (toast.type) {
            case 'success':
              return <CheckCircle2 size={20} color="#10b981" />;
            case 'warning':
              return <AlertTriangle size={20} color="#f59e0b" />;
            case 'error':
              return <XCircle size={20} color="#f43f5e" />;
            default:
              return <Info size={20} color="#3b82f6" />;
          }
        };

        const getBorderColor = () => {
          switch (toast.type) {
            case 'success': return 'rgba(16, 185, 129, 0.4)';
            case 'warning': return 'rgba(245, 158, 11, 0.4)';
            case 'error': return 'rgba(244, 63, 94, 0.4)';
            default: return 'rgba(59, 130, 246, 0.4)';
          }
        };

        return (
          <div
            key={toast.id}
            className="glass-panel"
            style={{
              padding: '1rem 1.25rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.85rem',
              borderLeft: `4px solid ${getBorderColor()}`,
              boxShadow: 'var(--shadow-lg)',
              animation: 'float 0.3s ease-out',
            }}
          >
            <div style={{ marginTop: '2px' }}>{getIcon()}</div>
            <div style={{ flex: 1 }}>
              <h5 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                {toast.title}
              </h5>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
