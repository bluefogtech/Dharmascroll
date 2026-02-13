import React, { useState, useEffect, useRef } from 'react';

export const InstallGuide: React.FC = () => {
  const [show, setShow] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('other');
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);
  const deferredPrompt = useRef<any>(null);

  useEffect(() => {
    // Handle window resize
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Only show on mobile devices
    if (!isMobile) {
      setShow(false);
      return;
    }

    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
                         || (window.navigator as any).standalone 
                         || document.referrer.includes('android-app://');

    if (isStandalone) return;

    // Detect Platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform('ios');
    } else if (/android/.test(userAgent)) {
      setPlatform('android');
    }

    // Listen for beforeinstallprompt event (Android Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e;
      setPlatform('android');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Show after a short delay
    const timer = setTimeout(() => setShow(true), 2000);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [isMobile]);

  const handleInstall = async () => {
    if (deferredPrompt.current) {
      // Android Chrome - trigger install prompt
      deferredPrompt.current.prompt();
      const { outcome } = await deferredPrompt.current.userChoice;
      if (outcome === 'accepted') {
        setShow(false);
      }
      deferredPrompt.current = null;
    } else {
      // iOS or other - show instructions
      // Instructions are already visible in the component
    }
  };

  if (!show || platform === 'other') return null;

  return (
    <div className="install-guide">
      <div style={{
        background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 107, 53, 0.15) 100%)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 215, 0, 0.4)',
        borderRadius: '16px',
        padding: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 215, 0, 0.2)',
      }}>
        {/* App Icon */}
        <div style={{
          background: 'rgba(255, 215, 0, 0.2)',
          borderRadius: '12px',
          padding: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid rgba(255, 215, 0, 0.3)',
        }}>
          <span style={{ fontSize: '2rem', lineHeight: 1 }}>ॐ</span>
        </div>
        
        {/* Text Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontWeight: 700,
            fontSize: '0.9rem',
            color: 'var(--accent-gold)',
            marginBottom: '0.25rem',
            textShadow: '0 2px 8px rgba(255, 215, 0, 0.4)',
          }}>
            Add to Home Screen
          </div>
          <div style={{
            fontSize: '0.75rem',
            color: 'var(--text-cream)',
            opacity: 0.9,
            lineHeight: 1.4,
          }}>
            {platform === 'ios' 
              ? 'Tap Share → Add to Home Screen' 
              : 'Tap Install to add DharmaScroll'}
          </div>
        </div>

        {/* Install Button (Android) or Close (iOS) */}
        {platform === 'android' && deferredPrompt.current ? (
          <button
            onClick={handleInstall}
            style={{
              background: 'linear-gradient(135deg, var(--accent-gold) 0%, var(--accent-saffron) 100%)',
              border: 'none',
              borderRadius: '8px',
              padding: '0.5rem 1rem',
              color: 'var(--bg-dark)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(255, 215, 0, 0.4)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(255, 215, 0, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 215, 0, 0.4)';
            }}
          >
            Install
          </button>
        ) : (
          <button
            onClick={() => setShow(false)}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              borderRadius: '50%',
              width: '2rem',
              height: '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-gold)',
              fontSize: '1.2rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 215, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};
