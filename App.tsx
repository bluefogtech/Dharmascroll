import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Quote } from './types';
import { fetchInitialQuotes, fetchRecommendedQuotes } from './services/geminiService';
import { QuoteCard } from './components/QuoteCard';

const VERSION_TAG = "v1.7.1-audio-fix";

// Primary source: A direct link to a Gayatri Mantra recording
const MANTRA_URL = "https://ia800305.us.archive.org/15/items/GayatriMantra_201601/Gayatri%20Mantra.mp3";
// Fallback source: A highly reliable meditative pad from Google's sound library
const FALLBACK_URL = "https://actions.google.com/sounds/v1/meditation/meditation_pad.ogg";

const App: React.FC = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [interests, setInterests] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<Set<string>>(new Set());
  const activeStartTimeRef = useRef<number | null>(null);
  const activeIdRef = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Audio with Error Handling
  useEffect(() => {
    const audio = new Audio(MANTRA_URL);
    audio.loop = true;
    audio.preload = "auto";
    audioRef.current = audio;

    const handleAudioError = () => {
      console.warn("DharmaScroll: Primary audio failed. Switching to meditative fallback.");
      if (audioRef.current && audioRef.current.src !== FALLBACK_URL) {
        audioRef.current.src = FALLBACK_URL;
        audioRef.current.load();
        // If it was supposed to be playing, resume with fallback
        if (isAudioPlaying) {
          audioRef.current.play().catch(err => console.error("Fallback audio failed:", err));
        }
      }
    };

    audio.addEventListener('error', handleAudioError);

    return () => {
      audio.removeEventListener('error', handleAudioError);
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  const toggleAudio = () => {
    if (!audioRef.current) return;
    
    if (isAudioPlaying) {
      audioRef.current.pause();
      setIsAudioPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setIsAudioPlaying(true))
        .catch(e => {
          console.error("Audio playback failed:", e);
          // Trigger fallback manually if play fails immediately
          if (audioRef.current && audioRef.current.src !== FALLBACK_URL) {
            audioRef.current.src = FALLBACK_URL;
            audioRef.current.play()
              .then(() => setIsAudioPlaying(true))
              .catch(err => console.error("Final audio failure:", err));
          }
        });
    }
  };

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
    if (fetchingMore || error) return;
    setFetchingMore(true);

    try {
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
            onViewStart={() => {}}
            onViewEnd={() => {}}
          />
        ))}
        {fetchingMore && (
           <div className="snap-item" style={{ backgroundColor: '#020617', justifyContent: 'center' }}>
             <div className="spinner" style={{ width: '2rem', height: '2rem' }}></div>
           </div>
        )}
      </div>

      <div className="header-logo">
        <span style={{ fontWeight: 600 }}>DharmaScroll</span>
        <button 
          onClick={toggleAudio}
          style={{ 
            pointerEvents: 'auto',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: isAudioPlaying ? '#22d3ee' : 'rgba(255,255,255,0.4)',
            transition: 'all 0.3s ease'
          }}
        >
          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {isAudioPlaying ? 'Chanting' : 'Muted'}
          </span>
          <div style={{ 
            width: '32px', 
            height: '32px', 
            borderRadius: '50%', 
            background: isAudioPlaying ? 'rgba(34, 211, 238, 0.1)' : 'rgba(255,255,255,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: isAudioPlaying ? '1px solid rgba(34, 211, 238, 0.3)' : '1px solid rgba(255,255,255,0.1)',
            boxShadow: isAudioPlaying ? '0 0 10px rgba(34, 211, 238, 0.2)' : 'none'
          }}>
            <span style={{ fontSize: '1.2rem', marginTop: '-2px' }}>ॐ</span>
          </div>
        </button>
      </div>

      <div className="version-tag">
        {VERSION_TAG}
      </div>
    </div>
  );
};

export default App;