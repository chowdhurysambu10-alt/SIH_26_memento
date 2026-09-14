import React, { useState, useEffect } from 'react';
import { MonitorSmartphone, X } from 'lucide-react';

export const DesktopModeWarning: React.FC = () => {
  const [isDesktopMode, setIsDesktopMode] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user has dismissed this warning in the past
    if (localStorage.getItem('memento_desktop_warning_dismissed')) {
      setDismissed(true);
      return;
    }

    const checkDesktopMode = () => {
      // Heuristic for detecting "Desktop Site" on a mobile device:
      // 1. Device has touch capabilities
      // 2. The virtual viewport (innerWidth) is significantly larger than the physical screen width (screen.width)
      //    (When "Desktop Site" is enabled on mobile, browsers typically render a ~980px viewport and scale it down to fit the physical screen)
      // 3. The physical screen width is characteristic of a mobile device (< 768px)
      const hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
      
      // We use a small threshold (e.g. 50px) because sometimes borders/scrollbars cause minor differences
      const isViewportScaled = window.innerWidth > (window.screen.width + 50);
      const isMobileScreen = window.screen.width < 768 || window.screen.height < 768;

      if (hasTouch && isViewportScaled && isMobileScreen) {
        setIsDesktopMode(true);
      } else {
        setIsDesktopMode(false);
      }
    };

    checkDesktopMode();
    window.addEventListener('resize', checkDesktopMode);
    return () => window.removeEventListener('resize', checkDesktopMode);
  }, []);

  if (!isDesktopMode || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('memento_desktop_warning_dismissed', 'true');
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      background: '#ef4444',
      color: '#fff',
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      zIndex: 9999,
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <MonitorSmartphone size={24} />
        <div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: '14px' }}>Optimal Experience</p>
          <p style={{ margin: 0, fontSize: '13px', opacity: 0.9 }}>
            If you are using "Desktop Site" mode in your browser, please disable it for the best experience.
          </p>
        </div>
      </div>
      <button 
        onClick={handleDismiss}
        style={{ 
          background: 'rgba(255,255,255,0.2)', 
          border: 'none', 
          color: '#fff', 
          cursor: 'pointer', 
          padding: '6px', 
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <X size={18} />
      </button>
    </div>
  );
};
