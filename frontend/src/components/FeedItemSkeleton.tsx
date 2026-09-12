import React from 'react';

export const FeedItemSkeleton: React.FC = () => {
  return (
    <div className="feed-item" style={{ animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite', pointerEvents: 'none' }}>
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: .5; }
          }
          .skel-box {
            background-color: #e2e8f0;
            border-radius: 4px;
          }
        `}
      </style>
      
      {/* Top Meta Tags */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <div className="skel-box" style={{ height: '22px', width: '80px', borderRadius: '20px' }}></div>
        <div className="skel-box" style={{ height: '22px', width: '120px', borderRadius: '20px' }}></div>
        <div className="skel-box" style={{ height: '22px', width: '100px', borderRadius: '20px', marginLeft: 'auto' }}></div>
      </div>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        {/* Left Side: Title & Description */}
        <div style={{ flex: '1 1 280px' }}>
          <div className="skel-box" style={{ height: '24px', width: '70%', marginBottom: '12px' }}></div>
          <div className="skel-box" style={{ height: '16px', width: '100%', marginBottom: '8px' }}></div>
          <div className="skel-box" style={{ height: '16px', width: '90%', marginBottom: '8px' }}></div>
          <div className="skel-box" style={{ height: '16px', width: '40%' }}></div>
        </div>

        {/* Right Side: Media Box */}
        <div className="skel-box" style={{ flexShrink: 0, width: '200px', height: '135px', borderRadius: '10px' }}></div>
      </div>

      {/* Bottom Interaction Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
        <div className="skel-box" style={{ height: '36px', width: '120px', borderRadius: '8px' }}></div>
      </div>
    </div>
  );
};
