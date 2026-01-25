
import React, { useEffect, useRef } from 'react';
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

  useEffect(() => {
    if (isActive) {
      startTimeRef.current = Date.now();
      onViewStart(quote.id);
    } else {
      if (startTimeRef.current) {
        onViewEnd(quote.id);
        startTimeRef.current = null;
      }
    }
  }, [isActive, quote.id]);

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
    if (language === 'ta') return quote.tamil;
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
        <button className="action-btn" aria-label="Like">
          <svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
        </button>
        <button className="action-btn" aria-label="Share">
           <svg fill="currentColor" viewBox="0 0 24 24"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/></svg>
        </button>
      </div>
      
      <div className="scroll-cue">
        <svg style={{ width: '2rem', height: '2rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 14l-7 7-7-7m14-8l-7 7-7-7"></path></svg>
      </div>
    </div>
  );
};
