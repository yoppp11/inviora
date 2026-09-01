import { ImageResponse } from 'next/og';

export const alt = 'Inviora - Wedding Invitation Platform';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
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
            width: 120,
            height: 120,
            borderRadius: 24,
            background: 'linear-gradient(135deg, #C97B8A 0%, #6E3A52 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 48,
              height: 58,
              borderRadius: 8,
              background: 'rgba(255,255,255,0.95)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: '#C9A962',
              }}
            />
          </div>
        </div>
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
            textTransform: 'uppercase',
          }}
        >
          Wedding Invitation Platform
        </div>
      </div>
    ),
    { ...size }
  );
}
