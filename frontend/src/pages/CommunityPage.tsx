import React, { useState } from 'react';
import { MessageCircle, ThumbsUp, Users, Hash, TrendingUp, Plus, Clock, Search } from 'lucide-react';

// Mock Data for the Community Demo
const MOCK_TOPICS = [
  { id: 't1', name: 'General Discussion', icon: <Users size={16} />, count: 124 },
  { id: 't2', name: 'Q&A / Help', icon: <MessageCircle size={16} />, count: 89 },
  { id: 't3', name: 'Feature Requests', icon: <TrendingUp size={16} />, count: 45 },
  { id: 't4', name: 'Announcements', icon: <Hash size={16} />, count: 12 },
];

const MOCK_POSTS = [
  {
    id: 'p1',
    author: 'Rahul Sharma',
    avatar: 'RS',
    time: '2 hours ago',
    title: 'How can we improve water conservation in urban areas?',
    snippet: 'I noticed that many residential complexes do not have rainwater harvesting systems. Are there any government grants available for setting this up in existing buildings?',
    likes: 45,
    comments: 12,
    topic: 'Q&A / Help',
    tags: ['Water', 'Urban Development'],
    isPopular: true,
  },
  {
    id: 'p2',
    author: 'Dr. Anita Desai',
    avatar: 'AD',
    time: '5 hours ago',
    title: 'Proposal: Community-led Waste Management Drives',
    snippet: 'After seeing the success of the recent cleanliness drive, I believe we should institutionalize this as a monthly community activity. I have attached a brief plan.',
    likes: 128,
    comments: 34,
    topic: 'General Discussion',
    tags: ['Sanitation', 'Community'],
    isPopular: true,
  },
  {
    id: 'p3',
    author: 'Vikas Kumar',
    avatar: 'VK',
    time: '1 day ago',
    title: 'Issue with the new problem submission form',
    snippet: 'When I try to upload a photo from my phone camera, the page refreshes and loses all the text I typed. Is anyone else facing this?',
    likes: 15,
    comments: 8,
    topic: 'Feature Requests',
    tags: ['Bug Report', 'App'],
    isPopular: false,
  },
  {
    id: 'p4',
    author: 'Admin Team',
    avatar: 'AT',
    time: '2 days ago',
    title: 'Welcome to the Memento Community Hub!',
    snippet: 'This is the place to discuss civic issues, share ideas, and collaborate on solutions. Please read the community guidelines before posting.',
    likes: 256,
    comments: 42,
    topic: 'Announcements',
    tags: ['Official', 'Welcome'],
    isPopular: true,
  },
];

const TRENDING_TAGS = ['Water', 'Sanitation', 'Roads', 'Education', 'Smart City'];

export const CommunityPage: React.FC = () => {
  const [activeTopic, setActiveTopic] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 20px 60px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px', letterSpacing: '-0.5px' }}>Community Hub</h2>
          <p style={{ fontSize: '15px', color: '#64748b', margin: 0 }}>Join the conversation, share ideas, and collaborate on solutions.</p>
        </div>
        <button 
          className="btn btn-primary" 
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '14px', borderRadius: '8px' }}
        >
          <Plus size={18} /> New Discussion
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr 280px', gap: '32px', alignItems: 'start' }}>
        
        {/* Left Sidebar - Navigation */}
        <div style={{ position: 'sticky', top: '100px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <button
              onClick={() => setActiveTopic('All')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px',
                background: activeTopic === 'All' ? '#eff6ff' : 'transparent',
                color: activeTopic === 'All' ? '#2563eb' : '#475569',
                border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: activeTopic === 'All' ? 600 : 500,
                textAlign: 'left', transition: 'background 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <MessageCircle size={16} /> All Discussions
              </div>
            </button>
            
            <div style={{ height: '1px', background: '#e2e8f0', margin: '12px 0' }} />
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 14px 8px' }}>Topics</div>
            
            {MOCK_TOPICS.map(topic => (
              <button
                key={topic.id}
                onClick={() => setActiveTopic(topic.name)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px',
                  background: activeTopic === topic.name ? '#eff6ff' : 'transparent',
                  color: activeTopic === topic.name ? '#2563eb' : '#475569',
                  border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: activeTopic === topic.name ? 600 : 500,
                  textAlign: 'left', transition: 'background 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {topic.icon} {topic.name}
                </div>
                <span style={{ fontSize: '12px', background: activeTopic === topic.name ? '#dbeafe' : '#f1f5f9', padding: '2px 8px', borderRadius: '12px' }}>
                  {topic.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Search Bar inside Feed */}
          <div style={{ display: 'flex', alignItems: 'center', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 16px' }}>
            <Search size={18} color="#94a3b8" />
            <input 
              type="text" 
              placeholder="Search discussions..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', marginLeft: '12px', fontSize: '15px' }}
            />
          </div>

          {/* Posts List */}
          {MOCK_POSTS.map(post => (
            <div key={post.id} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', transition: 'box-shadow 0.2s', cursor: 'pointer' }} 
                 onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)'}
                 onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px' }}>
                    {post.avatar}
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{post.author}</div>
                    <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} /> {post.time} in <span style={{ color: '#2563eb', fontWeight: 500 }}>{post.topic}</span>
                    </div>
                  </div>
                </div>
                {post.isPopular && (
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#ea580c', background: '#ffedd5', padding: '4px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <TrendingUp size={12} /> POPULAR
                  </span>
                )}
              </div>

              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px', lineHeight: 1.4 }}>
                {post.title}
              </h3>
              <p style={{ fontSize: '15px', color: '#475569', lineHeight: 1.6, margin: '0 0 16px' }}>
                {post.snippet}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {post.tags.map(tag => (
                    <span key={tag} style={{ fontSize: '12px', color: '#64748b', background: '#f1f5f9', padding: '4px 10px', borderRadius: '16px' }}>
                      #{tag}
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '16px', color: '#64748b' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 500 }}>
                    <ThumbsUp size={16} /> {post.likes}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 500 }}>
                    <MessageCircle size={16} /> {post.comments}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'sticky', top: '100px' }}>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={16} color="#2563eb" /> Trending Tags
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {TRENDING_TAGS.map(tag => (
                <span key={tag} style={{ fontSize: '13px', color: '#334155', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: '20px', cursor: 'pointer' }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.color = '#2563eb'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#334155'; }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '20px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#1e3a8a', margin: '0 0 8px' }}>Become a Top Contributor</h4>
            <p style={{ fontSize: '13px', color: '#1e40af', margin: '0 0 16px', lineHeight: 1.5 }}>
              Engage in discussions, share helpful insights, and earn community badges!
            </p>
            <button style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', width: '100%' }}>
              Learn More
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
