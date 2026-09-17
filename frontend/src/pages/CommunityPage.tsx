import React, { useState, useEffect } from 'react';
import WidgetBot from '@widgetbot/react-embed';
import { Joyride, Step } from 'react-joyride';
import { HelpCircle } from 'lucide-react';

const DISCORD_SERVER_ID = import.meta.env.VITE_DISCORD_SERVER_ID || '1546942698760437894';
const DISCORD_CHANNEL_MAIN = import.meta.env.VITE_DISCORD_CHANNEL_MAIN || '1546942699217879050';
const DISCORD_CHANNEL_2 = import.meta.env.VITE_DISCORD_CHANNEL_2 || '1547222346279026770';
const DISCORD_CHANNEL_3 = import.meta.env.VITE_DISCORD_CHANNEL_3 || '1547222485496234055';
const DISCORD_CHANNEL_RULES = import.meta.env.VITE_DISCORD_CHANNEL_RULES || '1546951489128366132';

export const CommunityPage: React.FC<{ platformSettings?: any }> = ({ platformSettings }) => {
  const [activeChannel, setActiveChannel] = useState(DISCORD_CHANNEL_MAIN);
  const [runTour, setRunTour] = useState(false);
  const [chatLoaded, setChatLoaded] = useState(false);

  useEffect(() => {
    setChatLoaded(false);
    // Defer loading the heavy Discord widget to prevent blocking the main thread and database network requests
    const timer = setTimeout(() => setChatLoaded(true), 1200);
    return () => clearTimeout(timer);
  }, [activeChannel]);

  if (platformSettings?.enableCommunityChat === false) {
    return (
      <div style={{ maxWidth: '95%', margin: '0 auto', padding: '100px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <HelpCircle size={64} color="#94a3b8" style={{ marginBottom: '24px' }} />
        <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: '0 0 16px' }}>
          Community Chat is Disabled
        </h2>
        <p style={{ fontSize: '16px', color: '#64748b', maxWidth: '500px' }}>
          The community chat has been temporarily disabled by the platform administrators. Please check back later.
        </p>
      </div>
    );
  }

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
    <div style={{ maxWidth: '95%', margin: '0 auto', padding: '20px 20px 80px 20px', minHeight: 'calc(100vh - 80px)', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>

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

      <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '16px', flexShrink: 0 }}>

        {/* Header & Guide Button row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px', textAlign: 'left' }}>
              MEMENTO CONNECT
            </h2>
            <p style={{ fontSize: '15px', color: '#64748b', margin: 0, textAlign: 'left', maxWidth: '600px' }}>
              Join the conversation, report issues, and collaborate with other innovators and citizens.
            </p>
          </div>
          <button
            onClick={() => setRunTour(true)}
            className="btn btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2563eb', borderColor: '#bfdbfe', background: '#eff6ff', padding: '8px 16px', whiteSpace: 'nowrap' }}
          >
            <HelpCircle size={18} />
            Guide
          </button>
        </div>

        {/* Role tabs */}
        <div className="tour-step-roles" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
          <button
            onClick={() => setActiveChannel(DISCORD_CHANNEL_MAIN)}
            className={`btn ${activeChannel === DISCORD_CHANNEL_MAIN ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '13px', padding: '8px 14px' }}
          >
            I'm a citizen
          </button>
          <button
            onClick={() => setActiveChannel(DISCORD_CHANNEL_2)}
            className={`btn ${activeChannel === DISCORD_CHANNEL_2 ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '13px', padding: '8px 14px' }}
          >
            I'm a student
          </button>
          <button
            onClick={() => setActiveChannel(DISCORD_CHANNEL_3)}
            className={`btn ${activeChannel === DISCORD_CHANNEL_3 ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '13px', padding: '8px 14px' }}
          >
            Institution
          </button>
          <button
            onClick={() => setActiveChannel(DISCORD_CHANNEL_RULES)}
            className={`tour-step-rules btn ${activeChannel === DISCORD_CHANNEL_RULES ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '13px', padding: '8px 14px' }}
          >
            Community Rules
          </button>
        </div>
      </div>

      <div className="tour-step-chat" style={{ flex: 1, minHeight: '80vh', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', background: '#fff', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          {!chatLoaded ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>
               <div className="animate-spin" style={{ marginRight: '10px', width: '24px', height: '24px', border: '3px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%' }}></div>
               Connecting to Community Server...
            </div>
          ) : (
            <WidgetBot
              server={DISCORD_SERVER_ID}
              channel={activeChannel}
              style={{ width: '100%', height: '100%' }}
            />
          )}
        </div>
      </div>
    </div>
  );
};
