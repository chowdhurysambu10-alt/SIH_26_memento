import React, { useState, useEffect } from 'react';
import { NETWORK_EVENTS } from '../utils/networkEvents';
import { WifiOff, AlertTriangle, X } from 'lucide-react';

export const NetworkStatusUI: React.FC = () => {
  const [activeRequests, setActiveRequests] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleStart = () => setActiveRequests(prev => prev + 1);
    const handleEnd = () => setActiveRequests(prev => Math.max(0, prev - 1));
    const handleError = (e: any) => {
      setErrorMsg(e.detail?.message || 'An unexpected error occurred');
      
      // Auto-dismiss API errors after 5 seconds if we are online
      if (navigator.onLine) {
        setTimeout(() => setErrorMsg(null), 5000);
      }
    };

    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => {
      setIsOffline(false);
      setErrorMsg(null); // Clear offline error when back online
    };

    window.addEventListener(NETWORK_EVENTS.START, handleStart);
    window.addEventListener(NETWORK_EVENTS.END, handleEnd);
    window.addEventListener(NETWORK_EVENTS.ERROR, handleError);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener(NETWORK_EVENTS.START, handleStart);
      window.removeEventListener(NETWORK_EVENTS.END, handleEnd);
      window.removeEventListener(NETWORK_EVENTS.ERROR, handleError);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const showLoader = activeRequests > 0;
  const showError = isOffline || errorMsg;

  return (
    <>
      {/* Global Top Loading Bar */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: showLoader ? 'linear-gradient(90deg, #2563eb 0%, #60a5fa 50%, #2563eb 100%)' : 'transparent',
          backgroundSize: '200% 100%',
          animation: showLoader ? 'loading-bar 1.5s infinite linear' : 'none',
          zIndex: 99999,
          transition: 'background 0.3s ease',
          pointerEvents: 'none'
        }}
      />
      
      <style>
        {`
          @keyframes loading-bar {
            0% { background-position: 100% 0; }
            100% { background-position: -100% 0; }
          }
          @keyframes slideUp {
            from { transform: translateY(100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}
      </style>

      {/* Network Error Toast / Banner */}
      {showError && (
        <div 
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#1e293b',
            color: '#f8fafc',
            padding: '12px 20px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
            zIndex: 99998,
            animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            minWidth: '320px',
            maxWidth: '90vw'
          }}
        >
          {isOffline ? (
            <WifiOff size={20} color="#fca5a5" />
          ) : (
            <AlertTriangle size={20} color="#fca5a5" />
          )}
          
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>
              {isOffline ? 'You are offline' : 'Error'}
            </h4>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#cbd5e1' }}>
              {isOffline ? 'Please check your internet connection.' : errorMsg}
            </p>
          </div>

          {!isOffline && (
            <button 
              onClick={() => setErrorMsg(null)}
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          )}
        </div>
      )}
    </>
  );
};
