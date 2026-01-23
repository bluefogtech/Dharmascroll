import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Quote } from './types';
import { fetchInitialQuotes, fetchRecommendedQuotes } from './services/geminiService';
import { QuoteCard } from './components/QuoteCard';

const VERSION_TAG = "v2.2.0-dharma-theme";

const App: React.FC = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [interests, setInterests] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  
  const containerRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<Set<string>>(new Set());
  const activeStartTimeRef = useRef<number | null>(null);
  const activeIdRef = useRef<string | null>(null);

  // Background fetcher - refined for parallelism
  const hydrateBuffer = useCallback(async (count = 5) => {
    if (fetchingMore) return;
    setFetchingMore(true);

    try {
      const more = await fetchRecommendedQuotes(interests, Array.from(historyRef.current), count);
      if (more && more.length > 0) {
        setQuotes(prev => {
          const unique = more.filter(q => !historyRef.current.has(q.id));
          unique.forEach(q => historyRef.current.add(q.id));
          return [...prev, ...unique];
        });
      }
    } catch (e) {
      console.error("Background Hydration Error", e);
    } finally {
      setFetchingMore(false);
    }
  }, [interests, fetchingMore]);

  // Initial Data
  useEffect(() => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      setError("API Key missing.");
      setLoading(false);
      return;
    }

    async function fastInit() {
      try {
        const initial = await fetchInitialQuotes();
        if (initial && initial.length > 0) {
          setQuotes(initial);
          initial.forEach(q => historyRef.current.add(q.id));
          setActiveId(initial[0].id);
          activeIdRef.current = initial[0].id;
          activeStartTimeRef.current = Date.now();
          setLoading(false);

          // Background parallel hydration
          hydrateBuffer(6);
        } else {
          setError("The ancient scrolls are temporarily unreachable.");
        }
      } catch (err: any) {
        setError(`A hurdle on the path: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
    fastInit();
  }, [hydrateBuffer]);

  const updateInterests = useCallback((prevId: string | null) => {
    if (!prevId || !activeStartTimeRef.current) return;
    
    const durationMs = Date.now() - activeStartTimeRef.current;
    const durationSec = durationMs / 1000;
    
    const prevQuote = quotes.find(q => q.id === prevId);
    if (prevQuote && durationSec > 0.5) {
      setInterests(prev => {
        const next = { ...prev };
        prevQuote.themes.forEach(t => {
          next[t] = (next[t] || 0) + durationSec;
        });
        return next;
      });
    }
    
    activeStartTimeRef.current = Date.now();
  }, [quotes]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, clientHeight } = containerRef.current;
    
    const index = Math.round(scrollTop / clientHeight);
    const currentQuote = quotes[index];
    
    if (currentQuote && currentQuote.id !== activeIdRef.current) {
      const prevId = activeIdRef.current;
      activeIdRef.current = currentQuote.id;
      setActiveId(currentQuote.id);
      updateInterests(prevId);
    }

    // PRE-FETCH TRIGGER
    if (quotes.length > 0 && index >= quotes.length - 2) {
      hydrateBuffer(5);
    }
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'hi' : 'en');
  };

  if (loading) {
    return (
      <div className="fullscreen-center">
        <div className="spinner"></div>
        <p style={{ color: 'var(--accent-gold)', fontStyle: 'italic', fontSize: '1rem', letterSpacing: '0.1em', animation: 'pulse 1.5s infinite' }}>
          Opening the Sacred Scrolls...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fullscreen-center">
        <div className="error-symbol">ॐ</div>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--accent-gold)' }}>Path Interrupted</h2>
        <p style={{ color: 'var(--text-slate)', maxWidth: '18rem', marginBottom: '2rem', lineHeight: '1.6' }}>{error}</p>
        <button onClick={() => window.location.reload()} className="btn-primary">
          Restore Connection
        </button>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>ॐ</span>
          <span style={{ fontWeight: 800, fontSize: '0.8rem', letterSpacing: '3px' }}>DHARMA SCROLL</span>
        </div>
        
        <div 
          onClick={toggleLanguage}
          style={{ 
            pointerEvents: 'auto',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            background: 'rgba(0, 0, 0, 0.5)',
            padding: '6px 16px',
            borderRadius: '24px',
            border: '1px solid rgba(255, 153, 51, 0.4)',
            backdropFilter: 'blur(15px)',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            transition: 'all 0.3s'
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: language === 'en' ? '800' : '400', color: language === 'en' ? 'var(--accent-gold)' : 'rgba(255,255,255,0.4)' }}>EN</span>
          <div style={{ width: '1px', height: '10px', background: 'rgba(255,153,51,0.3)' }}></div>
          <span style={{ fontSize: '0.8rem', fontWeight: language === 'hi' ? '800' : '400', color: language === 'hi' ? 'var(--accent-gold)' : 'rgba(255,255,255,0.4)' }}>हिं</span>
        </div>
      </div>

      <div className="version-tag">
        {VERSION_TAG}
      </div>
    </div>
  );
};

export default App;