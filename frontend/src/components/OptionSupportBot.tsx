import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Bot, ChevronRight, CornerDownLeft } from 'lucide-react';
import { supportDecisionTree, DecisionNode } from '../data/supportDecisionTree';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  options?: { label: string; nextId: string }[];
}

export const OptionSupportBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: supportDecisionTree.root.message,
      options: supportDecisionTree.root.options 
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleOptionClick = (optionLabel: string, nextId: string) => {
    // 1. Add User's selection as a message
    const userMessage: Message = { role: 'user', content: optionLabel };
    
    // 2. Find the next node in the tree
    const nextNode = supportDecisionTree[nextId];
    
    if (nextNode) {
      // 3. Add the bot's response
      const botMessage: Message = {
        role: 'assistant',
        content: nextNode.message,
        options: nextNode.options
      };
      setMessages((prev) => [...prev, userMessage, botMessage]);
    } else {
      // Fallback if node not found
      const botMessage: Message = {
        role: 'assistant',
        content: "Sorry, I couldn't find information on that. Let's start over.",
        options: [{ label: 'Go Back to Main Menu', nextId: 'root' }]
      };
      setMessages((prev) => [...prev, userMessage, botMessage]);
    }
  };

  const handleReset = () => {
    setMessages([
      { 
        role: 'assistant', 
        content: supportDecisionTree.root.message,
        options: supportDecisionTree.root.options 
      }
    ]);
  };

  return (
    <>
      <style>
        {`
          .support-bot-fab {
            position: fixed;
            bottom: 24px;
            right: 24px;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background-color: #2563eb;
            color: #ffffff;
            border: none;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 9999;
            transition: transform 0.2s;
          }
          .support-bot-fab:hover {
            transform: scale(1.05);
          }
          .support-bot-window {
            position: fixed;
            bottom: 24px;
            right: 24px;
            width: 380px;
            height: 600px;
            background-color: #ffffff;
            border-radius: 16px;
            box-shadow: 0 12px 40px rgba(0,0,0,0.2);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            z-index: 10000;
            border: 1px solid #e2e8f0;
            font-family: Inter, system-ui, sans-serif;
          }
          @media (max-width: 768px) {
            .support-bot-fab {
              bottom: 80px;
              right: 16px;
              width: 46px;
              height: 46px;
            }
            .support-bot-window {
              bottom: 80px;
              right: 16px;
              left: 16px;
              width: auto;
              height: 50vh;
              max-height: 400px;
            }
          }
        `}
      </style>
      {/* Floating Action Button */}
      <button
        className="support-bot-fab"
        onClick={() => setIsOpen(true)}
        style={{ display: isOpen ? 'none' : 'flex' }}
        title="Get Support"
      >
        <MessageSquare size={24} />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="support-bot-window">
          {/* Header */}
          <div
            style={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bot size={22} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 600, fontSize: '15px' }}>Memento Support Team</span>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Always here to help</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleReset}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                }}
                title="Start Over"
                onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
              >
                <CornerDownLeft size={18} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div
            style={{
              flex: 1,
              padding: '20px 16px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              backgroundColor: '#f8fafc',
            }}
          >
            {messages.map((msg, index) => (
              <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                {/* Chat Bubble */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                    alignItems: 'flex-start',
                    gap: '12px',
                  }}
                >
                  {msg.role === 'assistant' && (
                    <div
                      style={{
                        backgroundColor: '#e2e8f0',
                        color: '#0f172a',
                        padding: '8px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '32px',
                        height: '32px',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                      }}
                    >
                      <Bot size={16} />
                    </div>
                  )}

                  <div
                    style={{
                      backgroundColor: msg.role === 'user' ? '#2563eb' : '#ffffff',
                      color: msg.role === 'user' ? '#ffffff' : '#334155',
                      padding: '14px 18px',
                      borderRadius: '16px',
                      borderTopRightRadius: msg.role === 'user' ? '4px' : '16px',
                      borderTopLeftRadius: msg.role === 'assistant' ? '4px' : '16px',
                      maxWidth: '85%',
                      fontSize: '14px',
                      lineHeight: '1.5',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      border: msg.role === 'assistant' ? '1px solid #e2e8f0' : 'none',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {msg.content}
                  </div>
                </div>

                {/* Interactive Options (Only show for the LAST message if it's from assistant) */}
                {msg.role === 'assistant' && msg.options && index === messages.length - 1 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '44px', marginTop: '4px' }}>
                    {msg.options.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => handleOptionClick(opt.label, opt.nextId)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          backgroundColor: '#ffffff',
                          border: '1px solid #cbd5e1',
                          borderRadius: '12px',
                          padding: '12px 16px',
                          color: '#2563eb',
                          fontWeight: 500,
                          fontSize: '13px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.2s',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#2563eb';
                          e.currentTarget.style.backgroundColor = '#eff6ff';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#cbd5e1';
                          e.currentTarget.style.backgroundColor = '#ffffff';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        {opt.label}
                        <ChevronRight size={16} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Branding */}
          <div
            style={{
              padding: '12px',
              borderTop: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontSize: '11px',
              color: '#94a3b8',
              fontWeight: 500,
            }}
          >
            Powered by Memento Support
          </div>
        </div>
      )}
    </>
  );
};
