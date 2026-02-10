import React, { useState, useEffect, useRef, useCallback } from 'react';
import { QuoteCard } from './components/QuoteCard';
import { InstallGuide } from './components/InstallGuide';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { Quote } from './types';
import { getQuotes, getGitaQuotes } from './services/wisdomService';
import { getCurrentUser, onAuthStateChange, signOut, mapUserToAuthUser } from './services/authService';
import { trackEvent } from './services/analyticsService';
import { openDonatePage, isDonateConfigured } from './services/donationService';
import { AuthUser } from './services/authService';

const VERSION_TAG = "v5.4.0-iphone-ux";
const BUILT_BY = "Developed by Blue Fog Technology";

const App: React.FC = () => {
  const path = typeof window !== 'undefined' ? window.location.pathname : '/';
  const isLandingRoute = path === '/';
  const isGitaRoute = path === '/gita';
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<'en' | 'hi' | 'ta'>('en');
  const [themeWeights, setThemeWeights] = useState<Record<string, number>>({});
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set());
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  // Authentication state
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const fetchedIds = useRef<Set<string>>(new Set());
  const isLoadingMore = useRef(false);

  // Check authentication on mount and listen for changes
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(mapUserToAuthUser(currentUser));
        
        // Track login if user just returned from OAuth
        if (currentUser) {
          const urlParams = new URLSearchParams(window.location.search);
          if (urlParams.get('code') || urlParams.get('access_token')) {
            // User just completed OAuth flow
            await trackEvent(currentUser.id, 'login', {
              method: 'google',
              timestamp: new Date().toISOString(),
            });
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        }
      } catch (err) {
        console.error('Auth check error:', err);
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = onAuthStateChange((user) => {
      setUser(mapUserToAuthUser(user));
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // On Gita page, ensure Tamil is not selected (since we hide the Tamil toggle)
  useEffect(() => {
    if (isGitaRoute && language === 'ta') {
      setLanguage('en');
    }
  }, [isGitaRoute, language]);

  // Initial Load (quotes data) after auth check completes
  useEffect(() => {
    if (authLoading) return;

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
  }, [authLoading, isGitaRoute, isLandingRoute]);

  // Infinite Scroll Observer
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollTop, clientHeight } = containerRef.current;
    const newIndex = Math.round(scrollTop / clientHeight);
    
    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex);
    }

    // Load more when 2 items from the end (main quotes page only)
    if (!isGitaRoute && newIndex >= quotes.length - 2 && !isLoadingMore.current && quotes.length > 0) {
      loadMoreQuotes();
    }
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
      containerRef.current.scrollTo({
        top: index * clientHeight,
        behavior: 'smooth',
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

  const handleLogout = async () => {
    try {
      if (user) {
        // Best-effort tracking; ignore failures
        try {
          await trackEvent(user.id, 'logout', {
            timestamp: new Date().toISOString(),
          });
        } catch (err) {
          console.error('Logout tracking failed:', err);
        }
      }
      // Perform Supabase sign out and clear local user
      const { error } = await signOut();
      if (error) {
        console.error('Supabase signOut error:', error);
      }
      setUser(null);

      // Close any open profile menus
      ['profile-menu-home', 'profile-menu'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
      });
    } finally {
      // Hard redirect so auth/UI state is fully reset
      window.location.href = '/';
    }
  };

  // Show auth loading
  if (authLoading) {
    return (
      <div className="fullscreen-center">
        <div className="spinner"></div>
        <p style={{ color: 'var(--accent-gold)', letterSpacing: '0.15em', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600 }}>
          Authenticating...
        </p>
      </div>
    );
  }

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
        style={{
          minHeight: '100vh',
          width: '100%',
          margin: 0,
          background: 'linear-gradient(135deg, #1a0f0a 0%, #2d1a14 20%, #4a2c1a 40%, #6b3e26 60%, #4a2c1a 80%, #2d1a14 100%)',
          backgroundAttachment: 'fixed',
          fontFamily: '"Georgia", serif',
          color: 'var(--text-slate)',
        }}
      >
        {/* Header: brand + auth only on home */}
        <div className="header-logo" style={{ pointerEvents: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>ॐ</span>
            <span style={{ fontWeight: 800, fontSize: '0.75rem', letterSpacing: '3px' }}>DHARMA</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {isDonateConfigured() && (
              <button
                className="logout-btn"
                style={{
                  background: 'rgba(46, 125, 50, 0.25)',
                  borderColor: 'var(--accent-forest, #2E7D32)',
                  color: 'var(--accent-forest, #4ade80)',
                }}
                onClick={openDonatePage}
              >
                Donate
              </button>
            )}
            {!user ? (
              <button
                className="logout-btn"
                onClick={() => {
                  setShowRegister(false);
                  setShowAuthModal(true);
                }}
              >
                Sign in
              </button>
            ) : (
              <div style={{ position: 'relative' }}>
                <button
                  className="logout-btn"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  onClick={() => {
                    const menu = document.getElementById('profile-menu-home');
                    if (menu) {
                      const isHidden = menu.style.display === 'none' || !menu.style.display;
                      menu.style.display = isHidden ? 'block' : 'none';
                    }
                  }}
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name || 'Profile'}
                      style={{ width: '20px', height: '20px', borderRadius: '50%' }}
                    />
                  ) : (
                    <span style={{ fontSize: '0.8rem' }}>{user.name?.[0] || 'U'}</span>
                  )}
                  <span style={{ fontSize: '0.7rem' }}>Account ▾</span>
                </button>
                <div
                  id="profile-menu-home"
                  style={{
                    position: 'absolute',
                    top: '120%',
                    right: 0,
                    background: 'rgba(15, 23, 42, 0.97)',
                    borderRadius: '0.5rem',
                    border: '1px solid rgba(148, 163, 184, 0.4)',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
                    minWidth: '160px',
                    padding: '0.4rem 0',
                    display: 'none',
                    zIndex: 999,
                  }}
                >
                  <button
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-cream)',
                      textAlign: 'left',
                      padding: '0.5rem 0.9rem',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      alert('Saved quotes coming soon.');
                    }}
                  >
                    Saved quotes
                  </button>
                  <button
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-cream)',
                      textAlign: 'left',
                      padding: '0.5rem 0.9rem',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      alert(`Profile: ${user?.email || ''}`);
                    }}
                  >
                    Profile
                  </button>
                  <button
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      color: '#f97373',
                      textAlign: 'left',
                      padding: '0.5rem 0.9rem',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main hero + cards */}
        <div style={{ marginTop: '80px', textAlign: 'center', padding: '0 16px' }}>
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
                  if (!user) return;
                  window.location.href = '/random';
                }}
                style={{
                  padding: '10px 24px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #facc15, #f97316)',
                  color: '#0b0f19',
                  borderRadius: '999px',
                  fontSize: '0.95rem',
                  cursor: user ? 'pointer' : 'not-allowed',
                  marginTop: '20px',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  boxShadow: '0 0 18px rgba(250, 204, 21, 0.55)',
                  opacity: user ? 1 : 0.6,
                }}
                onMouseEnter={e => {
                  if (!user) return;
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
                onClick={() => {
                  if (!user) return;
                  window.location.href = '/gita';
                }}
                style={{
                  padding: '10px 24px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #facc15, #f97316)',
                  color: '#0b0f19',
                  borderRadius: '999px',
                  fontSize: '0.95rem',
                  cursor: user ? 'pointer' : 'not-allowed',
                  marginTop: '20px',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  boxShadow: '0 0 18px rgba(250, 204, 21, 0.55)',
                  opacity: user ? 1 : 0.6,
                }}
                onMouseEnter={e => {
                  if (!user) return;
                  (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.08)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1)';
                }}
              >
                Begin Journey
              </button>
            </div>
          </div>
        </div>

        {/* Auth modal overlay (home only) */}
        {showAuthModal && (
          <>
            <div
              className="overlay"
              style={{ background: 'rgba(0,0,0,0.7)', zIndex: 1500 }}
              onClick={() => setShowAuthModal(false)}
            ></div>
            <div
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 1600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {showRegister ? (
                <RegisterForm
                  onSuccess={() => {
                    setShowRegister(false);
                    setShowAuthModal(false);
                  }}
                  onSwitchToLogin={() => setShowRegister(false)}
                />
              ) : (
                <LoginForm
                  onSuccess={() => {
                    setShowAuthModal(false);
                  }}
                  onSwitchToRegister={() => setShowRegister(true)}
                />
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  // Quotes / Gita pages
  return (
    <div style={{ position: 'relative', height: '100%', width: '100%', background: 'var(--bg-dark)' }}>
      {/* App Header with Home + Language Picker (no auth on random/Gita pages); Gita: logo centered */}
      <div
        className="header-logo"
        style={{
          pointerEvents: 'auto',
          ...(isGitaRoute
            ? { display: 'flex', justifyContent: 'center', alignItems: 'center' }
            : {}),
        }}
      >
        {isGitaRoute ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>ॐ</span>
              <span style={{ fontWeight: 800, fontSize: '0.75rem', letterSpacing: '3px' }}>DHARMA</span>
            </div>
            <div style={{ position: 'absolute', right: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button
                className="logout-btn"
                style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                onClick={() => { window.location.href = '/'; }}
              >
                <span style={{ fontSize: '1rem' }}>🏠</span>
                <span style={{ fontSize: '0.7rem' }}>Home</span>
              </button>
              <div className="lang-picker">
                <button className={`lang-option ${language === 'en' ? 'active' : ''}`} onClick={() => setLanguage('en')}>EN</button>
                <button className={`lang-option ${language === 'hi' ? 'active' : ''}`} onClick={() => setLanguage('hi')}>हिन्दी</button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>ॐ</span>
              <span style={{ fontWeight: 800, fontSize: '0.75rem', letterSpacing: '3px' }}>DHARMA</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Home button back to landing page */}
          <button
            className="logout-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            onClick={() => {
              window.location.href = '/';
            }}
          >
            <span style={{ fontSize: '1rem' }}>🏠</span>
            <span style={{ fontSize: '0.7rem' }}>Home</span>
          </button>

          <div className="lang-picker">
            <button 
              className={`lang-option ${language === 'en' ? 'active' : ''}`}
              onClick={() => setLanguage('en')}
            >
              EN
            </button>
            <button 
              className={`lang-option ${language === 'hi' ? 'active' : ''}`}
              onClick={() => setLanguage('hi')}
            >
              हिन्दी
            </button>
            {!isGitaRoute && (
              <button 
                className={`lang-option ${language === 'ta' ? 'active' : ''}`}
                onClick={() => setLanguage('ta')}
              >
                தமிழ்
              </button>
            )}
          </div>
        </div>
          </>
        )}
      </div>

      {/* Main content area */}
      <div style={{ display: 'flex', height: 'calc(100% - 56px)' }}>
        {isGitaRoute && (
          <div
            style={{
              width: '32%',
              maxWidth: '260px',
              borderRight: '1px solid rgba(255,255,255,0.06)',
              padding: '0.75rem 0.5rem 0.75rem 0.75rem',
              overflowY: 'auto',
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                color: 'var(--accent-gold)',
                fontSize: '0.75rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                marginBottom: '0.5rem',
              }}
            >
              Bhagavad Gita Index
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-slate)', maxHeight: '100%', overflowY: 'auto' }}>
              {(() => {
                // Build chapter/verse index from the quotes' source strings
                const chapters: { chapter: number; verses: { verse: number; index: number }[] }[] = [];
                const chapterMap = new Map<number, { verse: number; index: number }[]>();

                quotes.forEach((q, idx) => {
                  const parts = q.source.split('•');
                  const refPart = parts[1]?.trim() || '';
                  // Match strings like: "Chapter 2, Verse 47"
                  const match = refPart.match(/Chapter\s+(\d+)\s*,\s*Verse\s+(\d+)/i);
                  if (!match) return;
                  const chapterNum = parseInt(match[1], 10);
                  const verseNum = parseInt(match[2], 10);
                  if (!chapterMap.has(chapterNum)) {
                    chapterMap.set(chapterNum, []);
                  }
                  chapterMap.get(chapterNum)!.push({ verse: verseNum, index: idx });
                });

                Array.from(chapterMap.entries())
                  .sort((a, b) => a[0] - b[0])
                  .forEach(([chapter, verses]) => {
                    chapters.push({
                      chapter,
                      verses: verses.sort((a, b) => a.verse - b.verse),
                    });
                  });

                const toggleChapter = (chapterNum: number) => {
                  setExpandedChapters(prev => {
                    const next = new Set(prev);
                    if (next.has(chapterNum)) {
                      next.delete(chapterNum);
                    } else {
                      next.add(chapterNum);
                    }
                    return next;
                  });
                };

                return chapters.map(ch => {
                  const isExpanded = expandedChapters.has(ch.chapter);
                  const isActiveChapter = ch.verses.some(v => v.index === activeIndex);
                  return (
                    <div key={ch.chapter} style={{ marginBottom: '0.5rem' }}>
                      <button
                        onClick={() => toggleChapter(ch.chapter)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%',
                          background: isActiveChapter ? 'rgba(255,215,0,0.18)' : 'transparent',
                          border: 'none',
                          color: isActiveChapter ? 'var(--accent-gold)' : 'var(--accent-gold)',
                          fontWeight: 600,
                          fontSize: '0.78rem',
                          padding: '0.2rem 0',
                          cursor: 'pointer',
                        }}
                      >
                        <span>Chapter {ch.chapter}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {isExpanded ? '−' : '+'}
                        </span>
                      </button>
                      {isExpanded && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem', marginTop: '0.15rem' }}>
                          {ch.verses.map(v => (
                            <button
                              key={`${ch.chapter}-${v.verse}`}
                              onClick={() => scrollToIndex(v.index)}
                              style={{
                                border: 'none',
                                padding: '0.1rem 0.25rem',
                                borderRadius: '999px',
                                fontSize: '0.7rem',
                                backgroundColor: 'rgba(255,255,255,0.06)',
                                color: 'var(--text-slate)',
                                cursor: 'pointer',
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
        )}

        <div style={{ flex: 1 }}>
          <div 
            ref={containerRef}
            className="snap-container"
            onScroll={handleScroll}
          >
            {quotes.map((quote, idx) => (
              <QuoteCard 
                key={quote.id}
                quote={quote} 
                isActive={activeIndex === idx} 
                language={language}
                onViewStart={() => {}} 
                onViewEnd={handleViewEnd}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Auth modal overlay */}
      {showAuthModal && (
        <>
          <div
            className="overlay"
            style={{ background: 'rgba(0,0,0,0.7)', zIndex: 1500 }}
            onClick={() => setShowAuthModal(false)}
          ></div>
          <div style={{ position: 'fixed', inset: 0, zIndex: 1600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {showRegister ? (
              <RegisterForm
                onSuccess={() => {
                  setShowRegister(false);
                  setShowAuthModal(false);
                }}
                onSwitchToLogin={() => setShowRegister(false)}
              />
            ) : (
              <LoginForm
                onSuccess={() => {
                  setShowAuthModal(false);
                }}
                onSwitchToRegister={() => setShowRegister(true)}
              />
            )}
          </div>
        </>
      )}

      <InstallGuide />
      <div className="version-tag">{VERSION_TAG} | {BUILT_BY}</div>
    </div>
  );
};

export default App;