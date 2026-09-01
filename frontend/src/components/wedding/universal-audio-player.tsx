'use client';

import { useEffect, useRef, useState } from 'react';
import { getAudioInfo } from '@/lib/audioUtils';

interface UniversalAudioPlayerProps {
  url?: string;
  enabled: boolean;
  isPlaying: boolean;
  isOpened: boolean;
}

declare global {
  interface Window {
    YT?: {
      Player: new (
        id: string | HTMLElement,
        options: Record<string, unknown>
      ) => YTPlayer;
      PlayerState: {
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
    webkitAudioContext?: typeof AudioContext;
  }
}

interface YTPlayer {
  destroy(): void;
  playVideo(): void;
  pauseVideo(): void;
  unMute(): void;
  setVolume(volume: number): void;
}

function unlockAudioSession() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  const ctx = new AC();
  void ctx.resume();
}

export function UniversalAudioPlayer({
  url,
  enabled,
  isPlaying,
  isOpened,
}: UniversalAudioPlayerProps) {
  const audioInfo = getAudioInfo(url);
  const ytPlayerRef = useRef<YTPlayer | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const retryRef = useRef<(() => void) | null>(null);
  const [isYtReady, setIsYtReady] = useState(false);
  const isMounted = useRef(true);

  const clearRetry = () => {
    if (!retryRef.current) return;
    document.removeEventListener('pointerdown', retryRef.current, true);
    retryRef.current = null;
  };

  const armRetry = (start: () => void) => {
    if (retryRef.current) return;
    const onGesture = () => {
      retryRef.current = null;
      start();
    };
    retryRef.current = onGesture;
    document.addEventListener('pointerdown', onGesture, {
      once: true,
      capture: true,
    });
  };

  const startPlayback = () => {
    unlockAudioSession();
    if (audioInfo.type === 'direct') {
      const el = audioElRef.current;
      if (!el) {
        armRetry(startPlayback);
        return;
      }
      const play = el.play();
      if (play !== undefined) {
        play.then(clearRetry).catch(() => armRetry(startPlayback));
      }
      return;
    }
    if (audioInfo.type === 'youtube') {
      const player = ytPlayerRef.current;
      if (!player || typeof player.playVideo !== 'function') {
        armRetry(startPlayback);
        return;
      }
      try {
        if (typeof player.unMute === 'function') {
          player.unMute();
          player.setVolume(100);
        }
        player.playVideo();
        clearRetry();
      } catch {
        armRetry(startPlayback);
      }
    }
  };

  const pausePlayback = () => {
    clearRetry();
    audioElRef.current?.pause();
    if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
      ytPlayerRef.current.pauseVideo();
    }
  };

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      clearRetry();
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      pausePlayback();
      return;
    }
    if (isPlaying && isOpened) {
      startPlayback();
      return;
    }
    pausePlayback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioInfo.url, audioInfo.type, isPlaying, isOpened, enabled, isYtReady]);

  useEffect(() => {
    if (!enabled || audioInfo.type !== 'youtube' || !audioInfo.id) {
      if (ytPlayerRef.current) {
        ytPlayerRef.current.destroy();
        ytPlayerRef.current = null;
        setIsYtReady(false);
      }
      return;
    }

    if (
      !window.YT &&
      !document.querySelector(
        'script[src="https://www.youtube.com/iframe_api"]'
      )
    ) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag?.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        document.head.appendChild(tag);
      }
    }

    const videoId = audioInfo.id;

    const initPlayer = () => {
      ytPlayerRef.current = new window.YT!.Player('yt-player-hidden', {
        height: '1',
        width: '1',
        videoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          loop: 1,
          playlist: videoId,
          mute: 0,
          playsinline: 1,
          modestbranding: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (event: { target: YTPlayer }) => {
            setIsYtReady(true);
            if (typeof event.target.unMute === 'function') {
              event.target.unMute();
              event.target.setVolume(100);
            }
            if (isPlaying && isOpened) {
              event.target.playVideo();
            }
          },
          onStateChange: (event: { data: number }) => {
            if (event.data === window.YT!.PlayerState.ENDED) {
              ytPlayerRef.current?.playVideo();
            }
          },
        },
      });
    };

    const prevHandler = window.onYouTubeIframeAPIReady;

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = () => {
        prevHandler?.();
        if (!isMounted.current) return;
        const target = document.getElementById('yt-player-hidden');
        if (target && target.tagName.toLowerCase() === 'div') {
          initPlayer();
        }
      };
    }

    return () => {
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch {
          /* ignore */
        }
        ytPlayerRef.current = null;
      }
      window.onYouTubeIframeAPIReady = prevHandler ?? undefined;
      setIsYtReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioInfo.id, audioInfo.type, enabled]);

  if (!enabled || audioInfo.type === 'unknown') return null;

  return (
    <div
      className="fixed z-[-1] h-px w-px overflow-hidden opacity-0"
      style={{ pointerEvents: 'none' }}
      aria-hidden="true"
    >
      {audioInfo.type === 'direct' && (
        <audio
          ref={(el) => {
            audioElRef.current = el;
          }}
          src={audioInfo.url}
          loop
          preload="auto"
          playsInline
        />
      )}
      {audioInfo.type === 'youtube' && (
        <div id="yt-player-hidden" key={audioInfo.id}></div>
      )}
    </div>
  );
}
