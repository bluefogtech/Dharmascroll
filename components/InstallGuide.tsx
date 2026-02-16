import React, { useState, useEffect, useRef } from 'react';

export const InstallGuide: React.FC = () => {
  const [show, setShow] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
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
    } else if (platform === 'ios') {
      // iOS - show instructions modal
      setShowInstructions(true);
    }
  };

  const handleCloseInstructions = () => {
    setShowInstructions(false);
  };

  if (!show || platform === 'other') return null;

  return (
    <>
      <div 
        className="install-guide-text-link"
        onClick={handleInstall}
        style={{
          cursor: 'pointer',
          userSelect: 'none',
        }}
        aria-label="Add DharmaScroll to Home Screen"
      >
        Add to Home Screen
      </div>

      {/* iOS Instructions Modal */}
      {showInstructions && platform === 'ios' && (
        <div
          className="install-instructions-modal"
          onClick={handleCloseInstructions}
        >
          <div
            className="install-instructions-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="install-instructions-header">
              <div className="install-instructions-icon">
                <img 
                  src="/dharmascroll-icon.png" 
                  alt="DharmaScroll Logo" 
                />
              </div>
              <h2>Add DharmaScroll to Home Screen</h2>
              <button
                className="install-instructions-close"
                onClick={handleCloseInstructions}
                aria-label="Close instructions"
              >
                ✕
              </button>
            </div>
            
            <div className="install-instructions-steps">
              <div className="install-step">
                <div className="install-step-number">1</div>
                <div className="install-step-content">
                  <p>Tap the <strong>Share</strong> button in the address bar (top right in Chrome, bottom in Safari)</p>
                  <div className="install-step-icon">📤</div>
                </div>
              </div>
              
              <div className="install-step">
                <div className="install-step-number">2</div>
                <div className="install-step-content">
                  <p>Look for <strong>"Add to Home Screen"</strong> in the share menu</p>
                  <div className="install-step-icon">🔍</div>
                </div>
              </div>
              
              <div className="install-step">
                <div className="install-step-number">3</div>
                <div className="install-step-content">
                  <p>If you don't see it, <strong>scroll down</strong> in the share menu - it may be below other options</p>
                  <div className="install-step-icon">⬇️</div>
                </div>
              </div>
              
              <div className="install-step">
                <div className="install-step-number">4</div>
                <div className="install-step-content">
                  <p>Tap <strong>"Add to Home Screen"</strong> and then tap <strong>"Add"</strong> to confirm</p>
                  <div className="install-step-icon">✓</div>
                </div>
              </div>
            </div>

            <div className="install-instructions-footer">
              <p><strong>Tip:</strong> Works in both Safari and Chrome. The share button location varies by browser - look for it in the address bar area.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
