'use client';

import { useState } from 'react';
import type { InvitationData } from '@/types';
import { UniversalAudioPlayer } from '@/components/wedding/universal-audio-player';
import { MusicController } from '@/components/wedding/music-controller';

interface TemplateMusicWrapperProps {
  data: InvitationData;
  accentColor?: string;
  children: React.ReactNode;
}

export function TemplateMusicWrapper({
  data,
  accentColor = '#1a1a1a',
  children,
}: TemplateMusicWrapperProps) {
  const config = data.template.config;
  const musicEnabled = !!(config.musicEnabled);
  const musicUrl = (config.musicUrl as string) || undefined;
  const [isPlaying, setIsPlaying] = useState(false);

  // Auto-play on first interaction
  const handleInteraction = () => {
    if (musicEnabled && !isPlaying) {
      setIsPlaying(true);
    }
  };

  return (
    <div onClick={handleInteraction}>
      {musicEnabled && musicUrl && (
        <>
          <UniversalAudioPlayer
            url={musicUrl}
            enabled={musicEnabled}
            isPlaying={isPlaying}
            isOpened={true}
          />
          <MusicController
            isPlaying={isPlaying}
            onToggle={() => setIsPlaying(!isPlaying)}
            accentColor={accentColor}
          />
        </>
      )}
      {children}
    </div>
  );
}
