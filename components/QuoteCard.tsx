import React, { useEffect, useRef, useState } from 'react';
import { Quote } from '../types';

interface QuoteCardProps {
  quote: Quote;
  isActive: boolean;
  language: 'en' | 'hi' | 'ta';
  onViewStart: (id: string) => void;
  onViewEnd: (id: string) => void;
}

export const QuoteCard: React.FC<QuoteCardProps> = ({ quote, isActive, language, onViewStart, onViewEnd }) => {
  const startTimeRef = useRef<number | null>(null);
  const textRef = useRef<HTMLHeadingElement>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [popHeart, setPopHeart] = useState(false);
  const [popShare, setPopShare] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [dynamicFontSize, setDynamicFontSize] = useState<string>('');

  useEffect(() => {
    if (isActive) {
      startTimeRef.current = Date.now();
      onViewStart(quote.id);
    } else {
      if (startTimeRef.current) {
        onViewEnd(quote.id);
        startTimeRef.current = null;
      }
      setShowShareSheet(false);
    }
  }, [isActive, quote.id]);

  // Dynamic font sizing based on text length and available space
  useEffect(() => {
    const adjustFontSize = () => {
      if (!textRef.current) return;
      const text = getDisplayText();
      const textLength = text.length;
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const isMobile = viewportWidth < 768;
      
      // Calculate available space for translation text only (match CSS: scroll area 100vh-224px on mobile, minus reference + sanskrit)
      const headerSpace = isMobile ? 90 : 100;
      const sanskritSpace = quote.sanskrit ? (isMobile ? 40 : 50) : 0;
      const referenceAndGaps = isMobile ? 110 : 120; // reference-top + tags + gaps
      const bottomReserved = isMobile ? 50 : 70;     // dash + padding under quote
      const scrollAreaReserved = isMobile ? 224 : 0; // CSS max-height: 100vh - 224px on mobile
      const reservedForTranslation = isMobile
        ? scrollAreaReserved + referenceAndGaps + sanskritSpace + bottomReserved
        : headerSpace + referenceAndGaps + sanskritSpace + bottomReserved;
      const availableHeight = viewportHeight - reservedForTranslation;

      // Base font size - conservative start
      let baseSize = isMobile ? 1.8 : 1.85;
      if (language === 'ta') baseSize = isMobile ? 1.5 : 1.6;
      if (language === 'hi') baseSize = isMobile ? 1.8 : 1.85;

      // More aggressive scaling for long text so it doesn't clip
      if (textLength > 400) baseSize *= 0.52;
      else if (textLength > 300) baseSize *= 0.62;
      else if (textLength > 200) baseSize *= 0.72;
      else if (textLength > 150) baseSize *= 0.80;
      else if (textLength > 100) baseSize *= 0.88;
      else if (textLength > 50) baseSize *= 0.94;

      // Calculate maximum size based on available height for translation block
      const avgCharsPerLine = isMobile ? Math.max(22, Math.min(38, viewportWidth / 11)) : 50;
      const estimatedLines = Math.ceil(textLength / avgCharsPerLine);
      const lineHeight = 1.35; // Match CSS line-height
      const spacingBetweenLines = 0.2;

      // Use 62% of available height so text reliably fits (buffer for dash + no clip)
      const maxTextHeight = availableHeight * 0.62;
      const maxSizeFromHeight = maxTextHeight / (estimatedLines * lineHeight * (1 + spacingBetweenLines));
      
      // Also consider width constraints
      const maxSizeFromWidth = isMobile 
        ? (viewportWidth * 0.85) / 8 // Rough estimate: ~8 characters per rem
        : Infinity;
      
      // Use the most restrictive constraint
      const maxSize = Math.min(maxSizeFromHeight, maxSizeFromWidth);
      
      // Apply the maximum constraint
      baseSize = Math.min(baseSize, maxSize);
      
      // Scale based on viewport width for better mobile optimization
      if (isMobile) {
        const widthFactor = Math.min(viewportWidth / 375, 1.05);
        baseSize *= widthFactor;
        
        if (viewportWidth < 400) {
          baseSize *= 0.92;
        }
      }
      
      // Final clamp with safe limits
      const minSize = isMobile ? 1.0 : 1.25;
      const maxAllowedSize = isMobile ? 2.5 : 2.6; // Reduced max to prevent overlap
      const finalSize = Math.max(minSize, Math.min(baseSize, maxAllowedSize));
      
      setDynamicFontSize(`${finalSize}rem`);

      // Safety check: use translation block (parent of h1) as container; reduce font if text would clip
      const runOverflowCheck = (attempt: number) => {
        if (!textRef.current) return;
        const translationBlock = textRef.current.parentElement; // .quote-translation-block
        if (!translationBlock) return;
        const actualHeight = textRef.current.scrollHeight;
        const containerHeight = translationBlock.clientHeight;
        const maxAllowed = containerHeight * 0.88; // leave room for dash and no clip
        if (actualHeight > maxAllowed && finalSize > minSize) {
          const reduced = Math.max(minSize, finalSize * (attempt === 0 ? 0.82 : 0.75));
          setDynamicFontSize(`${reduced}rem`);
          if (attempt === 0) setTimeout(() => runOverflowCheck(1), 150);
        }
      };
      setTimeout(() => runOverflowCheck(0), 120);
    };
    
    // Use requestAnimationFrame for smoother updates
    const timeoutId = setTimeout(() => {
      adjustFontSize();
    }, 0);
    
    window.addEventListener('resize', adjustFontSize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', adjustFontSize);
    };
  }, [quote.text, quote.hindi, quote.tamil, quote.sanskrit, language, isActive]);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    if (!isLiked) {
      setPopHeart(true);
      setTimeout(() => setPopHeart(false), 500);
      if (navigator.vibrate) navigator.vibrate(10);
    }
  };

  const getShareText = () => {
    const text = getDisplayText();
    return `"${text}" — ${quote.source}\n\nDaily Wisdom from DharmaScroll. ॐ`;
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setPopShare(true);
    setTimeout(() => setPopShare(false), 500);

    const textToShare = getShareText();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'DharmaScroll Wisdom',
          text: textToShare,
          url: window.location.href,
        });
        setIsShared(true);
        return;
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
      }
    }
    setShowShareSheet(true);
  };

  const shareViaWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(getShareText() + "\n" + window.location.href)}`;
    window.open(url, '_blank');
    setShowShareSheet(false);
    setIsShared(true);
  };

  const shareViaTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(getShareText())}&url=${encodeURIComponent(window.location.href)}`;
    window.open(url, '_blank');
    setShowShareSheet(false);
    setIsShared(true);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getShareText() + "\n" + window.location.href);
      alert('Wisdom copied to clipboard! ॐ');
      setShowShareSheet(false);
      setIsShared(true);
    } catch (err) {
      alert('Could not copy text.');
    }
  };

  const getThemeColor = () => {
    const themeColors: Record<string, string> = {
      'Peace': '#451a03',
      'Action': '#7c2d12',
      'Knowledge': '#92400e',
      'Love': '#b91c1c',
      'Duty': '#ea580c',
      'Peaceful': '#451a03',
      'Devotion': '#7c2d12',
      'Truth': '#f59e0b'
    };
    const primaryTheme = quote.themes[0] || 'Peace';
    return themeColors[primaryTheme] || '#451a03';
  };

  const getDisplayText = () => {
    if (language === 'hi') return quote.hindi;
    if (language === 'ta') return quote.tamil || quote.text;
    return quote.text;
  };

  const themeColor = getThemeColor();

  return (
    <div className="snap-item" style={{ background: 'transparent' }}>
      {/* Decorative Themed Blobs - High blur for a seamless look */}
      <div 
        className="bg-blob" 
        style={{ 
          top: '10%', 
          left: '5%', 
          width: '70%', 
          height: '40%', 
          backgroundColor: themeColor,
          opacity: 0.12,
          filter: 'blur(120px)'
        }}
      ></div>
      <div 
        className="bg-blob" 
        style={{ 
          bottom: '15%', 
          right: '5%', 
          width: '60%', 
          height: '50%', 
          backgroundColor: themeColor,
          opacity: 0.08,
          filter: 'blur(100px)'
        }}
      ></div>

      {/* Main Quote Content: reference/chapter (top) → Sanskrit → translation */}
      <div className="quote-content-area">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', minHeight: 0, flex: 1 }}>
          {/* Reference, chapter, and tags at top, before Sanskrit */}
          <div className="quote-reference-top" style={{ flexShrink: 0, marginBottom: '0.75rem', width: '100%', textAlign: 'center' }}>
            <div className="quote-source">
              {quote.source}
            </div>
            {quote.context && (
              <div className="quote-context">
                {quote.context}
              </div>
            )}
            <div className="tag-container">
              {quote.themes.slice(0, 3).map((theme, i) => (
                <span key={i} className="tag">
                  #{theme.toLowerCase().replace(/\s+/g, '')}
                </span>
              ))}
            </div>
          </div>
          {quote.sanskrit && (
            <div className="quote-sanskrit-wrap" style={{ flexShrink: 0, marginBottom: '1rem', width: '100%', textAlign: 'center' }}>
              <div className="quote-sanskrit" style={{ fontSize: '0.95rem', opacity: 0.9 }}>
                {quote.sanskrit}
              </div>
            </div>
          )}
          {/* Translation block: panel stays behind this only, never behind Sanskrit */}
          <div className="quote-translation-block" style={{ flex: '1 1 auto', minHeight: 0, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h1 
              ref={textRef}
              className="quote-main" 
              style={{ 
                fontSize: dynamicFontSize || (language === 'ta' ? '1.6rem' : '1.85rem'),
                flex: '1 1 auto',
                minHeight: 0,
                marginTop: 0,
                marginBottom: 0,
              }}
            >
              &ldquo;{getDisplayText()}&rdquo;
            </h1>
            <div style={{ 
              height: '2px', 
              width: '2.5rem', 
              background: 'linear-gradient(90deg, transparent, var(--accent-gold), transparent)',
              margin: '1rem auto 0', 
              opacity: 0.9,
              boxShadow: '0 0 10px rgba(255, 215, 0, 0.5)',
              flexShrink: 0,
            }}></div>
          </div>
        </div>
      </div>

      {/* Vertical Action Bar (right side, stacked) */}
      <div className="action-bar">
        <button 
          className={`action-btn ${isLiked ? 'liked' : ''} ${popHeart ? 'heart-pop' : ''}`} 
          aria-label="Like"
          onClick={handleLike}
        >
          <svg fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: '1.4rem', height: '1.4rem' }}>
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </button>
        <button 
          className={`action-btn ${isShared ? 'shared' : ''} ${popShare ? 'share-pop' : ''}`} 
          aria-label="Share"
          onClick={handleShare}
        >
           <svg fill="currentColor" viewBox="0 0 24 24" style={{ width: '1.4rem', height: '1.4rem' }}><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/></svg>
        </button>
      </div>

      {showShareSheet && (
        <>
          <div className="overlay" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 1500 }} onClick={() => setShowShareSheet(false)}></div>
          <div className="bottom-sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle"></div>
            <h3 style={{ textAlign: 'center', color: 'var(--accent-gold)', marginBottom: '1.5rem', fontFamily: 'Playfair Display', fontSize: '1.2rem' }}>
              Share This Wisdom
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }} onClick={shareViaWhatsApp}>
                <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: '50%', backgroundColor: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                  <svg style={{ width: '1.8rem', height: '1.8rem' }} fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.185-.573c.948.517 2.042.887 3.144.888 3.181 0 5.767-2.586 5.768-5.766 0-3.18-2.586-5.766-5.766-5.766zm3.446 8.202c-.145.408-.847.822-1.18.874-.333.051-.747.082-1.254-.083-.284-.092-.511-.191-.861-.341-1.49-.636-2.455-2.155-2.53-2.254-.075-.101-.606-.806-.606-1.537 0-.731.382-1.09.518-1.241.136-.151.298-.189.397-.189.1 0 .199.001.285.006.091.004.214-.035.334.254.124.3.426 1.034.463 1.109.037.075.062.163.013.262-.049.099-.074.162-.149.248-.075.086-.157.192-.224.257-.074.072-.152.151-.065.3.087.149.387.639.831 1.034.571.507 1.053.665 1.202.739.15.074.237.062.325-.04.088-.102.373-.434.474-.582.101-.148.202-.123.339-.072.138.051.874.412 1.025.487.151.076.251.114.288.177.037.063.037.363-.108.771z"/></svg>
                </div>
                <span style={{ fontSize: '0.7rem' }}>WhatsApp</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }} onClick={shareViaTwitter}>
                <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: '50%', backgroundColor: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <svg style={{ width: '1.4rem', height: '1.4rem' }} fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </div>
                <span style={{ fontSize: '0.7rem' }}>X (Twitter)</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }} onClick={copyToClipboard}>
                <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                  <svg style={{ width: '1.4rem', height: '1.4rem' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                </div>
                <span style={{ fontSize: '0.7rem' }}>Copy Link</span>
              </div>
            </div>
            
            <button className="btn-primary" style={{ width: '100%', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-slate)' }} onClick={() => setShowShareSheet(false)}>
              Cancel
            </button>
          </div>
        </>
      )}
      
      <div className="scroll-cue">
        <svg style={{ width: '2rem', height: '2rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 14l-7 7-7-7m14-8l-7 7-7-7"></path></svg>
      </div>
    </div>
  );
};