'use client';

import { Music, Play } from 'lucide-react';

interface MusicControllerProps {
  isPlaying: boolean;
  onToggle: () => void;
  accentColor?: string;
}

export function MusicController({
  isPlaying,
  onToggle,
  accentColor = '#FFFFFF',
}: MusicControllerProps) {
  return (
    <div className="fixed bottom-6 left-6 z-[60]">
      {isPlaying && (
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex items-end gap-1 h-4 pointer-events-none">
          <div
            className="w-0.5 rounded-full animate-pulse"
            style={{ color: accentColor, backgroundColor: accentColor, height: '60%' }}
          />
          <div
            className="w-0.5 rounded-full animate-pulse"
            style={{
              color: accentColor,
              backgroundColor: accentColor,
              height: '100%',
              animationDelay: '0.2s',
            }}
          />
          <div
            className="w-0.5 rounded-full animate-pulse"
            style={{
              color: accentColor,
              backgroundColor: accentColor,
              height: '80%',
              animationDelay: '0.4s',
            }}
          />
        </div>
      )}

      <button
        onClick={onToggle}
        className="w-12 h-12 rounded-full flex items-center justify-center shadow-xl transition-all duration-700 backdrop-blur-md border-2 border-white/30 overflow-hidden"
        style={{
          backgroundColor: isPlaying
            ? `${accentColor}EE`
            : 'rgba(255, 255, 255, 0.8)',
          color: isPlaying ? 'white' : accentColor,
        }}
        aria-label={isPlaying ? 'Pause Music' : 'Play Music'}
      >
        <div
          className={`relative z-10 flex items-center justify-center transition-transform duration-500 ${
            isPlaying ? 'scale-110' : 'scale-100'
          }`}
        >
          {isPlaying ? <Music size={20} /> : <Play size={20} fill="currentColor" />}
        </div>
      </button>
    </div>
  );
}
