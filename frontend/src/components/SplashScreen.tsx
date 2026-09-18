import React, { useEffect, useState } from 'react';

export const SplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Start fading out after 2.5 seconds (gives time for all entry animations to complete)
    const fadeTimer = setTimeout(() => setIsFading(true), 2500);
    
    // Unmount completely after 3 seconds (allowing 500ms for the fade-out transition)
    const unmountTimer = setTimeout(() => onComplete(), 3000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(unmountTimer);
    };
  }, [onComplete]);

  return (
    <div 
      className={`splash-screen ${isFading ? 'fade-out' : ''}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: '#ffffff',
        zIndex: 999999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'opacity 0.5s ease-out, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        opacity: isFading ? 0 : 1,
        transform: isFading ? 'scale(1.05)' : 'scale(1)',
        pointerEvents: isFading ? 'none' : 'all',
      }}
    >
      <div className="splash-logo-container">
        <h1 className="splash-title">
          <span>m</span><span>e</span><span>m</span><span>e</span><span>n</span><span>t</span><span>o</span><span className="accent-dot">.</span>
        </h1>
        <div className="splash-subtitle">&gt; system.init("real_solutions")</div>
      </div>
    </div>
  );
};
