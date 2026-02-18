import React, { useState, useEffect, useRef, useCallback } from 'react';
import { QuoteCard } from './components/QuoteCard';
import { ContactForm } from './components/ContactForm';
import { InstallGuide } from './components/InstallGuide';
import { Quote } from './types';
import { getQuotes, getGitaQuotes } from './services/wisdomService';
import { openDonatePage, getDonateLink, getDonateLinkFromConfig } from './services/donationService';

const VERSION_TAG = "v5.4.0-iphone-ux";

const App: React.FC = () => {
  const path = typeof window !== 'undefined' ? window.location.pathname : '/';
  const isLandingRoute = path === '/';
  const isGitaRoute = path === '/gita';
  const isRandomRoute = path === '/random';
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<'en' | 'hi' | 'ta'>('en');
  const [themeWeights, setThemeWeights] = useState<Record<string, number>>({});
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set());
  const [gitaIndexOpen, setGitaIndexOpen] = useState(false);
  const [donateLink, setDonateLink] = useState<string | null>(() => getDonateLink());
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);
  const [contactFormOpen, setContactFormOpen] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const fetchedIds = useRef<Set<string>>(new Set());
  const isLoadingMore = useRef(false);

  // Load donate link from runtime config (fixes Vercel when build-time env is missing)
  useEffect(() => {
    setDonateLink((prev) => prev || getDonateLink());
    getDonateLinkFromConfig().then((link) => {
      if (link) setDonateLink((prev) => prev || link);
    });
  }, []);

  // Mobile breakpoint for Gita layout (sidebar overlay vs inline)
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // On Gita page, ensure Tamil is not selected (since we hide the Tamil toggle)
  useEffect(() => {
    if (isGitaRoute && language === 'ta') {
      setLanguage('en');
    }
  }, [isGitaRoute, language]);

  // Initial Load (quotes data)
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        setError(null);
        if (isLandingRoute) return; // landing page doesn't need quotes

        const initial = isGitaRoute 
          ? await getGitaQuotes()
          : await getQuotes(true);
        setQuotes(initial);
        initial.forEach(q => fetchedIds.current.add(q.id));
      } catch (err: any) {
        console.error("Wisdom Fetch Error:", err);
        setError(err.message || "The spiritual wisdom vault is currently inaccessible.");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [isGitaRoute, isLandingRoute, isRandomRoute]);

  // Infinite Scroll Observer - throttled for performance, especially on mobile Gita
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    
    // Use requestAnimationFrame to throttle scroll handling for smooth performance
    requestAnimationFrame(() => {
      if (!containerRef.current) return;
      const { scrollTop, clientHeight } = containerRef.current;
      const newIndex = Math.round(scrollTop / clientHeight);
      
      if (newIndex !== activeIndex && newIndex >= 0 && newIndex < quotes.length) {
        setActiveIndex(newIndex);
      }

      // Load more when 2 items from the end (main quotes page only)
      if (!isGitaRoute && newIndex >= quotes.length - 2 && !isLoadingMore.current && quotes.length > 0) {
        loadMoreQuotes();
      }
    });
  }, [activeIndex, quotes.length, isGitaRoute]);

  const loadMoreQuotes = async () => {
    if (isLoadingMore.current) return;
    isLoadingMore.current = true;
    try {
      const more = await getQuotes(false, { 
        weights: themeWeights, 
        history: Array.from(fetchedIds.current) 
      });
      const uniqueMore = more.filter(q => !fetchedIds.current.has(q.id));
      uniqueMore.forEach(q => fetchedIds.current.add(q.id));
      setQuotes(prev => [...prev, ...uniqueMore]);
    } catch (err) {
      console.error("Failed to fetch more wisdom:", err);
    } finally {
      isLoadingMore.current = false;
    }
  };

  // Scroll to a specific verse index (Gita page)
  const scrollToIndex = useCallback(
    (index: number) => {
      if (!containerRef.current) return;
      const { clientHeight } = containerRef.current;
      // Use 'auto' behavior for instant jump instead of smooth scrolling
      containerRef.current.scrollTo({
        top: index * clientHeight,
        behavior: 'auto',
      });
    },
    []
  );

  const handleViewEnd = (id: string) => {
    const quote = quotes.find(q => q.id === id);
    if (quote) {
      setThemeWeights(prev => {
        const next = { ...prev };
        quote.themes.forEach(t => {
          next[t] = (next[t] || 0) + 1;
        });
        return next;
      });
    }
  };

  const handleShareWebsite = async () => {
    const shareText = 'Discover daily wisdom from DharmaScroll - Spiritual quotes and teachings from Bhagavad Gita. ॐ';
    const shareUrl = window.location.origin;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'DharmaScroll - Daily Spiritual Wisdom',
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
      }
    }
    setShowShareSheet(true);
  };

  const shareViaWhatsApp = () => {
    const shareText = 'Discover daily wisdom from DharmaScroll - Spiritual quotes and teachings from Bhagavad Gita. ॐ';
    const url = `https://wa.me/?text=${encodeURIComponent(shareText + "\n" + window.location.origin)}`;
    window.open(url, '_blank');
    setShowShareSheet(false);
  };

  const shareViaTwitter = () => {
    const shareText = 'Discover daily wisdom from DharmaScroll - Spiritual quotes and teachings from Bhagavad Gita. ॐ';
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(window.location.origin)}`;
    window.open(url, '_blank');
    setShowShareSheet(false);
  };

  const copyWebsiteLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      alert('Website link copied to clipboard! ॐ');
      setShowShareSheet(false);
    } catch (err) {
      alert('Could not copy link.');
    }
  };


  if (loading) {
    return (
      <div className="fullscreen-center">
        <div className="spinner"></div>
        <p style={{ color: 'var(--accent-gold)', letterSpacing: '0.15em', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600 }}>
          Connecting to the Wisdom Vault...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fullscreen-center">
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📿</div>
        <h2 style={{ color: 'var(--accent-gold)', marginBottom: '1.5rem', fontFamily: 'Playfair Display' }}>Silence in the Temple</h2>
        <p style={{ 
          color: 'var(--text-slate)', 
          marginBottom: '2.5rem', 
          maxWidth: '320px', 
          lineHeight: '1.6',
          fontSize: '0.95rem'
        }}>
          {error}
        </p>
        <button className="btn-primary" onClick={() => window.location.reload()}>
          Retry Connection
        </button>
      </div>
    );
  }

  // Landing page (main entry)
  if (isLandingRoute) {
    return (
      <div
        className="landing-container"
        style={{
          width: '100%',
          margin: 0,
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #1a0f0a 0%, #2d1a14 20%, #4a2c1a 40%, #6b3e26 60%, #4a2c1a 80%, #2d1a14 100%)',
          backgroundAttachment: 'fixed',
          fontFamily: '"Georgia", serif',
          color: 'var(--text-slate)',
        }}
      >
        {/* Header: brand – scrolls with content on landing so hero text doesn't hide under it */}
        <div className="header-logo" style={{ position: 'relative', flexShrink: 0, pointerEvents: 'auto', padding: '1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>ॐ</span>
            <span style={{ fontWeight: 800, fontSize: '0.75rem', letterSpacing: '3px' }}>DHARMA</span>
          </div>
          {/* Install Guide - Add to Home Screen (mobile only) */}
          <InstallGuide />
        </div>

        {/* Main hero + cards */}
        <div style={{ flex: 1, textAlign: 'center', padding: '0 16px 2rem' }}>
          <h1
            style={{
              fontSize: '2.4rem',
              marginBottom: '10px',
              color: 'var(--accent-gold)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            What do you seek today?
          </h1>
          <div
            style={{
              color: 'var(--text-slate)',
              marginBottom: '60px',
              maxWidth: '420px',
              marginLeft: 'auto',
              marginRight: 'auto',
              fontSize: '0.95rem',
              lineHeight: 1.6,
            }}
          >
            Wisdom appears differently when we search… and when we surrender.
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '32px',
              flexWrap: 'wrap',
            }}
          >
            {/* Card 1 */}
            <div
              style={{
                width: '320px',
                padding: '32px',
                borderRadius: '20px',
                background:
                  'radial-gradient(circle at top left, rgba(251, 191, 36, 0.18), transparent 55%), rgba(15, 23, 42, 0.96)',
                boxShadow: '0 18px 40px rgba(0,0,0,0.7)',
                border: '1px solid rgba(248, 250, 252, 0.08)',
                transition: '0.3s',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.transform = 'translateY(-6px)';
                el.style.boxShadow = '0 26px 55px rgba(0,0,0,0.85)';
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.transform = 'translateY(0)';
                el.style.boxShadow = '0 18px 40px rgba(0,0,0,0.7)';
              }}
            >
              <h2
                style={{
                  marginBottom: '15px',
                  color: 'var(--accent-gold)',
                  fontSize: '1.2rem',
                  fontWeight: 600,
                }}
              >
                ✨ Receive a Message
              </h2>
              <p style={{ color: 'var(--text-slate)', minHeight: '60px', fontSize: '0.95rem' }}>
                Let wisdom find you. Scroll through spiritual quotes chosen for you.
              </p>
              <button
                onClick={() => {
                  window.location.href = '/random';
                }}
                style={{
                  padding: '10px 24px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #facc15, #f97316)',
                  color: '#0b0f19',
                  borderRadius: '999px',
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  marginTop: '20px',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  boxShadow: '0 0 18px rgba(250, 204, 21, 0.55)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.08)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1)';
                }}
              >
                Start Scrolling
              </button>
            </div>

            {/* Card 2 */}
            <div
              style={{
                width: '320px',
                padding: '32px',
                borderRadius: '20px',
                background:
                  'radial-gradient(circle at top left, rgba(248, 250, 252, 0.1), transparent 55%), rgba(15, 23, 42, 0.96)',
                boxShadow: '0 18px 40px rgba(0,0,0,0.7)',
                border: '1px solid rgba(248, 250, 252, 0.08)',
                transition: '0.3s',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.transform = 'translateY(-6px)';
                el.style.boxShadow = '0 26px 55px rgba(0,0,0,0.85)';
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.transform = 'translateY(0)';
                el.style.boxShadow = '0 18px 40px rgba(0,0,0,0.7)';
              }}
            >
              <h2
                style={{
                  marginBottom: '15px',
                  color: 'var(--accent-gold)',
                  fontSize: '1.2rem',
                  fontWeight: 600,
                }}
              >
                📖 Study the Gita
              </h2>
              <p style={{ color: 'var(--text-slate)', minHeight: '60px', fontSize: '0.95rem' }}>
                Walk verse by verse through the Bhagavad Gita and absorb its depth.
              </p>
              <button
                disabled
                style={{
                  padding: '10px 24px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #facc15, #f97316)',
                  color: '#0b0f19',
                  borderRadius: '999px',
                  fontSize: '0.95rem',
                  cursor: 'not-allowed',
                  marginTop: '20px',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  boxShadow: '0 0 18px rgba(250, 204, 21, 0.55)',
                  opacity: 0.6,
                }}
              >
                Begin Journey
              </button>
            </div>

            {/* Card 3 - Coming Soon */}
            <div
              style={{
                width: '320px',
                padding: '32px',
                borderRadius: '20px',
                background:
                  'radial-gradient(circle at top left, rgba(251, 191, 36, 0.12), transparent 55%), rgba(15, 23, 42, 0.96)',
                boxShadow: '0 18px 40px rgba(0,0,0,0.7)',
                border: '1px solid rgba(248, 250, 252, 0.08)',
                transition: '0.3s',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.transform = 'translateY(-6px)';
                el.style.boxShadow = '0 26px 55px rgba(0,0,0,0.85)';
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.transform = 'translateY(0)';
                el.style.boxShadow = '0 18px 40px rgba(0,0,0,0.7)';
              }}
            >
              <h2
                style={{
                  marginBottom: '15px',
                  color: 'var(--accent-gold)',
                  fontSize: '1.2rem',
                  fontWeight: 600,
                }}
              >
                🎵 Coming Soon
              </h2>
              <p style={{ color: 'var(--text-slate)', minHeight: '60px', fontSize: '0.95rem' }}>
                Aarti and Bhajan collection
              </p>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  // Do nothing
                }}
                style={{
                  padding: '10px 24px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #facc15, #f97316)',
                  color: '#0b0f19',
                  borderRadius: '999px',
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  marginTop: '20px',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  boxShadow: '0 0 18px rgba(250, 204, 21, 0.55)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.08)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1)';
                }}
              >
                Explore
              </button>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div style={{ 
          textAlign: 'center', 
          padding: '2rem 1rem 1rem', 
          maxWidth: '600px', 
          margin: '0 auto',
          color: 'var(--text-slate)',
          fontSize: '0.75rem',
          lineHeight: 1.6,
          opacity: 0.7,
        }}>
          <p style={{ margin: 0 }}>
            Quotes sourced from public spiritual sources. For spiritual learning only.
          </p>
        </div>

        {/* Version tag and contact – at bottom of viewport on desktop, scrolls with content when long; extra bottom padding on mobile so footer stays above browser chrome */}
        <div className="version-tag landing-footer" style={{ 
          position: 'relative',
          flexShrink: 0,
          marginTop: 'auto',
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'flex-start', 
          gap: '0.75rem', 
          padding: '1rem',
          paddingBottom: 'max(2rem, calc(env(safe-area-inset-bottom, 0px) + 80px))',
        }}>
          {/* Share and Get in Touch */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem',
            flexWrap: 'nowrap',
          }}>
            <button
              onClick={handleShareWebsite}
              style={{
                color: 'var(--accent-gold)',
                fontSize: '0.75rem',
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'inherit',
                textDecoration: 'none',
                transition: 'opacity 0.2s',
                background: 'none',
                border: 'none',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.opacity = '0.8';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.opacity = '1';
              }}
            >
              <svg fill="currentColor" viewBox="0 0 24 24" style={{ width: '0.9rem', height: '0.9rem' }}>
                <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
              </svg>
              Share
            </button>
            <button
              onClick={() => setContactFormOpen(true)}
              style={{
                color: 'var(--accent-gold)',
                fontSize: '0.75rem',
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'inherit',
                textDecoration: 'none',
                transition: 'opacity 0.2s',
                background: 'none',
                border: 'none',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.opacity = '0.8';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.opacity = '1';
              }}
            >
              <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: '0.9rem', height: '0.9rem' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              Get in Touch
            </button>
          </div>
        </div>
        {/* Spacer so on mobile the footer stays visible when browser chrome (toolbar) reappears after scroll ends */}
        <div style={{ flexShrink: 0, minHeight: '120px' }} aria-hidden="true" />
        
        {/* Share Sheet Modal */}
        {showShareSheet && (
          <>
            <div 
              className="overlay" 
              style={{ 
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.4)', 
                backdropFilter: 'blur(4px)', 
                zIndex: 1500 
              }} 
              onClick={() => setShowShareSheet(false)}
            ></div>
            <div 
              className="bottom-sheet" 
              onClick={e => e.stopPropagation()}
              style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'var(--bg-dark)',
                borderTopLeftRadius: '20px',
                borderTopRightRadius: '20px',
                padding: '1.5rem',
                zIndex: 1501,
                maxWidth: '500px',
                margin: '0 auto',
                boxShadow: '0 -4px 20px rgba(0,0,0,0.5)',
              }}
            >
              <div className="sheet-handle" style={{
                width: '40px',
                height: '4px',
                background: 'rgba(255,255,255,0.3)',
                borderRadius: '2px',
                margin: '0 auto 1rem',
              }}></div>
              <h3 style={{ 
                textAlign: 'center', 
                color: 'var(--accent-gold)', 
                marginBottom: '1.5rem', 
                fontFamily: 'Playfair Display', 
                fontSize: '1.2rem' 
              }}>
                Share DharmaScroll
              </h3>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(3, 1fr)', 
                gap: '1rem', 
                marginBottom: '2rem' 
              }}>
                <div 
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    gap: '0.5rem', 
                    cursor: 'pointer' 
                  }} 
                  onClick={shareViaWhatsApp}
                >
                  <div style={{ 
                    width: '3.5rem', 
                    height: '3.5rem', 
                    borderRadius: '50%', 
                    backgroundColor: '#25D366', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    color: 'white' 
                  }}>
                    <svg style={{ width: '1.8rem', height: '1.8rem' }} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.185-.573c.948.517 2.042.887 3.144.888 3.181 0 5.767-2.586 5.768-5.766 0-3.18-2.586-5.766-5.766-5.766zm3.446 8.202c-.145.408-.847.822-1.18.874-.333.051-.747.082-1.254-.083-.284-.092-.511-.191-.861-.341-1.49-.636-2.455-2.155-2.53-2.254-.075-.101-.606-.806-.606-1.537 0-.731.382-1.09.518-1.241.136-.151.298-.189.397-.189.1 0 .199.001.285.006.091.004.214-.035.334.254.124.3.426 1.034.463 1.109.037.075.062.163.013.262-.049.099-.074.162-.149.248-.075.086-.157.192-.224.257-.074.072-.152.151-.065.3.087.149.387.639.831 1.034.571.507 1.053.665 1.202.739.15.074.237.062.325-.04.088-.102.373-.434.474-.582.101-.148.202-.123.339-.072.138.051.874.412 1.025.487.151.076.251.114.288.177.037.063.037.363-.108.771z"/>
                    </svg>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-slate)' }}>WhatsApp</span>
                </div>
                
                <div 
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    gap: '0.5rem', 
                    cursor: 'pointer' 
                  }} 
                  onClick={shareViaTwitter}
                >
                  <div style={{ 
                    width: '3.5rem', 
                    height: '3.5rem', 
                    borderRadius: '50%', 
                    backgroundColor: '#000000', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    color: 'white', 
                    border: '1px solid rgba(255,255,255,0.1)' 
                  }}>
                    <svg style={{ width: '1.4rem', height: '1.4rem' }} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-slate)' }}>X (Twitter)</span>
                </div>
                
                <div 
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    gap: '0.5rem', 
                    cursor: 'pointer' 
                  }} 
                  onClick={copyWebsiteLink}
                >
                  <div style={{ 
                    width: '3.5rem', 
                    height: '3.5rem', 
                    borderRadius: '50%', 
                    backgroundColor: 'rgba(255,255,255,0.1)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    color: 'white' 
                  }}>
                    <svg style={{ width: '1.4rem', height: '1.4rem' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path>
                    </svg>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-slate)' }}>Copy Link</span>
                </div>
              </div>
              
              <button 
                className="btn-primary" 
                style={{ 
                  width: '100%', 
                  background: 'transparent', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  color: 'var(--text-slate)',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }} 
                onClick={() => setShowShareSheet(false)}
              >
                Cancel
              </button>
            </div>
          </>
        )}
        
        <ContactForm
          isOpen={contactFormOpen}
          onClose={() => setContactFormOpen(false)}
          recipientEmail="contact@bluefog.co.uk"
        />
      </div>
    );
  }

  // Quotes / Gita pages
  return (
    <div style={{ position: 'relative', height: '100%', width: '100%', background: 'var(--bg-dark)', display: 'flex', flexDirection: 'column' }}>
      {/* App Header: Home + Language only (no ॐ DHARMA on Gita/Random); Gita mobile: Chapters on left */}
      <div
        className="header-logo"
        style={{
          pointerEvents: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: '0.5rem',
          padding: '1rem',
          marginBottom: '1rem',
        }}
      >
        {/* Top row: Brand + (Chapters button on mobile Gita) + Home + Language */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>ॐ</span>
            <span style={{ fontWeight: 800, fontSize: '0.75rem', letterSpacing: '3px' }}>DHARMA</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.4rem' : '0.75rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {/* Install Guide - Add to Home Screen (mobile only) */}
            <InstallGuide />
          <a
            href="/"
            onClick={(e) => { e.preventDefault(); window.location.href = '/'; }}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'opacity 0.2s',
              position: 'relative',
            }}
            aria-label="Home"
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.opacity = '0.7';
              const tooltip = e.currentTarget.querySelector('.home-tooltip') as HTMLElement;
              if (tooltip) tooltip.style.opacity = '1';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.opacity = '1';
              const tooltip = e.currentTarget.querySelector('.home-tooltip') as HTMLElement;
              if (tooltip) tooltip.style.opacity = '0';
            }}
          >
            <img 
              src="/home-icon.png" 
              alt="Home" 
              style={{ 
                height: isMobile ? '1.5rem' : '2rem', 
                width: 'auto', 
                objectFit: 'contain',
              }}
            />
            <span
              className="home-tooltip"
              style={{
                position: 'absolute',
                bottom: '-1.5rem',
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: '0.7rem',
                color: 'var(--accent-gold)',
                whiteSpace: 'nowrap',
                opacity: 0,
                pointerEvents: 'none',
                transition: 'opacity 0.2s',
                fontWeight: 600,
              }}
            >
              Home
            </span>
          </a>
          <div className="lang-picker" style={{ fontSize: isMobile ? '0.7rem' : undefined }}>
            <button className={`lang-option ${language === 'en' ? 'active' : ''}`} onClick={() => setLanguage('en')} style={{ padding: isMobile ? '0.3rem 0.6rem' : undefined }}>EN</button>
            <button className={`lang-option ${language === 'hi' ? 'active' : ''}`} onClick={() => setLanguage('hi')} style={{ padding: isMobile ? '0.3rem 0.6rem' : undefined }}>हिन्दी</button>
            {!isGitaRoute && (
              <button className={`lang-option ${language === 'ta' ? 'active' : ''}`} onClick={() => setLanguage('ta')} style={{ padding: isMobile ? '0.3rem 0.6rem' : undefined }}>தமிழ்</button>
            )}
          </div>
        </div>
        </div>
      </div>

      {/* Main content area: left chapter sidebar (Gita desktop only) + verse content. zIndex so action-bar/scroll-cue sit above version-tag. */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, paddingTop: '64px', position: 'relative', zIndex: 55 }}>
        {isGitaRoute && !isMobile && (
          <div
            style={{
              width: '24%',
              maxWidth: '200px',
              borderRight: '1px solid rgba(255,255,255,0.06)',
              padding: '0.75rem 0.4rem 0.75rem 0.6rem',
              overflowY: 'auto',
              boxSizing: 'border-box',
              flexShrink: 0,
            }}
          >
            <div style={{ color: 'var(--accent-gold)', fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              Bhagavad Gita Index
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-slate)' }}>
              {(() => {
                const chapters: { chapter: number; verses: { verse: number; index: number }[] }[] = [];
                const chapterMap = new Map<number, { verse: number; index: number }[]>();
                quotes.forEach((q, idx) => {
                  const parts = q.source.split('•');
                  const refPart = parts[1]?.trim() || '';
                  const match = refPart.match(/Chapter\s+(\d+)\s*,\s*Verse\s+(\d+)/i);
                  if (!match) return;
                  const chapterNum = parseInt(match[1], 10);
                  const verseNum = parseInt(match[2], 10);
                  if (!chapterMap.has(chapterNum)) chapterMap.set(chapterNum, []);
                  chapterMap.get(chapterNum)!.push({ verse: verseNum, index: idx });
                });
                Array.from(chapterMap.entries())
                  .sort((a, b) => a[0] - b[0])
                  .forEach(([chapter, verses]) => {
                    chapters.push({ chapter, verses: verses.sort((a, b) => a.verse - b.verse) });
                  });
                const toggleChapter = (chapterNum: number) => {
                  setExpandedChapters(prev => {
                    const next = new Set(prev);
                    if (next.has(chapterNum)) next.delete(chapterNum);
                    else next.add(chapterNum);
                    return next;
                  });
                };
                return chapters.map(ch => {
                  const isExpanded = expandedChapters.has(ch.chapter);
                  const isActiveChapter = ch.verses.some(v => v.index === activeIndex);
                  return (
                    <div key={ch.chapter} style={{ marginBottom: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => toggleChapter(ch.chapter)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-start',
                          width: '100%',
                          gap: '0.4rem',
                          background: isActiveChapter ? 'rgba(255,215,0,0.18)' : 'transparent',
                          border: 'none',
                          color: 'var(--accent-gold)',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          padding: '0.2rem 0',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <span>Chapter {ch.chapter}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-slate)', marginLeft: 'auto' }}>{isExpanded ? '−' : '+'}</span>
                      </button>
                      {isExpanded && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem', marginTop: '0.15rem' }}>
                          {ch.verses.map(v => {
                            const isActiveVerse = v.index === activeIndex;
                            return (
                              <button
                                key={`${ch.chapter}-${v.verse}`}
                                type="button"
                                onClick={() => { setActiveIndex(v.index); scrollToIndex(v.index); }}
                                style={{
                                  border: isActiveVerse ? '1px solid var(--accent-gold)' : 'none',
                                  padding: '0.1rem 0.25rem',
                                  borderRadius: '999px',
                                  fontSize: '0.7rem',
                                  backgroundColor: isActiveVerse ? 'rgba(255,215,0,0.25)' : 'rgba(255,255,255,0.06)',
                                  color: isActiveVerse ? 'var(--accent-gold)' : 'var(--text-slate)',
                                  cursor: 'pointer',
                                  fontWeight: isActiveVerse ? 600 : 400,
                                }}
                              >
                                {v.verse}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}
        <div style={{ flex: 1, width: '100%', minWidth: 0, minHeight: 0, position: 'relative' }} className={isGitaRoute ? 'gita-verse-area' : ''}>
          {isGitaRoute && isMobile && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setGitaIndexOpen(true); }}
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '0.75rem',
                zIndex: 30,
                padding: '0.4rem 0.65rem',
                fontSize: '0.7rem',
                fontWeight: 600,
                color: 'var(--accent-gold)',
                background: 'rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,215,0,0.4)',
                borderRadius: '6px',
                cursor: 'pointer',
                backdropFilter: 'blur(6px)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              }}
            >
              Chapters
            </button>
          )}
          <div 
            ref={containerRef}
            className="snap-container"
            onScroll={handleScroll}
            onClick={() => isGitaRoute && isMobile && setGitaIndexOpen(false)}
          >
            {quotes.map((quote, idx) => (
              <QuoteCard 
                key={quote.id}
                quote={quote} 
                isActive={activeIndex === idx} 
                language={language}
                onViewStart={() => {}} 
                onViewEnd={handleViewEnd}
                isGitaPage={isGitaRoute}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Gita: chapter index overlay (open via Chapters button, close on verse area tap) */}
      {isGitaRoute && isMobile && gitaIndexOpen && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.6)',
              zIndex: 400,
            }}
            onClick={() => setGitaIndexOpen(false)}
            aria-hidden="true"
          />
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              width: 'min(280px, 85vw)',
              background: 'var(--bg-dark)',
              borderRight: '1px solid rgba(255,255,255,0.1)',
              zIndex: 401,
              overflowY: 'auto',
              padding: '1rem',
              boxSizing: 'border-box',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ color: 'var(--accent-gold)', fontSize: '0.8rem', letterSpacing: '0.1em', fontWeight: 600 }}>Bhagavad Gita Index</span>
              <button
                type="button"
                onClick={() => setGitaIndexOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-slate)', fontSize: '1.25rem', cursor: 'pointer', padding: '0.25rem' }}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-slate)' }}>
              {(() => {
                const chapters: { chapter: number; verses: { verse: number; index: number }[] }[] = [];
                const chapterMap = new Map<number, { verse: number; index: number }[]>();
                quotes.forEach((q, idx) => {
                  const parts = q.source.split('•');
                  const refPart = parts[1]?.trim() || '';
                  const match = refPart.match(/Chapter\s+(\d+)\s*,\s*Verse\s+(\d+)/i);
                  if (!match) return;
                  const chapterNum = parseInt(match[1], 10);
                  const verseNum = parseInt(match[2], 10);
                  if (!chapterMap.has(chapterNum)) chapterMap.set(chapterNum, []);
                  chapterMap.get(chapterNum)!.push({ verse: verseNum, index: idx });
                });
                Array.from(chapterMap.entries())
                  .sort((a, b) => a[0] - b[0])
                  .forEach(([chapter, verses]) => {
                    chapters.push({ chapter, verses: verses.sort((a, b) => a.verse - b.verse) });
                  });
                const toggleChapter = (chapterNum: number) => {
                  setExpandedChapters(prev => {
                    const next = new Set(prev);
                    if (next.has(chapterNum)) next.delete(chapterNum);
                    else next.add(chapterNum);
                    return next;
                  });
                };
                return chapters.map(ch => {
                  const isExpanded = expandedChapters.has(ch.chapter);
                  const isActiveChapter = ch.verses.some(v => v.index === activeIndex);
                  return (
                    <div key={ch.chapter} style={{ marginBottom: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => toggleChapter(ch.chapter)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%',
                          background: isActiveChapter ? 'rgba(255,215,0,0.18)' : 'transparent',
                          border: 'none',
                          color: 'var(--accent-gold)',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          padding: '0.35rem 0',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <span>Chapter {ch.chapter}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-slate)' }}>{isExpanded ? '−' : '+'}</span>
                      </button>
                      {isExpanded && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.25rem' }}>
                          {ch.verses.map(v => (
                            <button
                              key={`${ch.chapter}-${v.verse}`}
                              type="button"
                              onClick={() => {
                                setActiveIndex(v.index);
                                scrollToIndex(v.index);
                                setGitaIndexOpen(false);
                              }}
                              style={{
                                border: v.index === activeIndex ? '1px solid var(--accent-gold)' : 'none',
                                padding: '0.35rem 0.5rem',
                                borderRadius: '999px',
                                fontSize: '0.8rem',
                                backgroundColor: v.index === activeIndex ? 'rgba(255,215,0,0.25)' : 'rgba(255,255,255,0.08)',
                                color: v.index === activeIndex ? 'var(--accent-gold)' : 'var(--text-slate)',
                                cursor: 'pointer',
                                fontWeight: v.index === activeIndex ? 600 : 400,
                              }}
                            >
                              {v.verse}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </>
      )}

      <div className="version-tag" style={{ 
        position: 'relative',
        flexShrink: 0,
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'flex-start' : 'center', 
        gap: isMobile ? '0.5rem' : '0.75rem', 
        flexWrap: 'wrap', 
        justifyContent: 'flex-start',
        padding: '1rem',
        marginTop: '0',
        zIndex: 100,
      }}>
        {/* Get in Touch */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setContactFormOpen(true)}
          style={{
            color: 'var(--accent-gold)',
            fontSize: '0.75rem',
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'inherit',
            textDecoration: 'none',
            transition: 'opacity 0.2s',
            background: 'none',
            border: 'none',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            zIndex: 101,
            position: 'relative',
            pointerEvents: 'auto',
            touchAction: 'manipulation',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.opacity = '0.8';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.opacity = '1';
          }}
        >
          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: '0.9rem', height: '0.9rem' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
          Get in Touch
        </button>
        </div>
      </div>
      
      <ContactForm
        isOpen={contactFormOpen}
        onClose={() => setContactFormOpen(false)}
        recipientEmail="contact@bluefog.co.uk"
      />
    </div>
  );
};

export default App;