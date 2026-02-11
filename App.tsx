import React, { useState, useEffect, useRef, useCallback } from 'react';
import { QuoteCard } from './components/QuoteCard';
import { ContactForm } from './components/ContactForm';
import { Quote } from './types';
import { getQuotes, getGitaQuotes } from './services/wisdomService';
import { openDonatePage, getDonateLink, getDonateLinkFromConfig } from './services/donationService';

const VERSION_TAG = "v5.4.0-iphone-ux";
const BUILT_BY = "Developed by Blue Fog Technology";

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
  const [donateLink, setDonateLink] = useState<string | null>(() => getDonateLink());
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);
  const [contactFormOpen, setContactFormOpen] = useState(false);

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
          background: 'linear-gradient(135deg, #1a0f0a 0%, #2d1a14 20%, #4a2c1a 40%, #6b3e26 60%, #4a2c1a 80%, #2d1a14 100%)',
          backgroundAttachment: 'fixed',
          fontFamily: '"Georgia", serif',
          color: 'var(--text-slate)',
        }}
      >
        {/* Header: brand – scrolls with content on landing so hero text doesn't hide under it */}
        <div className="header-logo" style={{ position: 'relative', pointerEvents: 'auto', padding: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>ॐ</span>
            <span style={{ fontWeight: 800, fontSize: '0.75rem', letterSpacing: '3px' }}>DHARMA</span>
          </div>
        </div>

        {/* Main hero + cards */}
        <div style={{ textAlign: 'center', padding: '0 16px 2rem' }}>
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
                onClick={() => {
                  window.location.href = '/gita';
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
                Begin Journey
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
            Quotes sourced from Bhagavad Gita translations and public spiritual sources. For spiritual learning only.
          </p>
        </div>

        {/* Version tag and contact – scrolls with content so disclaimer/text isn't hidden */}
        <div className="version-tag" style={{ 
          position: 'relative',
          display: 'flex', 
          alignItems: 'center', 
          gap: '1rem', 
          flexWrap: 'wrap', 
          justifyContent: 'flex-start',
          padding: '1rem',
          marginTop: '2rem',
        }}>
          <span>{BUILT_BY}</span>
          <img 
            src="/bluefog-logo.png" 
            alt="Blue Fog Technology" 
            style={{ height: '1rem', width: 'auto', objectFit: 'contain' }}
          />
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
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.opacity = '0.8';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.opacity = '1';
            }}
          >
            Get in Touch
          </button>
        </div>
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
    <div style={{ position: 'relative', height: '100%', width: '100%', background: 'var(--bg-dark)' }}>
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
        {/* Top row: Brand + Home + Language */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>ॐ</span>
            <span style={{ fontWeight: 800, fontSize: '0.75rem', letterSpacing: '3px' }}>DHARMA</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.4rem' : '0.75rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
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

      {/* Main content area: left chapter sidebar (Gita) + verse content */}
      <div style={{ display: 'flex', height: '100%', paddingTop: '64px' }}>
        {isGitaRoute && (
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
        <div style={{ flex: 1, width: '100%', minWidth: 0 }} className={isGitaRoute ? 'gita-verse-area' : ''}>
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

      <div className="version-tag" style={{ 
        position: 'relative',
        display: 'flex', 
        alignItems: 'center', 
        gap: '1rem', 
        flexWrap: 'wrap', 
        justifyContent: 'flex-start',
        padding: '1rem',
        marginTop: '2rem',
      }}>
        <span>{BUILT_BY}</span>
        <img 
          src="/bluefog-logo.png" 
          alt="Blue Fog Technology" 
          style={{ height: '1rem', width: 'auto', objectFit: 'contain' }}
        />
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
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.opacity = '0.8';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.opacity = '1';
          }}
        >
          Get in Touch
        </button>
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