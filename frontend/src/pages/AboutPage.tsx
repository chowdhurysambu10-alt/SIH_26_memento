import React from 'react';
import { Shield, BrainCircuit, Users, Building, FileBarChart, CheckCircle, Network, Leaf, ArrowRight } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: '80px', fontFamily: '"Inter", sans-serif' }}>
      
      {/* Hero Section */}
      <div style={{ 
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', 
        padding: '80px 20px', 
        textAlign: 'center',
        color: 'white',
        borderBottom: '4px solid #3b82f6'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ display: 'inline-block', background: 'rgba(59, 130, 246, 0.2)', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, color: '#60a5fa', marginBottom: '20px' }}>
            MEMENTO
          </div>
          <h1 style={{ fontSize: '42px', fontWeight: 800, marginBottom: '24px', letterSpacing: '-1px', lineHeight: 1.2 }}>
            Transforming Community Challenges into <span style={{ color: '#60a5fa' }}>Deployable Innovations</span>
          </h1>
          <p style={{ fontSize: '18px', color: '#cbd5e1', lineHeight: 1.6, maxWidth: '700px', margin: '0 auto' }}>
            Memento is a technology-enabled platform designed for the State of Jharkhand to bridge the gap between citizen-reported issues, academic research, and industry implementation.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '-40px auto 0', padding: '0 20px', position: 'relative', zIndex: 10 }}>
        
        {/* Core Problem & Vision */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '40px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', marginBottom: '40px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Shield color="#ef4444" size={24} /> The Problem
              </h2>
              <p style={{ color: '#475569', lineHeight: 1.7, fontSize: '15px' }}>
                Every year, citizens identify thousands of local issues in sectors like healthcare, agriculture, and sanitation. However, due to a fragmented ecosystem, these problems rarely reach the Higher Education Institutions (HEIs) and Industries that possess the academic expertise, financial resources, and technical implementation capabilities to solve them.
              </p>
            </div>
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Leaf color="#10b981" size={24} /> Our Vision (NEP 2020)
              </h2>
              <p style={{ color: '#475569', lineHeight: 1.7, fontSize: '15px' }}>
                Aligning with the National Education Policy (NEP) 2020, Memento fosters experiential learning and multidisciplinary research. We connect real-world societal challenges with students and researchers, ensuring demand-driven innovation that creates measurable social impact.
              </p>
            </div>
          </div>
        </div>

        {/* How We Implemented The Solution */}
        <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', textAlign: 'center', margin: '60px 0 40px' }}>
          How Memento Solves This
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          
          {/* Module 1 */}
          <div style={{ background: 'white', padding: '32px', borderRadius: '16px', border: '1px solid #e2e8f0', transition: 'transform 0.2s', cursor: 'default' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ width: '48px', height: '48px', background: '#eff6ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <Users color="#3b82f6" size={24} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', marginBottom: '12px' }}>Citizen Engagement Module</h3>
            <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.6 }}>
              Citizens and local bodies submit challenges via our intuitive interface. Submissions support multimedia evidence, geolocation, and categorized tagging to ensure every problem is captured accurately at the grassroots level.
            </p>
          </div>

          {/* Module 2 */}
          <div style={{ background: 'white', padding: '32px', borderRadius: '16px', border: '1px solid #e2e8f0', transition: 'transform 0.2s', cursor: 'default' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ width: '48px', height: '48px', background: '#fdf4ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <BrainCircuit color="#d946ef" size={24} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', marginBottom: '12px' }}>AI-Enabled Management</h3>
            <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.6 }}>
              Powered by Google Gemma 2 AI, Memento automatically categorizes, prioritizes, deduplicates, and routes validated challenges directly to the most appropriate university departments based on subject expertise.
            </p>
          </div>

          {/* Module 3 */}
          <div style={{ background: 'white', padding: '32px', borderRadius: '16px', border: '1px solid #e2e8f0', transition: 'transform 0.2s', cursor: 'default' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ width: '48px', height: '48px', background: '#f0fdf4', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <Building color="#16a34a" size={24} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', marginBottom: '12px' }}>University Collaboration</h3>
            <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.6 }}>
              Higher Education Institutions claim assigned challenges via dedicated portals. They form multidisciplinary student-faculty teams, assign mentors, and develop concrete, actionable solution proposals.
            </p>
          </div>

          {/* Module 4 */}
          <div style={{ background: 'white', padding: '32px', borderRadius: '16px', border: '1px solid #e2e8f0', transition: 'transform 0.2s', cursor: 'default' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ width: '48px', height: '48px', background: '#fffbeb', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <Network color="#d97706" size={24} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', marginBottom: '12px' }}>Industry & MSME Partnerships</h3>
            <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.6 }}>
              A dedicated ecosystem that brings in industries, startups, and CSR organizations to provide funding, prototyping, pilot implementation, and crucial mentorship to university teams.
            </p>
          </div>

          {/* Module 5 */}
          <div style={{ background: 'white', padding: '32px', borderRadius: '16px', border: '1px solid #e2e8f0', transition: 'transform 0.2s', cursor: 'default' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ width: '48px', height: '48px', background: '#f1f5f9', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <CheckCircle color="#475569" size={24} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', marginBottom: '12px' }}>Lifecycle Management</h3>
            <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.6 }}>
              Rigorous tracking of a problem from submission to resolution. Monitoring milestones, deliverables, implementation status, and intellectual property generation—all in real time.
            </p>
          </div>

          {/* Module 6 */}
          <div style={{ background: 'white', padding: '32px', borderRadius: '16px', border: '1px solid #e2e8f0', transition: 'transform 0.2s', cursor: 'default' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ width: '48px', height: '48px', background: '#fef2f2', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <FileBarChart color="#ef4444" size={24} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', marginBottom: '12px' }}>Visual Analytics Dashboard</h3>
            <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.6 }}>
              Government bodies possess a bird's-eye view of thematic trends, district-wise challenge maps, completion rates, and community impact through real-time statistical dashboards.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
