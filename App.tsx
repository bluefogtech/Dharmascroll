import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Quote } from './types';
import { fetchInitialQuotes, fetchRecommendedQuotes } from './services/geminiService';
import { QuoteCard } from './components/QuoteCard';

const VERSION_TAG = "v1.6.0-dwell-reco";

const App: React.FC = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [interests, setInterests] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<Set<string>>(new Set());
  const activeStartTimeRef = useRef<number | null>(null);
  const activeIdRef = useRef<string | null>(null);

  // Initialize
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
          // Shuffle the initial batch locally just in case
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

  // Update interest weights when activeId changes
  const updateInterests = useCallback((prevId: string | null) => {
    if (!prevId || !activeStartTimeRef.current) return;
    
    const durationMs = Date.now() - activeStartTimeRef.current;
    const durationSec = durationMs / 1000;
    
    const prevQuote = quotes.find(q => q.id === prevId);
    if (prevQuote && durationSec > 0.5) { // Minimum threshold to count as interest
      setInterests(prev => {
        const next = { ...prev };
        prevQuote.themes.forEach(t => {
          // We add the actual time spent to the theme weight
          next[t] = (next[t] || 0) + durationSec;
        });
        console.log(`[Interest Updated] Spent ${durationSec.toFixed(2)}s on "${prevId}". New Weights:`, next);
        return next;
      });
    }
    
    activeStartTimeRef.current = Date.now();
  }, [quotes]);

  const fetchMore = useCallback(async () => {
    if (fetchingMore || error) return;
    setFetchingMore(true);

    try {
      // Pass the actual weighted interests to the engine
      const more = await fetchRecommendedQuotes(interests, Array.from(historyRef.current));
      setQuotes(prev => {
        const unique = more.filter(q => !historyRef.current.has(q.id));
        unique.forEach(q => historyRef.current.add(q.id));
        return [...prev, ...unique];
      });
    } catch (e) {
      console.error("DharmaScroll: Fetch More Error", e);
    } finally {
      setFetchingMore(false);
    }
  }, [interests, fetchingMore, error]);

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

    // Pre-fetch more when reaching near the end
    if (scrollTop + clientHeight > scrollHeight - clientHeight * 1.5) {
      fetchMore();
    }
  };

  if (loading) {
    return (
      <div className="fullscreen-center">
        <div className="spinner"></div>
        <p style={{ color: '#22d3ee', fontStyle: 'italic', letterSpacing: '0.1em', animation: 'pulse 2s infinite' }}>
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
        <p style={{ color: '#94a3b8', maxWidth: '20rem', marginBottom: '2rem', lineHeight: '1.6' }}>{error}</p>
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
            onViewStart={() => {}} // Handled by App scroll logic for better precision
            onViewEnd={() => {}}   // Handled by App scroll logic for better precision
          />
        ))}
        {fetchingMore && (
           <div className="snap-item" style={{ backgroundColor: '#020617', justifyContent: 'center' }}>
             <div className="spinner" style={{ width: '2rem', height: '2rem' }}></div>
           </div>
        )}
      </div>

      <div className="header-logo">
        <span>DharmaScroll</span>
      </div>

      <div className="version-tag">
        {VERSION_TAG}
      </div>
    </div>
  );
};

export default App;