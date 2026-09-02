import React, { useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { X, Trash2, Copy, Trash, BellRing, CheckSquare, Square } from 'lucide-react';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose }) => {
  const { notifications, deleteNotifications, clearAll, addNotification, markAsRead } = useNotifications();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleSelectAll = () => {
    if (selectedIds.length === notifications.length && notifications.length > 0) {
      setSelectedIds([]); // Deselect all
    } else {
      setSelectedIds(notifications.map(n => n.id));
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selId => selId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    deleteNotifications(selectedIds);
    setSelectedIds([]);
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to delete all notifications?')) {
      clearAll();
      setSelectedIds([]);
    }
  };

  const handleCopySelected = () => {
    if (selectedIds.length === 0) return;
    const selectedNotifs = notifications.filter(n => selectedIds.includes(n.id));
    const textToCopy = selectedNotifs
      .map(n => `[${new Date(n.timestamp).toLocaleString()}] ${n.title}\n${n.body}`)
      .join('\n\n');
      
    navigator.clipboard.writeText(textToCopy).then(() => {
      alert('Selected notifications copied to clipboard!');
      // Mark as read after copying
      markAsRead(selectedIds);
    });
  };

  const handleGenerateDemo = () => {
    const demoTitles = ['System Update', 'New Comment', 'Problem Solved', 'Reminder'];
    const demoBodies = [
      'Your recent submission has been reviewed and approved.',
      'A user commented on your post regarding waste management.',
      'The issue "Potholes on Main Street" has been marked as completed!',
      'Don\'t forget to complete your profile for a top contributor badge.'
    ];
    const randIndex = Math.floor(Math.random() * demoTitles.length);
    addNotification(demoTitles[randIndex], demoBodies[randIndex]);
  };

  const isAllSelected = notifications.length > 0 && selectedIds.length === notifications.length;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.4)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '560px',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
      }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>Notifications</h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>Temporarily saved for 24 hours</p>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button 
              onClick={handleSelectAll}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', color: '#475569', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            >
              {isAllSelected ? <CheckSquare size={16} color="#2563eb" /> : <Square size={16} />}
              Select All
            </button>
            
            {selectedIds.length > 0 && (
              <>
                <div style={{ width: '1px', height: '16px', background: '#cbd5e1' }} />
                <button 
                  onClick={handleCopySelected}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', color: '#0f172a', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
                >
                  <Copy size={14} /> Copy
                </button>
                <button 
                  onClick={handleDeleteSelected}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', color: '#ef4444', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
                >
                  <Trash2 size={14} /> Delete Selected
                </button>
              </>
            )}
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
             <button 
              onClick={handleClearAll}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', color: '#ef4444', fontSize: '13px', fontWeight: 500, cursor: 'pointer', opacity: notifications.length === 0 ? 0.5 : 1 }}
              disabled={notifications.length === 0}
            >
              <Trash size={14} /> Clear All
            </button>
          </div>
        </div>

        {/* List Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 24px', background: '#f8fafc' }}>
          {notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
              <BellRing size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
              <p style={{ margin: 0, fontSize: '15px' }}>You have no new notifications.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {notifications.map(n => (
                <div 
                  key={n.id} 
                  style={{ 
                    display: 'flex', 
                    gap: '12px', 
                    background: '#ffffff', 
                    padding: '16px', 
                    borderRadius: '12px', 
                    border: '1px solid',
                    borderColor: selectedIds.includes(n.id) ? '#bfdbfe' : '#e2e8f0',
                    boxShadow: selectedIds.includes(n.id) ? '0 0 0 2px #eff6ff' : 'none',
                    transition: 'all 0.2s',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleSelectOne(n.id)}
                >
                  <div style={{ paddingTop: '2px' }}>
                    {selectedIds.includes(n.id) ? <CheckSquare size={18} color="#2563eb" /> : <Square size={18} color="#94a3b8" />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                      <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: !n.isRead ? '#0f172a' : '#475569' }}>
                        {n.title}
                      </h4>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                        {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '14px', color: '#64748b', lineHeight: 1.5 }}>{n.body}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer removed as requested */}
      </div>
    </div>
  );
};
