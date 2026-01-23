import React, { useEffect, useRef } from 'react';
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
  }, [isActive, quote.id, onViewStart, onViewEnd]);

  const getBackgroundGradient = () => {
    const themeColors: Record<string, string> = {
      'Peace': 'linear-gradient(to bottom, #0c4a6e, #1e3a8a)',
      'Action': 'linear-gradient(to bottom, #0f172a, #134e4a)',
      'Knowledge': 'linear-gradient(to bottom, #312e81, #0f172a)',
      'Love': 'linear-gradient(to bottom, #134e4a, #064e3b)',
      'Duty': 'linear-gradient(to bottom, #0f172a, #172554)',
    };
    
    const primaryTheme = quote.themes[0] || 'Peace';
    return themeColors[primaryTheme] || 'linear-gradient(to bottom, #0f172a, #1e3a8a)';
  };

  const displayText = language === 'hi' ? quote.hindi : quote.text;

  return (
    <div className="snap-item" style={{ background: getBackgroundGradient() }}>
      {/* Decorative Background Elements */}
      <div className="bg-blob animate-pulse" style={{ top: '-10%', left: '-10%', width: '40%', height: '40%', backgroundColor: 'rgba(255,255,255,0.05)' }}></div>
      <div className="bg-blob animate-pulse" style={{ bottom: '-10%', right: '-10%', width: '40%', height: '40%', backgroundColor: 'rgba(34,211,238,0.05)' }}></div>

      <div style={{ maxWidth: '32rem', width: '100%', zIndex: 10, textAlign: 'center' }}>
        {quote.sanskrit && (
          <div className="quote-sanskrit" style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.85)' }}>
             {quote.sanskrit}
          </div>
        )}
        
        <h1 className="quote-main">
          &ldquo;{displayText}&rdquo;
        </h1>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ height: '2px', width: '3rem', backgroundColor: 'rgba(34,211,238,0.5)', marginBottom: '1rem' }}></div>
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

      {/* Action Bar */}
      <div className="action-bar">
        <button className="action-btn">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
        </button>
        <button className="action-btn">
           <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
        </button>
      </div>
      
      {/* Visual Cue for Scroll */}
      <div className="scroll-cue">
        <svg style={{ width: '1.5rem', height: '1.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7-7-7m14-8l-7 7-7-7"></path></svg>
      </div>
    </div>
  );
};