
import React, { useEffect, useRef, useState } from 'react';
import { Quote } from '../types';
import { generateSpeech } from '../services/geminiService';

interface QuoteCardProps {
  quote: Quote;
  isActive: boolean;
  language: 'en' | 'hi';
  onViewStart: (id: string) => void;
  onViewEnd: (id: string) => void;
}

// Helper functions for audio processing
function decodeBase64ToUint8(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeRawPCMToBuffer(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  // Ensure we don't try to read a partial 16-bit word at the end of the buffer
  const length = Math.floor(data.byteLength / 2);
  const dataInt16 = new Int16Array(data.buffer, 0, length);
  
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Convert 16-bit PCM to float [-1.0, 1.0]
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const QuoteCard: React.FC<QuoteCardProps> = ({ quote, isActive, language, onViewStart, onViewEnd }) => {
  const startTimeRef = useRef<number | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    if (isActive) {
      startTimeRef.current = Date.now();
      onViewStart(quote.id);
    } else {
      stopAudio();
      if (startTimeRef.current) {
        onViewEnd(quote.id);
        startTimeRef.current = null;
      }
    }
    
    // Cleanup on unmount
    return () => stopAudio();
  }, [isActive, quote.id]);

  const stopAudio = () => {
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop();
      } catch (e) {
        // Source might have already ended
      }
      currentSourceRef.current = null;
    }
    setIsSpeaking(false);
    setIsLoadingAudio(false);
  };

  const handleSpeak = async () => {
    if (isSpeaking || isLoadingAudio) {
      stopAudio();
      return;
    }

    setIsLoadingAudio(true);
    const displayText = language === 'hi' ? quote.hindi : quote.text;
    
    // We provide a structured prompt to the TTS model for better prosody
    const speakText = `Original Sanskrit: ${quote.sanskrit || 'Not available'}. Translation: ${displayText}`;
    
    try {
      const base64Audio = await generateSpeech(speakText);
      if (!base64Audio) {
        console.warn("DharmaScroll: No audio data received from API");
        setIsLoadingAudio(false);
        return;
      }

      // Initialize AudioContext on first interaction
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      // Crucial for mobile: Resume context if suspended
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const audioBuffer = await decodeRawPCMToBuffer(
        decodeBase64ToUint8(base64Audio),
        audioContextRef.current,
        24000,
        1
      );

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      
      source.onended = () => {
        setIsSpeaking(false);
        currentSourceRef.current = null;
      };
      
      currentSourceRef.current = source;
      setIsLoadingAudio(false);
      setIsSpeaking(true);
      source.start();
    } catch (error) {
      console.error("DharmaScroll: Audio Playback Error:", error);
      setIsLoadingAudio(false);
      setIsSpeaking(false);
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

  const displayText = language === 'hi' ? quote.hindi : quote.text;

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
          &ldquo;{displayText}&rdquo;
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
          className="action-btn" 
          onClick={handleSpeak}
          disabled={isLoadingAudio}
          style={{ 
            color: isSpeaking ? 'var(--accent-gold)' : 'var(--accent-saffron)',
            borderColor: (isSpeaking || isLoadingAudio) ? 'var(--accent-gold)' : 'rgba(255, 153, 51, 0.2)',
            opacity: isLoadingAudio ? 0.6 : 1
          }}
        >
          {isLoadingAudio ? (
            <div className="spinner" style={{ width: '1rem', height: '1rem', margin: 0, borderWidth: '2px' }}></div>
          ) : isSpeaking ? (
            <svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/></svg>
          ) : (
            <svg fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
          )}
        </button>
        <button className="action-btn">
          <svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
        </button>
        <button className="action-btn">
           <svg fill="currentColor" viewBox="0 0 24 24"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/></svg>
        </button>
      </div>
      
      <div className="scroll-cue">
        <svg style={{ width: '2rem', height: '2rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 14l-7 7-7-7m14-8l-7 7-7-7"></path></svg>
      </div>
    </div>
  );
};
