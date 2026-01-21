
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Quote } from './types';
import { fetchInitialQuotes, fetchRecommendedQuotes } from './services/geminiService';
import { QuoteCard } from './components/QuoteCard';

const RECO_TIME_THRESHOLD = 3000; // 3 seconds viewing counts as "interested"

const App: React.FC = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [interests, setInterests] = useState<Record<string, number>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  
  const historyRef = useRef<Set<string>>(new Set());
  const viewStartTimes = useRef<Record<string, number>>({});

  useEffect(() => {
    async function init() {
      try {
        const initial = await fetchInitialQuotes();
        setQuotes(initial);
        initial.forEach(q => historyRef.current.add(q.id));
        if (initial.length > 0) setActiveId(initial[0].id);
      } catch (error) {
        console.error("Failed to load quotes", error);
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
    if (fetchingMore) return;
    setFetchingMore(true);

    // Sort themes by interest weight
    // Fix: Cast the entries to ensure the sort values are treated as numbers
    const topThemes = (Object.entries(interests) as [string, number][])
      .sort((a, b) => (b[1] as number) - (a[1] as number))
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
      console.error("Error fetching recommendations", e);
    } finally {
      setFetchingMore(false);
    }
  }, [interests, fetchingMore]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, clientHeight, scrollHeight } = containerRef.current;
    
    // Determine active index based on scroll position
    const index = Math.round(scrollTop / clientHeight);
    if (quotes[index] && quotes[index].id !== activeId) {
      setActiveId(quotes[index].id);
    }

    // Infinite scroll check (buffer 2 items before end)
    if (scrollTop + clientHeight > scrollHeight - clientHeight * 2) {
      fetchMore();
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full bg-slate-900 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
        <p className="text-cyan-200 font-serif italic tracking-widest animate-pulse">Seeking Wisdom...</p>
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
           <div className="snap-item flex items-center justify-center bg-slate-900">
             <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin"></div>
           </div>
        )}
      </div>

      {/* Persistent Navigation/Overlay */}
      <div className="fixed top-0 left-0 right-0 p-6 flex justify-between items-center pointer-events-none z-50">
        <h2 className="text-white/40 font-serif italic text-xl tracking-tighter">DharmaScroll</h2>
        <div className="pointer-events-auto">
           <button className="p-2 bg-white/5 rounded-full backdrop-blur-md">
             <svg className="w-6 h-6 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path></svg>
           </button>
        </div>
      </div>
    </div>
  );
};

export default App;
