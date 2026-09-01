export type AudioType = 'youtube' | 'direct' | 'unknown';

export interface AudioInfo {
  type: AudioType;
  id?: string;
  url: string;
}

export const getAudioInfo = (url?: string): AudioInfo => {
  if (!url || typeof url !== 'string') {
    return { type: 'unknown', url: '' };
  }

  const trimmedUrl = url.trim();

  const ytRegex =
    /^(?:https?:\/\/)?(?:www\.|m\.|music\.)?(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|shorts\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[?&/]|$)/;
  const ytMatch = trimmedUrl.match(ytRegex);

  if (ytMatch && ytMatch[1]) {
    return { type: 'youtube', id: ytMatch[1], url: trimmedUrl };
  }

  const directRegex = /\.(mp3|wav|ogg|m4a|flac|aac)(?:\?.*)?$/i;
  const cloudinaryAudio =
    /res\.cloudinary\.com\/[^/]+\/(?:video|raw)\/upload\//.test(trimmedUrl);

  if (
    directRegex.test(trimmedUrl) ||
    trimmedUrl.startsWith('data:audio/') ||
    cloudinaryAudio
  ) {
    return { type: 'direct', url: trimmedUrl };
  }

  return { type: 'unknown', url: trimmedUrl };
};
