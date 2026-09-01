import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(145deg, #1a1a1a 0%, #101010 100%)',
        }}
      >
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: 20,
            background: 'linear-gradient(135deg, #C97B8A 0%, #6E3A52 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}
        >
          <div
            style={{
              width: 48,
              height: 56,
              borderRadius: 8,
              background: 'rgba(255,255,255,0.95)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: '#C9A962',
              }}
            />
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
