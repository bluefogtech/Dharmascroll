import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Quote } from './types';
import { fetchInitialQuotes, fetchRecommendedQuotes } from './services/geminiService';
import { QuoteCard } from './components/QuoteCard';

const VERSION_TAG = "v1.9.0-reverted-stable";

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
  
  // Guard to prevent concurrent fetches causing rate limits and loop issues
  const isFetchingRef = useRef(false);

  // Initialize Data
  useEffect(() => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      setError("API Key missing. Please check your environment variables.");
      setLoading(false);
      return;
    }

    async function init() {
      try {
        const initial = await fetchInitialQuotes();
        if (initial && initial.length > 0) {
          const shuffled = [...initial].sort(() => Math.random() - 0.5);
          setQuotes(shuffled);
          shuffled.forEach(q => historyRef.current.add(q.id));
          setActiveId(shuffled[0].id);
          activeIdRef.current = shuffled[0].id;
          activeStartTimeRef.current = Date.now();
        } else {
          setError("Failed to load initial wisdom. Please try again.");
        }
      } catch (err: any) {
        setError(`Connection failed: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

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

  const fetchMore = useCallback(async () => {
    if (isFetchingRef.current || error) return;
    
    isFetchingRef.current = true;
    setFetchingMore(true);

    try {
      const more = await fetchRecommendedQuotes(interests, Array.from(historyRef.current));
      if (more && more.length > 0) {
        setQuotes(prev => {
          const unique = more.filter(q => !historyRef.current.has(q.id));
          unique.forEach(q => historyRef.current.add(q.id));
          return [...prev, ...unique];
        });
      }
    } catch (e) {
      console.error("DharmaScroll: Fetch More Error", e);
    } finally {
      setFetchingMore(false);
      isFetchingRef.current = false;
    }
  }, [interests, error]);

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

    if (scrollTop + clientHeight > scrollHeight - clientHeight * 1.5) {
      fetchMore();
    }
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'hi' : 'en');
  };

  if (loading) {
    return (
      <div className="fullscreen-center">
        <div className="spinner"></div>
        <p style={{ color: 'var(--accent-cyan-light)', fontStyle: 'italic', letterSpacing: '0.1em', animation: 'pulse 2s infinite' }}>
          Unlocking Ancient Wisdom...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fullscreen-center">
        <div className="error-symbol">ॐ</div>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>A small hurdle on the path</h2>
        <p style={{ color: 'var(--text-slate)', maxWidth: '20rem', marginBottom: '2rem', lineHeight: '1.6' }}>{error}</p>
        <button onClick={() => window.location.reload()} className="btn-primary">
          Try Again
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
           <div className="snap-item" style={{ backgroundColor: 'var(--bg-dark)', justifyContent: 'center' }}>
             <div className="spinner" style={{ width: '2rem', height: '2rem' }}></div>
           </div>
        )}
      </div>

      <div className="header-logo">
        <span style={{ fontWeight: 600 }}>DharmaScroll</span>
        <div 
          onClick={toggleLanguage}
          style={{ 
            pointerEvents: 'auto',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '4px 12px',
            borderRadius: '20px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            transition: 'all 0.3s'
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: language === 'en' ? 'bold' : 'normal', color: language === 'en' ? 'var(--accent-cyan-light)' : 'white' }}>EN</span>
          <div style={{ width: '1px', height: '12px', background: 'rgba(255,255,255,0.3)' }}></div>
          <span style={{ fontSize: '0.75rem', fontWeight: language === 'hi' ? 'bold' : 'normal', color: language === 'hi' ? 'var(--accent-cyan-light)' : 'white' }}>हिं</span>
        </div>
      </div>

      <div className="version-tag">
        {VERSION_TAG}
      </div>
    </div>
  );
};

export default App;