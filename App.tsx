
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Quote } from './types';
import { fetchInitialQuotes, fetchRecommendedQuotes } from './services/geminiService';
import { QuoteCard } from './components/QuoteCard';
import { SubscriptionPaywall } from './components/SubscriptionPaywall';

const VERSION_TAG = "v2.7.0-premium";
const FREE_LIMIT = 5;

const App: React.FC = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [interests, setInterests] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<'en' | 'hi' | 'ta'>('en');
  
  // Subscription State
  const [isSubscribed, setIsSubscribed] = useState<boolean>(() => {
    return localStorage.getItem('dharma_pro') === 'true';
  });
  const [viewCount, setViewCount] = useState<number>(0);
  const [showPaywall, setShowPaywall] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<Set<string>>(new Set());
  const activeStartTimeRef = useRef<number | null>(null);
  const activeIdRef = useRef<string | null>(null);
  const isFetchingRef = useRef(false);

  const fetchMore = useCallback(async (currentHistory: string[]) => {
    if (isFetchingRef.current || error) return;
    
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
      }
    } catch (e) {
      console.error("DharmaScroll: Fetch More Error", e);
    } finally {
      setFetchingMore(false);
      isFetchingRef.current = false;
    }
  }, [interests, error]);

  useEffect(() => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      setError("API Key missing. Accessing divine knowledge requires a key.");
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
          activeIdRef.current = initial[0].id;
          activeStartTimeRef.current = Date.now();
          setLoading(false);

          fetchMore(initial.map(q => q.id));
        } else {
          setError("The ancient scrolls are temporarily unreachable.");
          setLoading(false);
        }
      } catch (err: any) {
        setError(`A hurdle on the path: ${err.message}`);
        setLoading(false);
      }
    }
    init();
  }, []);

  const handleSubscribe = (plan: 'monthly' | 'annual') => {
    // In a real app, this would trigger Stripe/Apple Pay
    console.log(`Subscribed to ${plan} plan`);
    localStorage.setItem('dharma_pro', 'true');
    setIsSubscribed(true);
    setShowPaywall(false);
  };

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
    if (!containerRef.current || showPaywall) return;
    const { scrollTop, clientHeight, scrollHeight } = containerRef.current;
    
    const index = Math.round(scrollTop / clientHeight);
    const currentQuote = quotes[index];
    
    if (currentQuote && currentQuote.id !== activeIdRef.current) {
      // Check Subscription Limit
      if (!isSubscribed) {
        const nextViewCount = viewCount + 1;
        if (nextViewCount >= FREE_LIMIT) {
          setShowPaywall(true);
          // Snap back to last allowed quote to prevent peeking
          containerRef.current.scrollTo({ top: (FREE_LIMIT - 1) * clientHeight, behavior: 'smooth' });
          return;
        }
        setViewCount(nextViewCount);
      }

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
    const languages: ('en' | 'hi' | 'ta')[] = ['en', 'hi', 'ta'];
    const currentIndex = languages.indexOf(language);
    const nextIndex = (currentIndex + 1) % languages.length;
    setLanguage(languages[nextIndex]);
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
        <p style={{ color: 'var(--text-slate)', maxWidth: '20rem', marginBottom: '2rem', lineHeight: '1.6' }}>{error}</p>
        <button onClick={() => window.location.reload()} className="btn-primary">
          Restore Connection
        </button>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'var(--bg-dark)', position: 'relative' }}>
      {showPaywall && <SubscriptionPaywall onSubscribe={handleSubscribe} />}
      
      <div 
        ref={containerRef}
        className="snap-container"
        onScroll={handleScroll}
        style={{ filter: showPaywall ? 'blur(10px)' : 'none', pointerEvents: showPaywall ? 'none' : 'auto' }}
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
            {isSubscribed && (
              <span style={{ fontSize: '0.5rem', fontWeight: 900, color: 'var(--accent-gold)', letterSpacing: '2px', textTransform: 'uppercase' }}>PRO MEMBER</span>
            )}
          </div>
        </div>
        
        <div 
          onClick={cycleLanguage}
          style={{ 
            pointerEvents: 'auto',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'rgba(0, 0, 0, 0.5)',
            padding: '6px 14px',
            borderRadius: '24px',
            border: '1px solid rgba(255, 153, 51, 0.4)',
            backdropFilter: 'blur(15px)',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            transition: 'all 0.3s'
          }}
        >
          <span style={{ fontSize: '0.7rem', fontWeight: language === 'en' ? '900' : '400', color: language === 'en' ? 'var(--accent-gold)' : 'rgba(255,255,255,0.4)' }}>EN</span>
          <div style={{ width: '1px', height: '8px', background: 'rgba(255,153,51,0.2)' }}></div>
          <span style={{ fontSize: '0.75rem', fontWeight: language === 'hi' ? '900' : '400', color: language === 'hi' ? 'var(--accent-gold)' : 'rgba(255,255,255,0.4)' }}>हिं</span>
          <div style={{ width: '1px', height: '8px', background: 'rgba(255,153,51,0.2)' }}></div>
          <span style={{ fontSize: '0.75rem', fontWeight: language === 'ta' ? '900' : '400', color: language === 'ta' ? 'var(--accent-gold)' : 'rgba(255,255,255,0.4)' }}>த</span>
        </div>
      </div>

      <div className="version-tag">
        {VERSION_TAG}
      </div>
    </div>
  );
};

export default App;
