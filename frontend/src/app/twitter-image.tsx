import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(145deg, #1a1a1a 0%, #101010 50%, #2a1a22 100%)',
          color: 'white',
          fontFamily: 'Georgia, serif',
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 600,
            letterSpacing: 2,
            marginBottom: 16,
          }}
        >
          Inviora
        </div>
        <div
          style={{
            fontSize: 28,
            color: '#C9A962',
            letterSpacing: 4,
          }}
        >
          Beautiful Wedding Invitations
        </div>
      </div>
    ),
    { ...size }
  );
}
