
import React, { useEffect, useRef, useState } from 'react';
import { Quote } from '../types';

interface QuoteCardProps {
  quote: Quote;
  isActive: boolean;
  language: 'en' | 'hi';
  onViewStart: (id: string) => void;
  onViewEnd: (id: string) => void;
}

export const QuoteCard: React.FC<QuoteCardProps> = ({ quote, isActive, language, onViewStart, onViewEnd }) => {
  const startTimeRef = useRef<number | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [popHeart, setPopHeart] = useState(false);
  const [popShare, setPopShare] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);

  useEffect(() => {
    if (isActive) {
      startTimeRef.current = Date.now();
      onViewStart(quote.id);
    } else {
      if (startTimeRef.current) {
        onViewEnd(quote.id);
        startTimeRef.current = null;
      }
      // Auto-close share sheet if we scroll away
      setShowShareSheet(false);
    }
  }, [isActive, quote.id]);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    if (!isLiked) {
      setPopHeart(true);
      setTimeout(() => setPopHeart(false), 500);
    }
  };

  const getShareText = () => {
    const text = language === 'hi' ? quote.hindi : quote.text;
    return `"${text}" — ${quote.source}\n\nRead more wisdom on DharmaScroll. ॐ`;
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Immediate Visual Feedback
    setPopShare(true);
    setTimeout(() => setPopShare(false), 500);

    const textToShare = getShareText();
    
    // 1. First Attempt: Native Web Share API
    // Note: Most mobile browsers require a user gesture (which we have) and HTTPS.
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
        console.debug('Native Share API failed or cancelled.', err);
      }
    }

    // 2. Fallback: Show our custom spiritual Bottom Sheet
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

  const getBackgroundGradient = () => {
    const themeColors: Record<string, string> = {
      'Peace': 'linear-gradient(135deg, #1a0b04 0%, #451a03 100%)',
      'Action': 'linear-gradient(135deg, #2e1009 0%, #7c2d12 100%)',
      'Knowledge': 'linear-gradient(135deg, #26110a 0%, #92400e 100%)',
      'Love': 'linear-gradient(135deg, #270f08 0%, #b91c1c 100%)',
      'Duty': 'linear-gradient(135deg, #1c0d02 0%, #ea580c 100%)',
    };
    const primaryTheme = quote.themes[0] || 'Peace';
    return themeColors[primaryTheme] || 'linear-gradient(135deg, #1a0b04 0%, #451a03 100%)';
  };

  const getDisplayText = () => {
    if (language === 'hi') return quote.hindi;
    return quote.text;
  };

  return (
    <div className="snap-item" style={{ background: getBackgroundGradient() }}>
      <div className="bg-blob animate-pulse" style={{ top: '-10%', left: '-10%', width: '50%', height: '50%', backgroundColor: 'rgba(255, 153, 51, 0.15)' }}></div>
      <div className="bg-blob animate-pulse" style={{ bottom: '-10%', right: '-10%', width: '50%', height: '50%', backgroundColor: 'rgba(255, 204, 51, 0.1)' }}></div>

      <div style={{ maxWidth: '36rem', width: '100%', zIndex: 10, textAlign: 'center' }}>
        {quote.sanskrit && (
          <div className="quote-sanskrit">
             {quote.sanskrit}
          </div>
        )}
        
        <h1 className="quote-main">
          &ldquo;{getDisplayText()}&rdquo;
        </h1>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ height: '2px', width: '4rem', backgroundColor: 'var(--accent-saffron)', marginBottom: '1.25rem', opacity: 0.6 }}></div>
          <span className="quote-source">
            {quote.source}
          </span>
          {quote.context && (
            <span className="quote-context">
              {quote.context}
            </span>
          )}
        </div>

        <div className="tag-container">
          {quote.themes.map((theme, i) => (
            <span key={i} className="tag">
              {theme}
            </span>
          ))}
        </div>
      </div>

      <div className="action-bar">
        <button 
          className={`action-btn ${isLiked ? 'liked' : ''} ${popHeart ? 'heart-pop' : ''}`} 
          aria-label="Like"
          onClick={handleLike}
        >
          <svg fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </button>
        <button 
          className={`action-btn ${isShared ? 'shared' : ''} ${popShare ? 'share-pop' : ''}`} 
          aria-label="Share"
          onClick={handleShare}
        >
           <svg fill="currentColor" viewBox="0 0 24 24"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/></svg>
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
            
            <div className="share-grid">
              <div className="share-option" onClick={shareViaWhatsApp}>
                <div className="share-icon-circle">
                  <svg style={{ width: '1.5rem', height: '1.5rem' }} fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.185-.573c.948.517 2.042.887 3.144.888 3.181 0 5.767-2.586 5.768-5.766 0-3.18-2.586-5.766-5.766-5.766zm3.446 8.202c-.145.408-.847.822-1.18.874-.333.051-.747.082-1.254-.083-.284-.092-.511-.191-.861-.341-1.49-.636-2.455-2.155-2.53-2.254-.075-.101-.606-.806-.606-1.537 0-.731.382-1.09.518-1.241.136-.151.298-.189.397-.189.1 0 .199.001.285.006.091.004.214-.035.334.254.124.3.426 1.034.463 1.109.037.075.062.163.013.262-.049.099-.074.162-.149.248-.075.086-.157.192-.224.257-.074.072-.152.151-.065.3.087.149.387.639.831 1.034.571.507 1.053.665 1.202.739.15.074.237.062.325-.04.088-.102.373-.434.474-.582.101-.148.202-.123.339-.072.138.051.874.412 1.025.487.151.076.251.114.288.177.037.063.037.363-.108.771z"/></svg>
                </div>
                <span>WhatsApp</span>
              </div>
              
              <div className="share-option" onClick={shareViaTwitter}>
                <div className="share-icon-circle">
                  <svg style={{ width: '1.2rem', height: '1.2rem' }} fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </div>
                <span>X (Twitter)</span>
              </div>
              
              <div className="share-option" onClick={copyToClipboard}>
                <div className="share-icon-circle">
                  <svg style={{ width: '1.2rem', height: '1.2rem' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                </div>
                <span>Copy</span>
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
