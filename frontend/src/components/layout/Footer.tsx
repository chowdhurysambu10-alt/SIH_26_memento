import React from 'react';
import { Sparkles, Shield, MapPin, Heart, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer
      style={{
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-subtle)',
        padding: '3.5rem 0 2rem',
        marginTop: 'auto',
      }}
    >
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2.5rem', marginBottom: '2.5rem' }}>
          {/* Col 1 */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(135deg, #10b981, #3b82f6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sparkles size={18} color="#ffffff" />
              </div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Jharkhand Societal Innovation</h4>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '1.2rem' }}>
              Statewide collaborative ecosystem connecting grassroots citizens, local governance (PRI/ULB), top universities, and CSR industry leaders powered by Google AI Studio Gemma triage.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--emerald-500)' }}>
              <Shield size={14} /> Smart India Hackathon (SIH) 2026 Solution
            </div>
          </div>

          {/* Col 2 */}
          <div>
            <h5 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>
              10 Core Domains
            </h5>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <li>• Water & Arsenic Filtration</li>
              <li>• Rural Livelihoods & Lac Cultivation</li>
              <li>• Mining Reclamation & Environment</li>
              <li>• Tribal Healthcare & Telemedicine</li>
              <li>• Solar Clean Mini-Grids</li>
              <li>• Agriculture & Millet Mission</li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h5 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>
              Key Academic Partners
            </h5>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <li>• BIT Sindri, Dhanbad</li>
              <li>• Birsa Agricultural University, Ranchi</li>
              <li>• NIT Jamshedpur</li>
              <li>• RIMS Medical Institute, Ranchi</li>
              <li>• Tata Steel CSR & CCL Innovation</li>
            </ul>
          </div>

          {/* Col 4 */}
          <div>
            <h5 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>
              24 Districts Network
            </h5>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.8rem' }}>
              Active AI crowdsourcing across Ranchi, Dhanbad, Dumka, Khunti, Palamu, East Singhbhum and all 24 districts.
            </p>
            <div className="glass-pill" style={{ fontSize: '0.78rem' }}>
              <MapPin size={12} color="#10b981" /> 100% Real-time Coverage
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            fontSize: '0.82rem',
            color: 'var(--text-muted)',
          }}
        >
          <div>
            © 2026 Government of Jharkhand & SIH Team Memento. Free Tier Optimized Architecture.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span>Privacy Policy</span>
            <span>API Docs (/api/docs)</span>
            <span>Panchayat Support</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
