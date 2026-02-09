import React, { useState, useEffect, useRef, useCallback } from 'react';
import { QuoteCard } from './components/QuoteCard';
import { InstallGuide } from './components/InstallGuide';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { Quote } from './types';
import { getQuotes } from './services/wisdomService';
import { getCurrentUser, onAuthStateChange, signOut, mapUserToAuthUser } from './services/authService';
import { trackEvent } from './services/analyticsService';
import { AuthUser } from './services/authService';

const VERSION_TAG = "v5.4.0-iphone-ux";
const BUILT_BY = "Developed by Blue Fog Technology";

const App: React.FC = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<'en' | 'hi' | 'ta'>('en');
  const [themeWeights, setThemeWeights] = useState<Record<string, number>>({});
  
  // Authentication state
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const fetchedIds = useRef<Set<string>>(new Set());
  const isLoadingMore = useRef(false);

  // Check authentication on mount and listen for changes
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(mapUserToAuthUser(currentUser));
        
        // Track login if user just returned from OAuth
        if (currentUser) {
          const urlParams = new URLSearchParams(window.location.search);
          if (urlParams.get('code') || urlParams.get('access_token')) {
            // User just completed OAuth flow
            await trackEvent(currentUser.id, 'login', {
              method: 'google',
              timestamp: new Date().toISOString(),
            });
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        }
      } catch (err) {
        console.error('Auth check error:', err);
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = onAuthStateChange((user) => {
      setUser(mapUserToAuthUser(user));
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Initial Load (only after authentication)
  useEffect(() => {
    if (!user || authLoading) return;

    const init = async () => {
      try {
        setLoading(true);
        setError(null);
        const initial = await getQuotes(true);
        setQuotes(initial);
        initial.forEach(q => fetchedIds.current.add(q.id));
      } catch (err: any) {
        console.error("Wisdom Fetch Error:", err);
        setError(err.message || "The spiritual wisdom vault is currently inaccessible.");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [user, authLoading]);

  // Infinite Scroll Observer
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollTop, clientHeight } = containerRef.current;
    const newIndex = Math.round(scrollTop / clientHeight);
    
    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex);
    }

    // Load more when 2 items from the end
    if (newIndex >= quotes.length - 2 && !isLoadingMore.current && quotes.length > 0) {
      loadMoreQuotes();
    }
  }, [activeIndex, quotes.length]);

  const loadMoreQuotes = async () => {
    if (isLoadingMore.current) return;
    isLoadingMore.current = true;
    try {
      const more = await getQuotes(false, { 
        weights: themeWeights, 
        history: Array.from(fetchedIds.current) 
      });
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

  const handleLogout = async () => {
    if (user) {
      await trackEvent(user.id, 'logout', {
        timestamp: new Date().toISOString(),
      });
    }
    await signOut();
    setUser(null);
  };

  // Show auth loading
  if (authLoading) {
    return (
      <div className="fullscreen-center">
        <div className="spinner"></div>
        <p style={{ color: 'var(--accent-gold)', letterSpacing: '0.15em', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600 }}>
          Authenticating...
        </p>
      </div>
    );
  }

  // Show login/register if not authenticated
  if (!user) {
    return showRegister ? (
      <RegisterForm 
        onSuccess={() => setShowRegister(false)} 
        onSwitchToLogin={() => setShowRegister(false)}
      />
    ) : (
      <LoginForm 
        onSuccess={() => {}} 
        onSwitchToRegister={() => setShowRegister(true)}
      />
    );
  }

  if (loading) {
    return (
      <div className="fullscreen-center">
        <div className="spinner"></div>
        <p style={{ color: 'var(--accent-gold)', letterSpacing: '0.15em', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600 }}>
          Connecting to the Wisdom Vault...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fullscreen-center">
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📿</div>
        <h2 style={{ color: 'var(--accent-gold)', marginBottom: '1.5rem', fontFamily: 'Playfair Display' }}>Silence in the Temple</h2>
        <p style={{ 
          color: 'var(--text-slate)', 
          marginBottom: '2.5rem', 
          maxWidth: '320px', 
          lineHeight: '1.6',
          fontSize: '0.95rem'
        }}>
          {error}
        </p>
        <button className="btn-primary" onClick={() => window.location.reload()}>
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%', background: 'var(--bg-dark)' }}>
      {/* App Header with Language Picker */}
      <div className="header-logo">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>ॐ</span>
          <span style={{ fontWeight: 800, fontSize: '0.75rem', letterSpacing: '3px' }}>DHARMA</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="lang-picker">
            <button 
              className={`lang-option ${language === 'en' ? 'active' : ''}`}
              onClick={() => setLanguage('en')}
            >
              EN
            </button>
            <button 
              className={`lang-option ${language === 'hi' ? 'active' : ''}`}
              onClick={() => setLanguage('hi')}
            >
              हिन्दी
            </button>
            <button 
              className={`lang-option ${language === 'ta' ? 'active' : ''}`}
              onClick={() => setLanguage('ta')}
            >
              தமிழ்
            </button>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
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