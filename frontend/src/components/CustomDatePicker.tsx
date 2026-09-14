import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface CustomDatePickerProps {
  value: string;
  onChange: (dateStr: string) => void;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Parse initial value or use current date
  const initialDate = value ? new Date(value) : new Date();
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth());
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    // Format to YYYY-MM-DD
    const mm = String(currentMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    onChange(`${currentYear}-${mm}-${dd}`);
    setIsOpen(false);
  };

  // Generate calendar grid
  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} style={{ padding: '8px' }}></div>);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const isSelected = value === `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    
    days.push(
      <button
        key={d}
        type="button"
        onClick={() => handleSelectDay(d)}
        style={{
          background: isSelected ? '#2563eb' : 'transparent',
          color: isSelected ? '#fff' : '#0f172a',
          border: 'none',
          borderRadius: '50%',
          width: '28px',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: isSelected ? 600 : 400,
          margin: 'auto',
          transition: 'all 0.2s'
        }}
        onMouseEnter={e => !isSelected && (e.currentTarget.style.background = '#f1f5f9')}
        onMouseLeave={e => !isSelected && (e.currentTarget.style.background = 'transparent')}
      >
        {d}
      </button>
    );
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: '8px',
          border: '1px solid #cbd5e1',
          fontSize: '14px',
          background: '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: value ? '#0f172a' : '#94a3b8'
        }}
      >
        <span>{value || 'Select Date (YYYY-MM-DD)'}</span>
        <Calendar size={18} color="#64748b" />
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '12px',
          width: '240px',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
          zIndex: 9999
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', gap: '4px' }}>
            <button type="button" onClick={handlePrevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', borderRadius: '4px' }}>
              <ChevronLeft size={18} color="#475569" />
            </button>
            <div style={{ display: 'flex', gap: '4px' }}>
              <select 
                value={currentMonth} 
                onChange={e => setCurrentMonth(Number(e.target.value))}
                style={{ fontSize: '13px', padding: '2px 4px', border: '1px solid #cbd5e1', borderRadius: '4px', background: '#fff', cursor: 'pointer', outline: 'none' }}
              >
                {monthNames.map((m, i) => <option key={m} value={i}>{m.slice(0,3)}</option>)}
              </select>
              <select 
                value={currentYear} 
                onChange={e => setCurrentYear(Number(e.target.value))}
                style={{ fontSize: '13px', padding: '2px 4px', border: '1px solid #cbd5e1', borderRadius: '4px', background: '#fff', cursor: 'pointer', outline: 'none', minWidth: '64px' }}
              >
                {Array.from({length: 100}, (_, i) => new Date().getFullYear() - i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <button type="button" onClick={handleNextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', borderRadius: '4px' }}>
              <ChevronRight size={18} color="#475569" />
            </button>
          </div>

          {/* Days of Week */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px', textAlign: 'center' }}>
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>{day}</div>
            ))}
          </div>

          {/* Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
            {days}
          </div>
        </div>
      )}
    </div>
  );
};
