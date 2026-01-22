import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Quote } from './types';
import { fetchInitialQuotes, fetchRecommendedQuotes } from './services/geminiService';
import { QuoteCard } from './components/QuoteCard';

const RECO_TIME_THRESHOLD = 3000;
const VERSION_TAG = "v1.5.0-native-css-fix";

const App: React.FC = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [interests, setInterests] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<Set<string>>(new Set());
  const viewStartTimes = useRef<Record<string, number>>({});

  useEffect(() => {
    console.log(`%c[DharmaScroll] System: Deployment Verified (${VERSION_TAG})`, "color: #06b6d4; font-weight: bold; font-size: 14px;");
    
    const apiKey = process.env.API_KEY;
    if (!apiKey || apiKey === "") {
      setError("API Key missing. Please ensure API_KEY is set in your environment variables and redeploy.");
      setLoading(false);
      return;
    }

    async function init() {
      try {
        const initial = await fetchInitialQuotes();
        if (initial && initial.length > 0) {
          setQuotes(initial);
          initial.forEach(q => historyRef.current.add(q.id));
          setActiveId(initial[0].id);
        } else {
          setError("The wisdom engine returned an empty response. Please check your network or API settings.");
        }
      } catch (err: any) {
        console.error("DharmaScroll: Init Error", err);
        setError(`Initialization Failed: ${err.message || "Unknown Error"}.`);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const handleViewStart = useCallback((id: string) => {
    viewStartTimes.current[id] = Date.now();
  }, []);

  const handleViewEnd = useCallback(async (id: string) => {
    const start = viewStartTimes.current[id];
    if (!start) return;

    const duration = Date.now() - start;
    if (duration > RECO_TIME_THRESHOLD) {
      const quote = quotes.find(q => q.id === id);
      if (quote) {
        setInterests(prev => {
          const next = { ...prev };
          quote.themes.forEach(t => {
            next[t] = (next[t] || 0) + 1;
          });
          return next;
        });
      }
    }
  }, [quotes]);

  const fetchMore = useCallback(async () => {
    if (fetchingMore || error) return;
    setFetchingMore(true);

    const topThemes = (Object.entries(interests) as [string, number][])
      .sort((a, b) => b[1] - a[1])
      .map(([theme]) => theme)
      .slice(0, 3);

    try {
      const more = await fetchRecommendedQuotes(topThemes, Array.from(historyRef.current));
      setQuotes(prev => {
        const unique = more.filter(q => !historyRef.current.has(q.id));
        unique.forEach(q => historyRef.current.add(q.id));
        return [...prev, ...unique];
      });
    } catch (e) {
      console.error("DharmaScroll: Error fetching more", e);
    } finally {
      setFetchingMore(false);
    }
  }, [interests, fetchingMore, error]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, clientHeight, scrollHeight } = containerRef.current;
    
    const index = Math.round(scrollTop / clientHeight);
    if (quotes[index] && quotes[index].id !== activeId) {
      setActiveId(quotes[index].id);
    }

    if (scrollTop + clientHeight > scrollHeight - clientHeight * 2) {
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
            onViewStart={handleViewStart}
            onViewEnd={handleViewEnd}
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

      {/* Deployment Verification Tag */}
      <div className="version-tag">
        {VERSION_TAG}
      </div>
    </div>
  );
};

export default App;