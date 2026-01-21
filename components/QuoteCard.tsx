
import React, { useEffect, useRef } from 'react';
import { Quote } from '../types';

interface QuoteCardProps {
  quote: Quote;
  isActive: boolean;
  onViewStart: (id: string) => void;
  onViewEnd: (id: string) => void;
}

export const QuoteCard: React.FC<QuoteCardProps> = ({ quote, isActive, onViewStart, onViewEnd }) => {
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

  // Cool and calm background gradients based on themes (simplified logic)
  const getBackgroundStyles = () => {
    const themeColors: Record<string, string> = {
      'Peace': 'from-cyan-900 to-blue-900',
      'Action': 'from-slate-900 to-teal-900',
      'Knowledge': 'from-indigo-900 to-slate-900',
      'Love': 'from-teal-900 to-emerald-900',
      'Duty': 'from-slate-900 to-blue-950',
    };
    
    const primaryTheme = quote.themes[0] || 'Peace';
    const gradient = themeColors[primaryTheme] || 'from-slate-900 to-blue-900';
    
    return `bg-gradient-to-b ${gradient}`;
  };

  return (
    <div className={`snap-item flex flex-col items-center justify-center p-8 relative overflow-hidden ${getBackgroundStyles()}`}>
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/5 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-400/5 rounded-full blur-3xl animate-pulse"></div>

      <div className="max-w-lg w-full z-10 space-y-8 text-center">
        {quote.sanskrit && (
          <div className="text-xl md:text-2xl font-serif text-cyan-200/60 italic leading-relaxed mb-4">
             {quote.sanskrit}
          </div>
        )}
        
        <h1 className="text-3xl md:text-4xl font-serif text-white leading-snug drop-shadow-lg font-medium italic">
          &ldquo;{quote.text}&rdquo;
        </h1>
        
        <div className="flex flex-col items-center space-y-2">
          <div className="h-[2px] w-12 bg-cyan-400/50 mb-2"></div>
          <span className="text-cyan-300 font-serif text-lg tracking-wide uppercase opacity-90">
            {quote.source}
          </span>
          {quote.context && (
            <span className="text-slate-400 text-sm font-sans tracking-widest uppercase">
              {quote.context}
            </span>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-2 mt-8">
          {quote.themes.map((theme, i) => (
            <span key={i} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-slate-300 uppercase tracking-tighter">
              {theme}
            </span>
          ))}
        </div>
      </div>

      {/* Action Bar (Mocking Phone Interface) */}
      <div className="absolute right-4 bottom-24 flex flex-col space-y-6 z-20">
        <button className="p-3 bg-white/10 rounded-full backdrop-blur-md hover:bg-white/20 transition-all">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
        </button>
        <button className="p-3 bg-white/10 rounded-full backdrop-blur-md hover:bg-white/20 transition-all">
           <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
        </button>
      </div>
      
      {/* Visual Cue for Scroll */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
        <svg className="w-6 h-6 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7-7-7m14-8l-7 7-7-7"></path></svg>
      </div>
    </div>
  );
};
