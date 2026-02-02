
import React from 'react';

interface AdCardProps {
  title: string;
  description: string;
  ctaText: string;
  link: string;
  tag: string;
}

export const AdCard: React.FC<AdCardProps> = ({ title, description, ctaText, link, tag }) => {
  return (
    <div className="snap-item" style={{ background: 'linear-gradient(135deg, #2e1009 0%, #1a0b04 100%)' }}>
      {/* Subtle decorative elements to distinguish ads */}
      <div className="bg-blob" style={{ top: '20%', right: '-10%', width: '60%', height: '40%', backgroundColor: 'rgba(227, 38, 54, 0.1)' }}></div>
      <div className="bg-blob" style={{ bottom: '10%', left: '-10%', width: '50%', height: '30%', backgroundColor: 'rgba(255, 153, 51, 0.05)' }}></div>

      <div style={{ zIndex: 10, textAlign: 'center', width: '100%', maxWidth: '32rem', padding: '0 1rem' }}>
        <div style={{ 
          display: 'inline-block', 
          padding: '4px 12px', 
          background: 'var(--accent-kumkum)', 
          color: 'white', 
          borderRadius: '4px', 
          fontSize: '0.65rem', 
          fontWeight: 800, 
          letterSpacing: '2px',
          textTransform: 'uppercase',
          marginBottom: '2rem'
        }}>
          Sponsored
        </div>

        <h2 style={{ fontSize: '2.2rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-white)' }}>
          {title}
        </h2>

        <p style={{ fontSize: '1.1rem', color: 'var(--text-slate)', lineHeight: '1.6', marginBottom: '3rem' }}>
          {description}
        </p>

        <a 
          href={link} 
          target="_blank" 
          rel="noopener noreferrer"
          className="btn-primary"
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.8rem',
            textDecoration: 'none',
            fontSize: '1rem',
            padding: '1rem 3rem'
          }}
        >
          {ctaText}
          <svg style={{ width: '1.2rem', height: '1.2rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
        </a>

        <div style={{ marginTop: '2rem', opacity: 0.6, fontSize: '0.75rem', color: 'var(--accent-gold)', letterSpacing: '1px' }}>
          {tag}
        </div>
      </div>

      <div className="action-bar">
         <button className="action-btn" aria-label="Info" onClick={() => alert("This is a sponsored post that helps keep DharmaScroll free.")}>
          <svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
        </button>
      </div>
    </div>
  );
};
