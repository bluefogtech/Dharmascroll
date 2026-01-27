
import React, { useState, useEffect } from 'react';

export const InstallGuide: React.FC = () => {
  const [show, setShow] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('other');

  useEffect(() => {
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

    // Show after a short delay
    const timer = setTimeout(() => setShow(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!show || platform === 'other') return null;

  return (
    <div className="install-guide">
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '8px', display: 'flex' }}>
        <img src="https://cdn-icons-png.flaticon.com/512/3663/3663335.png" alt="App Icon" style={{ width: '40px', height: '40px' }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Install DharmaScroll</div>
        <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>
          {platform === 'ios' 
            ? 'Tap "Share" then "Add to Home Screen"' 
            : 'Tap the menu icon then "Install App"'}
        </div>
      </div>
      <button 
        onClick={() => setShow(false)} 
        style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '1.2rem', padding: '0 0.5rem' }}
      >
        ✕
      </button>
    </div>
  );
};
