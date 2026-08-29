import React, { useState } from 'react';
import { DistrictAnalytics } from '../../types/analytics.types';
import { MapPin, Shield, Activity, Sparkles, Filter, ChevronRight } from 'lucide-react';

interface JharkhandMapProps {
  districtData: DistrictAnalytics[];
  onSelectDistrict?: (district: string | null) => void;
  selectedDistrict?: string | null;
}

// 24 Districts with grid-based interactive geographic coordinate layout
const DISTRICT_GRID_MAP: Array<{ id: string; name: string; x: number; y: number; w: number; h: number; zone: string }> = [
  // North-West
  { id: 'Garhwa', name: 'Garhwa', x: 20, y: 30, w: 75, h: 55, zone: 'Palamu Division' },
  { id: 'Palamu', name: 'Palamu', x: 105, y: 40, w: 80, h: 60, zone: 'Palamu Division' },
  { id: 'Chatra', name: 'Chatra', x: 195, y: 35, w: 75, h: 55, zone: 'North Chotanagpur' },
  { id: 'Hazaribagh', name: 'Hazaribagh', x: 280, y: 45, w: 85, h: 60, zone: 'North Chotanagpur' },
  { id: 'Koderma', name: 'Koderma', x: 300, y: 15, w: 70, h: 40, zone: 'North Chotanagpur' },
  { id: 'Giridih', name: 'Giridih', x: 375, y: 40, w: 85, h: 55, zone: 'North Chotanagpur' },

  // Santhal Pargana (North-East)
  { id: 'Deoghar', name: 'Deoghar', x: 470, y: 45, w: 75, h: 50, zone: 'Santhal Pargana' },
  { id: 'Dumka', name: 'Dumka', x: 555, y: 50, w: 80, h: 60, zone: 'Santhal Pargana' },
  { id: 'Godda', name: 'Godda', x: 570, y: 15, w: 70, h: 45, zone: 'Santhal Pargana' },
  { id: 'Sahibganj', name: 'Sahibganj', x: 650, y: 20, w: 80, h: 45, zone: 'Santhal Pargana' },
  { id: 'Pakur', name: 'Pakur', x: 645, y: 75, w: 75, h: 45, zone: 'Santhal Pargana' },
  { id: 'Jamtara', name: 'Jamtara', x: 495, y: 105, w: 70, h: 45, zone: 'Santhal Pargana' },

  // Central Mining & Industrial Belt
  { id: 'Latehar', name: 'Latehar', x: 120, y: 110, w: 75, h: 65, zone: 'Palamu Division' },
  { id: 'Lohardaga', name: 'Lohardaga', x: 170, y: 185, w: 65, h: 45, zone: 'South Chotanagpur' },
  { id: 'Bokaro', name: 'Bokaro', x: 380, y: 105, w: 75, h: 50, zone: 'North Chotanagpur' },
  { id: 'Dhanbad', name: 'Dhanbad', x: 465, y: 155, w: 75, h: 50, zone: 'North Chotanagpur' },
  { id: 'Ramgarh', name: 'Ramgarh', x: 295, y: 115, w: 70, h: 45, zone: 'North Chotanagpur' },
  { id: 'Ranchi', name: 'Ranchi (Capital)', x: 245, y: 170, w: 90, h: 70, zone: 'South Chotanagpur' },

  // South-West & South
  { id: 'Gumla', name: 'Gumla', x: 110, y: 235, w: 85, h: 65, zone: 'South Chotanagpur' },
  { id: 'Simdega', name: 'Simdega', x: 125, y: 310, w: 90, h: 60, zone: 'South Chotanagpur' },
  { id: 'Khunti', name: 'Khunti', x: 240, y: 250, w: 75, h: 55, zone: 'South Chotanagpur' },

  // Kolhan Division (South-East)
  { id: 'West Singhbhum', name: 'West Singhbhum', x: 235, y: 315, w: 110, h: 80, zone: 'Kolhan Division' },
  { id: 'Saraikela Kharsawan', name: 'Saraikela', x: 355, y: 255, w: 85, h: 55, zone: 'Kolhan Division' },
  { id: 'East Singhbhum', name: 'East Singhbhum (JSR)', x: 450, y: 260, w: 95, h: 65, zone: 'Kolhan Division' },
];

