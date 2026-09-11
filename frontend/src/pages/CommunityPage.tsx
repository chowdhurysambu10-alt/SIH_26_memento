import React, { useState } from 'react';
import WidgetBot from '@widgetbot/react-embed';

const DISCORD_SERVER_ID = import.meta.env.VITE_DISCORD_SERVER_ID || '1546942698760437894';
const DISCORD_CHANNEL_MAIN = import.meta.env.VITE_DISCORD_CHANNEL_MAIN || '1546942699217879050';
const DISCORD_CHANNEL_2 = import.meta.env.VITE_DISCORD_CHANNEL_2 || '1547222346279026770';
const DISCORD_CHANNEL_3 = import.meta.env.VITE_DISCORD_CHANNEL_3 || '1547222485496234055';
const DISCORD_CHANNEL_RULES = import.meta.env.VITE_DISCORD_CHANNEL_RULES || '1546951489128366132';

export const CommunityPage: React.FC = () => {
  const [activeChannel, setActiveChannel] = useState(DISCORD_CHANNEL_MAIN);

  return (
    <div style={{ maxWidth: '95%', margin: '0 auto', padding: '20px', height: 'calc(100vh - 80px)', boxSizing: 'border-box', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '16px', textAlign: 'center', flexShrink: 0 }}>
        <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
          MEMENTO CONNECT
        </h2>
        <p style={{ fontSize: '16px', color: '#64748b', margin: '0 0 16px' }}>
          Join the conversation, report issues, and collaborate with other innovators and citizens.
        </p>
        
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <button 
            onClick={() => setActiveChannel(DISCORD_CHANNEL_MAIN)}
            className={`btn ${activeChannel === DISCORD_CHANNEL_MAIN ? 'btn-primary' : 'btn-outline'}`}
          >
            I'm a citizen
          </button>
          <button 
            onClick={() => setActiveChannel(DISCORD_CHANNEL_2)}
            className={`btn ${activeChannel === DISCORD_CHANNEL_2 ? 'btn-primary' : 'btn-outline'}`}
          >
            I'm a student
          </button>
          <button 
            onClick={() => setActiveChannel(DISCORD_CHANNEL_3)}
            className={`btn ${activeChannel === DISCORD_CHANNEL_3 ? 'btn-primary' : 'btn-outline'}`}
          >
            connect as an institution
          </button>
          <button 
            onClick={() => setActiveChannel(DISCORD_CHANNEL_RULES)}
            className={`btn ${activeChannel === DISCORD_CHANNEL_RULES ? 'btn-primary' : 'btn-outline'}`}
          >
            Community Rules
          </button>
        </div>
      </div>
      
      <div style={{ flex: 1, minHeight: 0, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', background: '#fff' }}>
        <WidgetBot
          server={DISCORD_SERVER_ID}
          channel={activeChannel}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
};
