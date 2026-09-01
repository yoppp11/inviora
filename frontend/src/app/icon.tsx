import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #C97B8A 0%, #6E3A52 100%)',
          borderRadius: 8,
        }}
      >
        <div
          style={{
            width: 14,
            height: 18,
            borderRadius: 3,
            background: 'rgba(255,255,255,0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#C9A962',
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
