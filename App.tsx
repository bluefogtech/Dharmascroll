import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Quote } from './types';
import { fetchInitialQuotes, fetchRecommendedQuotes } from './services/geminiService';
import { QuoteCard } from './components/QuoteCard';

const RECO_TIME_THRESHOLD = 3000;
const VERSION_TAG = "v1.4.0-production-fix";

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
    
    // Check if API key exists in the environment
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
      <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
        <p className="text-cyan-200 font-serif italic tracking-widest animate-pulse">Unlocking Ancient Wisdom...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-8 text-center space-y-6">
        <div className="text-amber-500 text-6xl drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">ॐ</div>
        <h2 className="text-white font-serif text-2xl">A small hurdle on the path</h2>
        <p className="text-slate-400 max-w-sm leading-relaxed">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-8 py-3 bg-cyan-900/40 hover:bg-cyan-800/60 text-white rounded-full font-medium transition-all border border-cyan-500/30"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-black relative">
      <div 
        ref={containerRef}
        className="snap-container h-screen"
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
           <div className="snap-item flex items-center justify-center bg-slate-950">
             <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin"></div>
           </div>
        )}
      </div>

      <div className="fixed top-0 left-0 right-0 p-6 flex justify-between items-center pointer-events-none z-50">
        <h2 className="text-white/20 font-serif italic text-xl tracking-tighter select-none">DharmaScroll</h2>
      </div>

      {/* Deployment Verification Tag */}
      <div className="fixed bottom-2 right-4 pointer-events-none z-50">
        <span className="text-[10px] text-white/20 font-mono tracking-widest uppercase">
          {VERSION_TAG}
        </span>
      </div>
    </div>
  );
};

export default App;