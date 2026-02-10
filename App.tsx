import React, { useState, useEffect, useRef, useCallback } from 'react';
import { QuoteCard } from './components/QuoteCard';
import { InstallGuide } from './components/InstallGuide';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { Quote } from './types';
import { getQuotes, getGitaQuotes } from './services/wisdomService';
import { getCurrentUser, onAuthStateChange, signOut, mapUserToAuthUser } from './services/authService';
import { trackEvent } from './services/analyticsService';
import { AuthUser } from './services/authService';

const VERSION_TAG = "v5.4.0-iphone-ux";
const BUILT_BY = "Developed by Blue Fog Technology";

const App: React.FC = () => {
  const isGitaRoute = typeof window !== 'undefined' && window.location.pathname === '/gita';
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<'en' | 'hi' | 'ta'>('en');
  const [themeWeights, setThemeWeights] = useState<Record<string, number>>({});
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set());
  
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

  // Initial Load (only after authentication)
  useEffect(() => {
    if (!user || authLoading) return;

    const init = async () => {
      try {
        setLoading(true);
        setError(null);
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
  }, [user, authLoading]);

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
    if (user) {
      await trackEvent(user.id, 'logout', {
        timestamp: new Date().toISOString(),
      });
    }
    await signOut();
    setUser(null);
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

  // Show login/register if not authenticated
  if (!user) {
    return showRegister ? (
      <RegisterForm 
        onSuccess={() => setShowRegister(false)} 
        onSwitchToLogin={() => setShowRegister(false)}
      />
    ) : (
      <LoginForm 
        onSuccess={() => {}} 
        onSwitchToRegister={() => setShowRegister(true)}
      />
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

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%', background: 'var(--bg-dark)' }}>
      {/* App Header with Language Picker */}
      <div className="header-logo">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>ॐ</span>
          <span style={{ fontWeight: 800, fontSize: '0.75rem', letterSpacing: '3px' }}>DHARMA</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
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
                  return (
                    <div key={ch.chapter} style={{ marginBottom: '0.5rem' }}>
                      <button
                        onClick={() => toggleChapter(ch.chapter)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%',
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--accent-gold)',
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

      <InstallGuide />
      <div className="version-tag">{VERSION_TAG} | {BUILT_BY}</div>
    </div>
  );
};

export default App;