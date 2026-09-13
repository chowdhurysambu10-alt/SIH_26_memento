import React, { useState } from 'react';
import WidgetBot from '@widgetbot/react-embed';
import { Joyride, Step } from 'react-joyride';
import { HelpCircle } from 'lucide-react';

const DISCORD_SERVER_ID = import.meta.env.VITE_DISCORD_SERVER_ID || '1546942698760437894';
const DISCORD_CHANNEL_MAIN = import.meta.env.VITE_DISCORD_CHANNEL_MAIN || '1546942699217879050';
const DISCORD_CHANNEL_2 = import.meta.env.VITE_DISCORD_CHANNEL_2 || '1547222346279026770';
const DISCORD_CHANNEL_3 = import.meta.env.VITE_DISCORD_CHANNEL_3 || '1547222485496234055';
const DISCORD_CHANNEL_RULES = import.meta.env.VITE_DISCORD_CHANNEL_RULES || '1546951489128366132';

export const CommunityPage: React.FC = () => {
  const [activeChannel, setActiveChannel] = useState(DISCORD_CHANNEL_MAIN);
  const [runTour, setRunTour] = useState(false);

  const steps: Step[] = [
    {
      target: '.tour-step-roles',
      content: 'Choose your role here to switch to the correct chat channel!',
    },
    {
      target: '.tour-step-rules',
      content: 'Make sure to read the community rules before participating.',
    },
    {
      target: '.tour-step-chat',
      content: 'This is the live chat! You can type your messages here and talk with other innovators.',
    },
    {
      target: '.tour-step-chat',
      content: 'You do not need to login! Simply type a guest name when prompted to start chatting.',
    },
    {
      target: '.tour-step-chat',
      content: 'If a CAPTCHA verification appears, just wait if you are not asked to complete the captcha, or mostly referred retry if it takes too long.',
    }
  ];

  return (
    <div style={{ maxWidth: '95%', margin: '0 auto', padding: '20px', height: 'calc(100vh - 80px)', boxSizing: 'border-box', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      
      {/* @ts-ignore */}
      <Joyride
        steps={steps}
        run={runTour}
        continuous
        showSkipButton
        showProgress
        styles={{
          // @ts-ignore
          options: {
            primaryColor: '#2563eb',
            zIndex: 10000,
          }
        }}
        callback={(data: any) => {
          const { status } = data;
          const finishedStatuses = ['finished', 'skipped'];
          if (finishedStatuses.includes(status)) {
            setRunTour(false);
          }
        }}
      />

      <div style={{ marginBottom: '16px', textAlign: 'center', flexShrink: 0, position: 'relative' }}>
        <button 
          onClick={() => setRunTour(true)}
          className="btn btn-outline"
          style={{ position: 'absolute', right: 0, top: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#2563eb', borderColor: '#bfdbfe', background: '#eff6ff', padding: '8px 16px' }}
        >
          <HelpCircle size={18} />
          Guide
        </button>

        <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
          MEMENTO CONNECT
        </h2>
        <p style={{ fontSize: '16px', color: '#64748b', margin: '0 0 16px' }}>
          Join the conversation, report issues, and collaborate with other innovators and citizens.
        </p>
        
        <div className="tour-step-roles" style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
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
            className={`tour-step-rules btn ${activeChannel === DISCORD_CHANNEL_RULES ? 'btn-primary' : 'btn-outline'}`}
          >
            Community Rules
          </button>
        </div>
      </div>
      
      <div className="tour-step-chat" style={{ flex: 1, minHeight: 0, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', background: '#fff' }}>
        <WidgetBot
          server={DISCORD_SERVER_ID}
          channel={activeChannel}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
};