export const JharkhandMap: React.FC<JharkhandMapProps> = ({
  districtData,
  onSelectDistrict,
  selectedDistrict,
}) => {
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);

  const getDistrictStats = (name: string) => {
    const clean = name.replace(' (Capital)', '').replace(' (JSR)', '');
    return districtData.find((d) => d.district.toLowerCase() === clean.toLowerCase()) || {
      district: clean,
      total_challenges: 5,
      resolved_challenges: 1,
      in_progress_challenges: 2,
      high_priority_count: 2,
      active_universities: 1,
    };
  };

  const getFillColor = (name: string) => {
    const clean = name.replace(' (Capital)', '').replace(' (JSR)', '');
    const isSelected = selectedDistrict?.toLowerCase() === clean.toLowerCase();
    if (isSelected) return 'rgba(16, 185, 129, 0.9)';

    const isHovered = hoveredDistrict === name;
    if (isHovered) return 'rgba(59, 130, 246, 0.85)';

    const stats = getDistrictStats(name);
    if (stats.total_challenges > 14) return 'rgba(244, 63, 94, 0.45)';
    if (stats.total_challenges > 8) return 'rgba(245, 158, 11, 0.4)';
    return 'rgba(16, 185, 129, 0.3)';
  };

  const activeHoverStats = hoveredDistrict ? getDistrictStats(hoveredDistrict) : (selectedDistrict ? getDistrictStats(selectedDistrict) : null);

  return (
    <div className="glass-panel" style={{ padding: '1.75rem', position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} className="animate-pulse-subtle" />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Jharkhand 24-District Interactive GIS Heatmap</h3>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Realtime AI crowdsource density, priority clusters, and university resolution tracking across state jurisdictions
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'rgba(16, 185, 129, 0.6)' }} />
            <span>Low (1-8)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'rgba(245, 158, 11, 0.7)' }} />
            <span>Moderate (9-14)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'rgba(244, 63, 94, 0.8)' }} />
            <span>High Severity (&gt;14)</span>
          </div>
          {selectedDistrict && (
            <button
              onClick={() => onSelectDistrict && onSelectDistrict(null)}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: '0.75rem', color: 'var(--emerald-500)' }}
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem', alignItems: 'center' }}>
        {/* SVG GIS Map Canvas */}
        <div
          style={{
            background: 'radial-gradient(circle, rgba(15, 23, 42, 0.8) 0%, rgba(9, 13, 22, 0.95) 100%)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '420px',
            position: 'relative',
          }}
        >
          <svg viewBox="0 0 760 410" style={{ width: '100%', height: 'auto', maxHeight: '400px' }}>
            {/* Background grid lines */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="760" height="410" fill="url(#grid)" />

            {/* Districts polygons/nodes */}
            {DISTRICT_GRID_MAP.map((d) => {
              const stats = getDistrictStats(d.name);
              const clean = d.name.replace(' (Capital)', '').replace(' (JSR)', '');
              const isSelected = selectedDistrict?.toLowerCase() === clean.toLowerCase();

              return (
                <g
                  key={d.id}
                  onClick={() => onSelectDistrict && onSelectDistrict(clean)}
                  onMouseEnter={() => setHoveredDistrict(d.name)}
                  onMouseLeave={() => setHoveredDistrict(null)}
                  style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  <rect
                    x={d.x}
                    y={d.y}
                    width={d.w}
                    height={d.h}
                    rx="8"
                    fill={getFillColor(d.name)}
                    stroke={isSelected ? '#10b981' : 'rgba(255, 255, 255, 0.2)'}
                    strokeWidth={isSelected ? '2.5' : '1'}
                    style={{ transition: 'all 0.25s' }}
                  />
                  <text
                    x={d.x + d.w / 2}
                    y={d.y + d.h / 2 - 4}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="10"
                    fontWeight="700"
                    fontFamily="var(--font-display)"
                    pointerEvents="none"
                  >
                    {d.name.length > 11 ? `${d.name.slice(0, 10)}..` : d.name}
                  </text>
                  <text
                    x={d.x + d.w / 2}
                    y={d.y + d.h / 2 + 10}
                    textAnchor="middle"
                    fill={stats.total_challenges > 14 ? '#fca5a5' : '#a7f3d0'}
                    fontSize="8.5"
                    fontFamily="var(--font-mono)"
                    fontWeight="600"
                    pointerEvents="none"
                  >
                    {stats.total_challenges} Issues
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected / Hovered District Detail Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%', justifyContent: 'center' }}>
          {activeHoverStats ? (
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem', color: '#10b981' }}>
                <MapPin size={16} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  District Intelligence
                </span>
              </div>
              <h4 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                {activeHoverStats.district}
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginBottom: '1rem' }}>
                <div style={{ background: 'var(--bg-glass)', padding: '0.6rem', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Total Problems</span>
                  <strong style={{ fontSize: '1.2rem', color: '#ffffff' }}>{activeHoverStats.total_challenges}</strong>
                </div>
                <div style={{ background: 'var(--bg-glass)', padding: '0.6rem', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>High Severity</span>
                  <strong style={{ fontSize: '1.2rem', color: '#f43f5e' }}>{activeHoverStats.high_priority_count}</strong>
                </div>
                <div style={{ background: 'var(--bg-glass)', padding: '0.6rem', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>In Resolution</span>
                  <strong style={{ fontSize: '1.2rem', color: '#38bdf8' }}>{activeHoverStats.in_progress_challenges}</strong>
                </div>
                <div style={{ background: 'var(--bg-glass)', padding: '0.6rem', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Validated Solved</span>
                  <strong style={{ fontSize: '1.2rem', color: '#4ade80' }}>{activeHoverStats.resolved_challenges}</strong>
                </div>
              </div>

              <button
                onClick={() => onSelectDistrict && onSelectDistrict(activeHoverStats.district)}
                className="btn btn-primary btn-sm"
                style={{ width: '100%', gap: '0.4rem' }}
              >
                <span>Filter Feed by {activeHoverStats.district}</span>
                <ChevronRight size={14} />
              </button>
            </div>
          ) : (
            <div
              style={{
                background: 'var(--bg-glass)',
                border: '1px dashed var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '2rem 1.5rem',
                textAlign: 'center',
                color: 'var(--text-muted)',
              }}
            >
              <Activity size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.5, color: '#10b981' }} />
              <h5 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                Explore 24 Districts
              </h5>
              <p style={{ fontSize: '0.8rem', lineHeight: 1.4 }}>
                Hover or click any district node on the map to inspect local challenges and solutions.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
