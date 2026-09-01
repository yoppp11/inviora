'use client';

import type { InvitationData } from '@/types';

function getMediaByCategory(data: InvitationData, category: string) {
  return data.media.find((m) => m.category === category)?.secureUrl;
}

export function FloralTemplate({ data }: { data: InvitationData }) {
  const { event, guest, template } = data;
  const config = template.config;
  const primaryColor = config.primaryColor || '#5c6b4f';
  const secondaryColor = config.secondaryColor || '#faf9f6';

  const heroImage = config.heroImage || getMediaByCategory(data, 'hero');
  const coupleImage = config.coupleImage || getMediaByCategory(data, 'couple');
  const groomPhoto = config.groomPhoto || getMediaByCategory(data, 'groom');
  const bridePhoto = config.bridePhoto || getMediaByCategory(data, 'bride');
  const gallery = config.gallery || [];

  const weddingDate = new Date(event.weddingDate);
  const openingText = config.openingText || event.openingText || 'With joyful hearts, we invite you to share in the celebration of our love.';
  const closingText = config.closingText || event.closingText || 'Your presence would be the greatest gift of all.';

  return (
    <div className="min-h-screen" style={{ backgroundColor: secondaryColor }}>
      {/* Decorative Floral Border Header */}
      <section className="relative py-20 px-6 text-center overflow-hidden">
        {/* Floral decorations via CSS */}
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 20% 20%, ${primaryColor}40 0%, transparent 50%),
                          radial-gradient(ellipse at 80% 80%, ${primaryColor}40 0%, transparent 50%),
                          radial-gradient(ellipse at 80% 20%, ${primaryColor}20 0%, transparent 40%),
                          radial-gradient(ellipse at 20% 80%, ${primaryColor}20 0%, transparent 40%)`,
          }}
        />
        <div className="relative z-10 max-w-lg mx-auto">
          {/* Floral ornament top */}
          <div className="text-4xl mb-4" style={{ color: primaryColor }}>❀</div>
          <p
            className="text-sm tracking-[0.3em] uppercase mb-4"
            style={{ color: primaryColor }}
          >
            The Wedding Celebration Of
          </p>
          <h1 className="text-4xl md:text-5xl font-serif mb-2" style={{ color: primaryColor }}>
            {event.groomName}
          </h1>
          <div className="text-2xl my-2" style={{ color: primaryColor }}>✦</div>
          <h1 className="text-4xl md:text-5xl font-serif" style={{ color: primaryColor }}>
            {event.brideName}
          </h1>
          <p className="mt-6 text-base" style={{ color: `${primaryColor}cc` }}>
            {weddingDate.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </section>

      {/* Hero */}
      {heroImage && (
        <section className="px-6 pb-8">
          <div className="max-w-3xl mx-auto rounded-2xl overflow-hidden shadow-lg">
            <img src={heroImage} alt="Wedding" className="w-full aspect-video object-cover" />
          </div>
        </section>
      )}

      {/* Guest Greeting */}
      <section
        className="py-16 px-6 text-center"
        style={{ backgroundColor: `${primaryColor}08` }}
      >
        <div className="max-w-lg mx-auto">
          <div className="text-2xl mb-2" style={{ color: primaryColor }}>❀</div>
          <p className="text-xs tracking-[0.3em] uppercase mb-3" style={{ color: `${primaryColor}99` }}>
            Dear
          </p>
          <h2 className="text-2xl md:text-3xl font-serif mb-1" style={{ color: primaryColor }}>
            {guest.name}
          </h2>
          {guest.address && (
            <p className="text-sm" style={{ color: `${primaryColor}99` }}>{guest.address}</p>
          )}
          <p className="mt-6 text-base leading-relaxed" style={{ color: `${primaryColor}cc` }}>
            {openingText}
          </p>
        </div>
      </section>

      {/* Couple Photos */}
      {(groomPhoto || bridePhoto || coupleImage) && (
        <section className="py-12 px-6">
          <div className="max-w-3xl mx-auto">
            {coupleImage ? (
              <div className="flex justify-center">
                <img
                  src={coupleImage}
                  alt="Couple"
                  className="max-h-[400px] rounded-2xl shadow-lg object-cover"
                />
              </div>
            ) : (
              <div className="flex justify-center gap-8 flex-wrap">
                {groomPhoto && (
                  <div className="text-center">
                    <div
                      className="w-44 h-44 rounded-full overflow-hidden shadow-md mx-auto border-4"
                      style={{ borderColor: `${primaryColor}30` }}
                    >
                      <img src={groomPhoto} alt={event.groomName} className="w-full h-full object-cover" />
                    </div>
                    <p className="mt-3 font-serif" style={{ color: primaryColor }}>{event.groomName}</p>
                  </div>
                )}
                {bridePhoto && (
                  <div className="text-center">
                    <div
                      className="w-44 h-44 rounded-full overflow-hidden shadow-md mx-auto border-4"
                      style={{ borderColor: `${primaryColor}30` }}
                    >
                      <img src={bridePhoto} alt={event.brideName} className="w-full h-full object-cover" />
                    </div>
                    <p className="mt-3 font-serif" style={{ color: primaryColor }}>{event.brideName}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Event Details */}
      <section className="py-16 px-6">
        <div className="max-w-md mx-auto text-center space-y-8">
          <div className="text-2xl" style={{ color: primaryColor }}>❀</div>

          <div className="rounded-2xl p-8 shadow-sm" style={{ backgroundColor: 'white' }}>
            {event.ceremonyTime && (
              <div className="mb-6">
                <p className="text-xs tracking-[0.3em] uppercase mb-2" style={{ color: `${primaryColor}99` }}>
                  Holy Ceremony
                </p>
                <p className="text-lg font-serif" style={{ color: primaryColor }}>
                  {event.ceremonyTime}
                </p>
              </div>
            )}

            {event.receptionTime && (
              <div className="mb-6">
                <p className="text-xs tracking-[0.3em] uppercase mb-2" style={{ color: `${primaryColor}99` }}>
                  Reception
                </p>
                <p className="text-lg font-serif" style={{ color: primaryColor }}>
                  {event.receptionTime}
                </p>
              </div>
            )}

            {event.venueName && (
              <div>
                <p className="text-xs tracking-[0.3em] uppercase mb-2" style={{ color: `${primaryColor}99` }}>
                  Venue
                </p>
                <p className="text-lg font-serif" style={{ color: primaryColor }}>
                  {event.venueName}
                </p>
                {event.venueAddress && (
                  <p className="text-sm mt-1" style={{ color: `${primaryColor}99` }}>
                    {event.venueAddress}
                  </p>
                )}
              </div>
            )}
          </div>

          {event.mapUrl && (
            <a
              href={event.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-8 py-3 rounded-full text-sm text-white hover:opacity-90 transition-opacity shadow-sm"
              style={{ backgroundColor: primaryColor }}
            >
              Open in Maps
            </a>
          )}
        </div>
      </section>

      {/* Gallery */}
      {gallery.length > 0 && (
        <section className="py-12 px-6">
          <p className="text-center text-xs tracking-[0.3em] uppercase mb-8" style={{ color: `${primaryColor}99` }}>
            Our Moments
          </p>
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-3">
            {gallery.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`Gallery ${i + 1}`}
                className="w-full h-48 object-cover rounded-xl shadow-sm"
              />
            ))}
          </div>
        </section>
      )}

      {/* Closing */}
      <section className="py-16 px-6 text-center">
        <div className="max-w-lg mx-auto">
          <p className="text-base leading-relaxed mb-6" style={{ color: `${primaryColor}cc` }}>
            {closingText}
          </p>
          <div className="text-2xl mb-4" style={{ color: primaryColor }}>❀</div>
          <h2 className="text-xl font-serif" style={{ color: primaryColor }}>
            {event.groomName} & {event.brideName}
          </h2>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 text-center text-xs" style={{ color: `${primaryColor}66` }}>
        <p>Created with Inviora</p>
      </footer>
    </div>
  );
}
