
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { QuoteCard } from './components/QuoteCard';
import { InstallGuide } from './components/InstallGuide';
import { Quote } from './types';
import { fetchInitialQuotes, fetchRecommendedQuotes } from './services/geminiService';

const VERSION_TAG = "v5.0.0-pwa";
const BUILT_BY = "Developed by Blue Fog Technology";

const App: React.FC = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [themeWeights, setThemeWeights] = useState<Record<string, number>>({});
  
  const containerRef = useRef<HTMLDivElement>(null);
  const fetchedIds = useRef<Set<string>>(new Set());
  const isLoadingMore = useRef(false);

  // Initial Load
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const initial = await fetchInitialQuotes();
        setQuotes(initial);
        initial.forEach(q => fetchedIds.current.add(q.id));
        setLoading(false);
      } catch (err: any) {
        setError(err.message || "The ancient scrolls are currently unreachable.");
        setLoading(false);
      }
    };
    init();
  }, []);

  // Infinite Scroll Observer
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollTop, clientHeight } = containerRef.current;
    const newIndex = Math.round(scrollTop / clientHeight);
    
    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex);
    }

    // Load more when 2 items from the end
    if (newIndex >= quotes.length - 2 && !isLoadingMore.current) {
      loadMoreQuotes();
    }
  }, [activeIndex, quotes.length]);

  const loadMoreQuotes = async () => {
    if (isLoadingMore.current) return;
    isLoadingMore.current = true;
    try {
      const more = await fetchRecommendedQuotes(themeWeights, Array.from(fetchedIds.current));
      const uniqueMore = more.filter(q => !fetchedIds.current.has(q.id));
      uniqueMore.forEach(q => fetchedIds.current.add(q.id));
      setQuotes(prev => [...prev, ...uniqueMore]);
    } catch (err) {
      console.error("Failed to fetch more wisdom:", err);
    } finally {
      isLoadingMore.current = false;
    }
  };

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
          Opening the Sacred Gates...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fullscreen-center">
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📿</div>
        <h2 style={{ color: 'var(--accent-gold)', marginBottom: '1rem', fontFamily: 'Playfair Display' }}>Silence in the Temple</h2>
        <p style={{ color: 'var(--text-slate)', marginBottom: '2rem', maxWidth: '300px' }}>{error}</p>
        <button className="btn-primary" onClick={() => window.location.reload()}>Seek Wisdom Again</button>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%', background: 'var(--bg-dark)' }}>
      {/* App Header */}
      <div className="header-logo">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
          <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>ॐ</span>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 800, fontSize: '0.85rem', letterSpacing: '4px' }}>DHARMA SCROLL</span>
          </div>
        </div>
        
        <button 
          onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
          style={{ 
            background: 'rgba(255, 153, 51, 0.2)', 
            border: '1px solid rgba(255, 153, 51, 0.4)',
            color: 'var(--accent-gold)',
            padding: '0.5rem 1.2rem',
            borderRadius: '99px',
            fontSize: '0.75rem',
            fontWeight: 800,
            cursor: 'pointer',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
          }}
        >
          {language === 'en' ? 'हिन्दी' : 'ENGLISH'}
        </button>
      </div>

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

      <InstallGuide />
      <div className="version-tag">{VERSION_TAG} | {BUILT_BY}</div>
    </div>
  );
};

export default App;
