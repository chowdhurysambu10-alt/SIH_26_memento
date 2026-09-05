import React from 'react';
import { Users } from 'lucide-react';

export const CommunityPage: React.FC = () => {
  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '60px 20px', textAlign: 'center' }}>
      <Users size={64} color="#94a3b8" style={{ marginBottom: '24px' }} />
      <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', margin: '0 0 16px' }}>
        Community Page Coming Soon
      </h2>
      <p style={{ fontSize: '18px', color: '#64748b' }}>
        We are building a space for you to discuss civic issues, share ideas, and collaborate on solutions. Stay tuned!
      </p>
    </div>
  );
};
