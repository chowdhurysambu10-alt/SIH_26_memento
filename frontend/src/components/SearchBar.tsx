import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      onSearch(searchTerm.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm, onSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm.trim());
  };

  return (
    <div style={{ width: '100%', maxWidth: '950px', margin: '12px auto 0', padding: '0 8px' }}>
      <form 
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          alignItems: 'center',
          background: '#ffffff',
          border: `1.5px solid ${isFocused ? '#3b82f6' : '#e2e8f0'}`,
          borderRadius: '9999px',
          padding: '4px 6px 4px 16px',
          boxShadow: isFocused ? '0 4px 12px rgba(59, 130, 246, 0.15)' : '0 2px 6px rgba(0, 0, 0, 0.04)',
          transition: 'all 0.2s ease',
          gap: '8px'
        }}
      >
        <Search size={20} color={isFocused ? '#3b82f6' : '#94a3b8'} style={{ flexShrink: 0 }} />
        
        <input
          type="text"
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            fontSize: '15.5px',
            color: '#1e293b',
            background: 'transparent',
            padding: '10px 0',
            width: '100%',
            minWidth: 0,
            textOverflow: 'ellipsis',
            boxShadow: 'none'
          }}
          placeholder="Search challenges, solutions, or tags..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        
        <button 
          type="submit" 
          style={{
            background: '#2563eb',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '9999px',
            fontSize: '14.5px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.2s ease',
            flexShrink: 0
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#1d4ed8'}
          onMouseLeave={e => e.currentTarget.style.background = '#2563eb'}
        >
          Search
        </button>
      </form>
    </div>
  );
};

