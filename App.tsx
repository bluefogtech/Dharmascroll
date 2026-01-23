
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Quote } from './types';
import { fetchInitialQuotes, fetchRecommendedQuotes } from './services/geminiService';
import { QuoteCard } from './components/QuoteCard';

const VERSION_TAG = "v2.1.0-ultra-speed";

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
        // Step 1: Rapid 2-quote fetch
        const initial = await fetchInitialQuotes();
        if (initial && initial.length > 0) {
          setQuotes(initial);
          initial.forEach(q => historyRef.current.add(q.id));
          setActiveId(initial[0].id);
          activeIdRef.current = initial[0].id;
          activeStartTimeRef.current = Date.now();
          setLoading(false); // UI becomes interactive immediately

          // Step 2: Background parallel hydration (fill up more)
          hydrateBuffer(6);
        } else {
          setError("Wisdom unavailable. Retry?");
        }
      } catch (err: any) {
        setError(`Path blocked: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
    fastInit();
  }, []); // Only once on mount

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

    // PRE-FETCH TRIGGER:
    // If we are getting close to the end, fetch more in the background
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
        <p style={{ color: '#22d3ee', fontStyle: 'italic', fontSize: '0.9rem', animation: 'pulse 1.5s infinite' }}>
          Opening the Scrolls...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fullscreen-center">
        <div className="error-symbol">ॐ</div>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Restoring Connection</h2>
        <button onClick={() => window.location.reload()} className="btn-primary">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'black', position: 'relative' }}>
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
           <div className="snap-item" style={{ height: '100vh', justifyContent: 'center', opacity: 0.1 }}>
             <div className="spinner" style={{ width: '1rem', height: '1rem' }}></div>
           </div>
        )}
      </div>

      <div className="header-logo">
        <span style={{ fontWeight: 600, fontSize: '0.9rem', letterSpacing: '2px', opacity: 0.6 }}>DHARMA</span>
        <div 
          onClick={toggleLanguage}
          style={{ 
            pointerEvents: 'auto',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '4px 12px',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(5px)'
          }}
        >
          <span style={{ fontSize: '0.7rem', fontWeight: language === 'en' ? '700' : '400', color: language === 'en' ? '#22d3ee' : 'rgba(255,255,255,0.4)' }}>EN</span>
          <div style={{ width: '1px', height: '8px', background: 'rgba(255,255,255,0.1)' }}></div>
          <span style={{ fontSize: '0.7rem', fontWeight: language === 'hi' ? '700' : '400', color: language === 'hi' ? '#22d3ee' : 'rgba(255,255,255,0.4)' }}>हिं</span>
        </div>
      </div>

      <div className="version-tag">
        {VERSION_TAG}
      </div>
    </div>
  );
};

export default App;
