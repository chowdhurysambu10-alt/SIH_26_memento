import React, { useState } from 'react';
import WidgetBot from '@widgetbot/react-embed';
import { MessageSquare, Users, GraduationCap, Building2, BookOpen } from 'lucide-react';

const DISCORD_SERVER_ID = import.meta.env.VITE_DISCORD_SERVER_ID || '1546942698760437894';
const DISCORD_CHANNEL_MAIN = import.meta.env.VITE_DISCORD_CHANNEL_MAIN || '1546942699217879050';
const DISCORD_CHANNEL_2 = import.meta.env.VITE_DISCORD_CHANNEL_2 || '1547222346279026770';
const DISCORD_CHANNEL_3 = import.meta.env.VITE_DISCORD_CHANNEL_3 || '1547222485496234055';
const DISCORD_CHANNEL_RULES = import.meta.env.VITE_DISCORD_CHANNEL_RULES || '1546951489128366132';

export const CommunityPage: React.FC = () => {
  const [activeChannel, setActiveChannel] = useState(DISCORD_CHANNEL_MAIN);

  return (
    <div className="community-page-wrapper">
      <div className="community-header-panel">
        <div className="community-badge-pill">
          <MessageSquare size={14} color="#2563eb" /> Live Community Connect
        </div>
        <h2 className="community-main-title">Memento Connect</h2>
        <p className="community-subtitle">
          Collaborate in real-time with innovators, students, faculty, and citizens across Jharkhand.
        </p>

        <div className="community-channels-switch">
          <button
            type="button"
            onClick={() => setActiveChannel(DISCORD_CHANNEL_MAIN)}
            className={`community-channel-btn ${
              activeChannel === DISCORD_CHANNEL_MAIN ? 'active' : ''
            }`}
          >
            <Users size={14} /> Citizen Hub
          </button>
          <button
            type="button"
            onClick={() => setActiveChannel(DISCORD_CHANNEL_2)}
            className={`community-channel-btn ${activeChannel === DISCORD_CHANNEL_2 ? 'active' : ''}`}
          >
            <GraduationCap size={14} /> Student Forum
          </button>
          <button
            type="button"
            onClick={() => setActiveChannel(DISCORD_CHANNEL_3)}
            className={`community-channel-btn ${activeChannel === DISCORD_CHANNEL_3 ? 'active' : ''}`}
          >
            <Building2 size={14} /> Institution Desk
          </button>
          <button
            type="button"
            onClick={() => setActiveChannel(DISCORD_CHANNEL_RULES)}
            className={`community-channel-btn ${
              activeChannel === DISCORD_CHANNEL_RULES ? 'active' : ''
            }`}
          >
            <BookOpen size={14} /> Guidelines
          </button>
        </div>
      </div>

      <div className="community-embed-container">
        <WidgetBot
          server={DISCORD_SERVER_ID}
          channel={activeChannel}
          style={{ width: '100%', height: '100%', border: 'none' }}
        />
      </div>
    </div>
  );
};
