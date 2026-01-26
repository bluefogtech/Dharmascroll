
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Quote } from './types';
import { fetchInitialQuotes, fetchRecommendedQuotes } from './services/geminiService';
import { QuoteCard } from './components/QuoteCard';

const VERSION_TAG = "v4.4.0-credits";
const BUILT_BY = "Developed by Blue Fog Technology";
const CACHE_KEY = "dharma_quotes_cache";

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const App: React.FC = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [interests, setInterests] = useState<Record<string, number>>({});
  const [error, setError] = useState<{ message: string; isQuota: boolean } | null>(null);
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [showCredits, setShowCredits] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<Set<string>>(new Set());
  const activeStartTimeRef = useRef<number | null>(null);
  const activeIdRef = useRef<string | null>(null);
  const isFetchingRef = useRef(false);
  const hasInitializedRef = useRef(false);

  // Load cache on startup and shuffle it
  useEffect(() => {
    const saved = localStorage.getItem(CACHE_KEY);
    if (saved) {
      try {
        let parsed = JSON.parse(saved) as Quote[];
        if (parsed.length > 0) {
          parsed = shuffleArray(parsed);
          setQuotes(parsed);
          parsed.forEach(q => historyRef.current.add(q.id));
          setActiveId(parsed[0].id);
          activeIdRef.current = parsed[0].id;
          setLoading(false);
          console.log("DharmaScroll: Loaded and shuffled from cache");
        }
      } catch (e) {
        localStorage.removeItem(CACHE_KEY);
      }
    }
  }, []);

  // Save cache whenever quotes change
  useEffect(() => {
    if (quotes.length > 0) {
      localStorage.setItem(CACHE_KEY, JSON.stringify(quotes.slice(0, 50))); 
    }
  }, [quotes]);

  const fetchMore = useCallback(async (currentHistory: string[]) => {
    if (isFetchingRef.current) return;
    
    isFetchingRef.current = true;
    setFetchingMore(true);

    try {
      const more = await fetchRecommendedQuotes(interests, currentHistory);
      if (more && more.length > 0) {
        setQuotes(prev => {
          const unique = more.filter(q => !historyRef.current.has(q.id));
          unique.forEach(q => historyRef.current.add(q.id));
          return [...prev, ...unique];
        });
        setError(null);
      }
    } catch (e: any) {
      const isQuota = e.message.toLowerCase().includes('quota') || e.message.includes('429');
      console.warn("DharmaScroll: Background Fetch Error", e.message);
      
      if (quotes.length === 0) {
        setError({
          message: isQuota 
            ? "Gemini API limits hit. Please wait a minute while the sacred scrolls reset." 
            : `Connection Error: ${e.message}`,
          isQuota
        });
      }
    } finally {
      setFetchingMore(false);
      isFetchingRef.current = false;
    }
  }, [interests, quotes.length]);

  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    async function init() {
      if (quotes.length > 0) {
        fetchMore(Array.from(historyRef.current));
        return;
      }

      try {
        const initial = await fetchInitialQuotes();
        if (initial && initial.length > 0) {
          const shuffledInitial = shuffleArray(initial);
          setQuotes(shuffledInitial);
          shuffledInitial.forEach(q => historyRef.current.add(q.id));
          setActiveId(shuffledInitial[0].id);
          activeIdRef.current = shuffledInitial[0].id;
          activeStartTimeRef.current = Date.now();
          setLoading(false);
          fetchMore(shuffledInitial.map(q => q.id));
        }
      } catch (err: any) {
        const isQuota = err.message.toLowerCase().includes('quota') || err.message.includes('429');
        setError({ 
          message: isQuota ? "Gemini Quota Exceeded. Please try again in 60 seconds." : err.message, 
          isQuota 
        });
        setLoading(false);
      }
    }
    init();
  }, [fetchMore, quotes.length]);

  const updateInterests = useCallback((prevId: string | null) => {
    if (!prevId || !activeStartTimeRef.current) return;
    const durationSec = (Date.now() - activeStartTimeRef.current) / 1000;
    const prevQuote = quotes.find(q => q.id === prevId);
    if (prevQuote && durationSec > 0.5) {
      setInterests(prev => {
        const next = { ...prev };
        prevQuote.themes.forEach(t => next[t] = (next[t] || 0) + durationSec);
        return next;
      });
    }
    activeStartTimeRef.current = Date.now();
  }, [quotes]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, clientHeight, scrollHeight } = containerRef.current;
    const index = Math.round(scrollTop / clientHeight);
    const currentQuote = quotes[index];
    
    if (currentQuote && currentQuote.id !== activeIdRef.current) {
      const prevId = activeIdRef.current;
      activeIdRef.current = currentQuote.id;
      setActiveId(currentQuote.id);
      updateInterests(prevId);
    }

    if (scrollTop + clientHeight > scrollHeight - clientHeight * 5) {
      fetchMore(Array.from(historyRef.current));
    }
  };

  const cycleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'hi' : 'en');
  };

  if (loading && quotes.length === 0) {
    return (
      <div className="fullscreen-center">
        <div className="spinner"></div>
        <p style={{ color: 'var(--accent-gold)', fontStyle: 'italic' }}>Consulting the Scrolls...</p>
      </div>
    );
  }

  if (error && quotes.length === 0) {
    return (
      <div className="fullscreen-center">
        <div className="error-symbol">{error.isQuota ? "⌛" : "ॐ"}</div>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--accent-gold)' }}>
          {error.isQuota ? "Quota Reached" : "Path Interrupted"}
        </h2>
        <p style={{ color: 'var(--text-slate)', maxWidth: '20rem', marginBottom: '2rem', lineHeight: '1.6' }}>{error.message}</p>
        <button onClick={() => window.location.reload()} className="btn-primary">Try Again</button>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'var(--bg-dark)', position: 'relative' }}>
      <div 
        ref={containerRef}
        className="snap-container"
        onScroll={handleScroll}
      >
        {quotes.map((quote) => (
          <QuoteCard 
            key={quote.id} 
            quote={quote} 
            isActive={activeId === quote.id}
            language={language}
            onViewStart={() => {}}
            onViewEnd={() => {}}
          />
        ))}
        {fetchingMore && (
           <div className="snap-item" style={{ height: '100vh', justifyContent: 'center', opacity: 0.15 }}>
             <div className="spinner" style={{ width: '1.25rem', height: '1.25rem' }}></div>
           </div>
        )}
      </div>

      <div className="header-logo">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>ॐ</span>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 800, fontSize: '0.8rem', letterSpacing: '3px' }}>DHARMA SCROLL</span>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', pointerEvents: 'auto' }}>
            <div 
              onClick={cycleLanguage}
              style={{ 
                cursor: 'pointer',
                display: 'flex',
                background: 'rgba(0,0,0,0.5)',
                padding: '6px 14px',
                borderRadius: '24px',
                border: '1px solid rgba(255, 153, 51, 0.4)',
                backdropFilter: 'blur(15px)'
              }}
            >
              <span style={{ fontSize: '0.7rem', color: language === 'en' ? 'var(--accent-gold)' : 'white' }}>EN</span>
              <span style={{ margin: '0 8px', opacity: 0.2 }}>|</span>
              <span style={{ fontSize: '0.75rem', color: language === 'hi' ? 'var(--accent-gold)' : 'white' }}>हिं</span>
            </div>

            <div 
              onClick={() => setShowCredits(true)}
              style={{ 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0,0,0,0.5)',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: '1px solid rgba(255, 153, 51, 0.4)',
                backdropFilter: 'blur(15px)',
                color: 'var(--accent-gold)',
                fontSize: '1.1rem',
                fontWeight: 'bold'
              }}
            >
              i
            </div>
        </div>
      </div>

      {showCredits && (
        <div className="overlay" onClick={() => setShowCredits(false)}>
          <div className="overlay-content" onClick={e => e.stopPropagation()}>
            <h2 className="overlay-title">About DharmaScroll</h2>
            <p className="overlay-text">
              DharmaScroll is a sanctuary for spiritual seekers, bringing the profound wisdom 
              of Indian scriptures to your fingertips in a serene, modern experience.
            </p>
            <p className="overlay-text" style={{ fontSize: '0.9rem', opacity: 0.8 }}>
              Built with care by <a href="https://www.bluefog.co.uk/" target="_blank" rel="noopener noreferrer" className="bluefog-link">Blue Fog Technology</a>.
            </p>
            <div style={{ borderTop: '1px solid rgba(255, 153, 51, 0.2)', paddingTop: '1.5rem', marginTop: '1rem' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-slate)', marginBottom: '1rem' }}>
                  © 2025 Blue Fog Technology. All Rights Reserved.
                </p>
                <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', lineHeight: '1.4' }}>
                  Legal: All scripture quotes and translations are generated using the Gemini API for educational and spiritual guidance. 
                  Accuracy may vary; practitioners should consult official sources for theological depth.
                </p>
            </div>
            <button className="btn-primary" style={{ marginTop: '2rem' }} onClick={() => setShowCredits(false)}>
              Back to Scrolls
            </button>
          </div>
        </div>
      )}

      <div className="version-tag">{VERSION_TAG} | {BUILT_BY}</div>
    </div>
  );
};

export default App;
