'use client';

import { motion } from 'framer-motion';
import { Music, Pause, Play } from 'lucide-react';

interface MusicControllerProps {
  isPlaying: boolean;
  onToggle: () => void;
  accentColor?: string;
  theme?: 'light' | 'dark';
}

export function MusicController({
  isPlaying,
  onToggle,
  accentColor = '#FFFFFF',
  theme = 'light',
}: MusicControllerProps) {
  const isDark = theme === 'dark';

  if (isDark) {
    return (
      <div className="fixed bottom-4 right-4 z-[60]">
        {isPlaying && (
          <div className="noir-music-bars absolute -top-5 left-1/2 -translate-x-1/2 pointer-events-none">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="noir-music-bar" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        )}

        <motion.button
          onClick={onToggle}
          aria-label={isPlaying ? 'Pause Music' : 'Play Music'}
          className="noir-music-btn relative w-9 h-9 rounded-full flex items-center justify-center overflow-hidden"
          animate={isPlaying ? { scale: [1, 1.04, 1] } : { scale: 1 }}
          transition={isPlaying ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
        >
          {isPlaying && (
            <motion.span
              className="absolute inset-0 rounded-full border border-[#C9A962]/40"
              animate={{ scale: [1, 1.35], opacity: [0.55, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
            />
          )}

          <motion.span
            className={`relative z-10 flex items-center justify-center ${
              isPlaying ? 'noir-music-spin' : ''
            }`}
          >
            {isPlaying ? (
              <Pause size={14} className="text-[#F2D9A0]" fill="currentColor" />
            ) : (
              <Play size={14} className="text-[#E9E9E9]" fill="currentColor" />
            )}
          </motion.span>
        </motion.button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-[60]">
      {isPlaying && (
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 flex items-end gap-0.5 h-3 pointer-events-none">
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
        className="w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-all duration-700 backdrop-blur-md border border-white/30 overflow-hidden"
        style={{
          backgroundColor: isPlaying ? `${accentColor}EE` : 'rgba(255, 255, 255, 0.8)',
          color: isPlaying ? 'white' : accentColor,
        }}
        aria-label={isPlaying ? 'Pause Music' : 'Play Music'}
      >
        <div
          className={`relative z-10 flex items-center justify-center transition-transform duration-500 ${
            isPlaying ? 'scale-110' : 'scale-100'
          }`}
        >
          {isPlaying ? <Music size={14} /> : <Play size={14} fill="currentColor" />}
        </div>
      </button>
    </div>
  );
}
