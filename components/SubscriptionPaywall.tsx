
import React from 'react';

interface SubscriptionPaywallProps {
  onSubscribe: (plan: 'monthly' | 'annual') => void;
}

export const SubscriptionPaywall: React.FC<SubscriptionPaywallProps> = ({ onSubscribe }) => {
  return (
    <div className="fullscreen-center" style={{ 
      background: 'linear-gradient(to bottom, #1a0b04, #2d1409)', 
      zIndex: 1000,
      position: 'fixed',
      top: 0,
      left: 0,
      padding: 'env(safe-area-inset-top) 1.5rem env(safe-area-inset-bottom) 1.5rem'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 204, 51, 0.2)',
        borderRadius: '32px',
        padding: '3rem 2rem',
        width: '100%',
        maxWidth: '400px',
        textAlign: 'center',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>ॐ</div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-gold)', marginBottom: '0.5rem', letterSpacing: '1px' }}>
          SACRED ACCESS
        </h2>
        <p style={{ color: 'var(--text-slate)', fontSize: '0.95rem', marginBottom: '2.5rem', lineHeight: '1.5' }}>
          Your free scrolls have concluded. Unlock the complete wisdom of the ancient scriptures.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
          {/* Annual Plan (Featured) */}
          <button 
            onClick={() => onSubscribe('annual')}
            style={{
              background: 'linear-gradient(90deg, #ffcc33 0%, #ff9933 100%)',
              border: 'none',
              borderRadius: '16px',
              padding: '1.25rem',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 10px 20px rgba(255, 153, 51, 0.2)'
            }}
          >
            <div style={{ position: 'absolute', top: 0, right: 0, background: 'var(--accent-kumkum)', color: 'white', fontSize: '0.6rem', fontWeight: 900, padding: '4px 12px', borderRadius: '0 0 0 12px', textTransform: 'uppercase' }}>
              Best Value - 85% OFF
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1a0b04' }}>Annual Access</div>
              <div style={{ fontSize: '0.85rem', color: 'rgba(26, 11, 4, 0.7)', fontWeight: 600 }}>$23.88 / year ($1.99/mo)</div>
            </div>
          </button>

          {/* Monthly Plan */}
          <button 
            onClick={() => onSubscribe('monthly')}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '1.25rem',
              cursor: 'pointer',
              transition: 'background 0.3s'
            }}
          >
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-white)' }}>Monthly Access</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-slate)', fontWeight: 600 }}>$12.99 / month</div>
            </div>
          </button>
        </div>

        <ul style={{ 
          listStyle: 'none', 
          padding: 0, 
          margin: '0 0 2rem 0', 
          textAlign: 'left', 
          display: 'inline-block',
          fontSize: '0.85rem',
          color: 'var(--text-slate)'
        }}>
          <li style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--accent-gold)' }}>✓</span> Unlimited scrolls of all scriptures
          </li>
          <li style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--accent-gold)' }}>✓</span> Full Hindi & Tamil translations
          </li>
          <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--accent-gold)' }}>✓</span> Support local scholars & preservation
          </li>
        </ul>

        <button 
          onClick={() => window.location.reload()}
          style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
        >
          Restore Purchase
        </button>
      </div>
    </div>
  );
};
