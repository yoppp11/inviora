'use client';

import type { InvitationData } from '@/types';

function getMediaByCategory(data: InvitationData, category: string) {
  return data.media.find((m) => m.category === category)?.secureUrl;
}

export function ElegantTemplate({ data }: { data: InvitationData }) {
  const { event, guest, template, media } = data;
  const config = template.config;
  const primaryColor = config.primaryColor || '#1a1a1a';
  const secondaryColor = config.secondaryColor || '#f8f6f3';

  const heroImage = config.heroImage || getMediaByCategory(data, 'hero');
  const coupleImage = config.coupleImage || getMediaByCategory(data, 'couple');
  const groomPhoto = config.groomPhoto || getMediaByCategory(data, 'groom');
  const bridePhoto = config.bridePhoto || getMediaByCategory(data, 'bride');
  const gallery = config.gallery || [];

  const weddingDate = new Date(event.weddingDate);
  const openingText = config.openingText || event.openingText || 'Together with their families, request the pleasure of your company at the celebration of their marriage.';
  const closingText = config.closingText || event.closingText || 'We look forward to celebrating this special day with you.';

  return (
    <div className="min-h-screen" style={{ backgroundColor: secondaryColor }}>
      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center justify-center text-center overflow-hidden">
        {heroImage && (
          <div className="absolute inset-0">
            <img src={heroImage} alt="Hero" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40" />
          </div>
        )}
        <div className={`relative z-10 px-6 py-16 ${heroImage ? 'text-white' : ''}`}>
          <p className="text-sm tracking-[0.3em] uppercase mb-4 opacity-80">The Wedding Of</p>
          <h1
            className="text-4xl md:text-6xl font-serif mb-4"
            style={{ color: heroImage ? 'white' : primaryColor }}
          >
            {event.groomName} <span className="text-2xl md:text-4xl">&</span> {event.brideName}
          </h1>
          <p className="text-lg opacity-90">
            {weddingDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </section>

      {/* Guest Greeting */}
      <section className="py-16 px-6 text-center max-w-2xl mx-auto">
        <p className="text-sm tracking-[0.2em] uppercase text-muted-foreground mb-2">Dear</p>
        <h2 className="text-2xl md:text-3xl font-serif mb-2" style={{ color: primaryColor }}>
          {guest.name}
        </h2>
        {guest.address && (
          <p className="text-muted-foreground">{guest.address}</p>
        )}
        <div className="w-16 h-px bg-current mx-auto my-8 opacity-30" />
        <p className="text-base leading-relaxed text-muted-foreground">
          {openingText}
        </p>
      </section>

      {/* Couple Section */}
      {(groomPhoto || bridePhoto || coupleImage) && (
        <section className="py-12 px-6">
          <div className="max-w-4xl mx-auto">
            {coupleImage ? (
              <div className="flex justify-center">
                <img src={coupleImage} alt="Couple" className="max-h-96 rounded-lg shadow-md object-cover" />
              </div>
            ) : (
              <div className="flex justify-center gap-8 flex-wrap">
                {groomPhoto && (
                  <div className="text-center">
                    <img src={groomPhoto} alt={event.groomName} className="w-48 h-48 object-cover rounded-full shadow-md mx-auto" />
                    <p className="mt-3 font-serif text-lg" style={{ color: primaryColor }}>{event.groomName}</p>
                  </div>
                )}
                {bridePhoto && (
                  <div className="text-center">
                    <img src={bridePhoto} alt={event.brideName} className="w-48 h-48 object-cover rounded-full shadow-md mx-auto" />
                    <p className="mt-3 font-serif text-lg" style={{ color: primaryColor }}>{event.brideName}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Event Details */}
      <section className="py-16 px-6 text-center" style={{ backgroundColor: `${primaryColor}08` }}>
        <div className="max-w-xl mx-auto space-y-8">
          {event.ceremonyTime && (
            <div>
              <h3 className="text-sm tracking-[0.2em] uppercase text-muted-foreground mb-2">Holy Ceremony</h3>
              <p className="text-xl font-serif" style={{ color: primaryColor }}>{event.ceremonyTime}</p>
            </div>
          )}
          {event.receptionTime && (
            <div>
              <h3 className="text-sm tracking-[0.2em] uppercase text-muted-foreground mb-2">Reception</h3>
              <p className="text-xl font-serif" style={{ color: primaryColor }}>{event.receptionTime}</p>
            </div>
          )}
          {event.venueName && (
            <div>
              <h3 className="text-sm tracking-[0.2em] uppercase text-muted-foreground mb-2">Venue</h3>
              <p className="text-xl font-serif" style={{ color: primaryColor }}>{event.venueName}</p>
              {event.venueAddress && (
                <p className="text-muted-foreground mt-1">{event.venueAddress}</p>
              )}
            </div>
          )}
          {event.mapUrl && (
            <a
              href={event.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-2 border rounded-full text-sm hover:bg-primary hover:text-primary-foreground transition-colors"
              style={{ borderColor: primaryColor, color: primaryColor }}
            >
              View on Map
            </a>
          )}
        </div>
      </section>

      {/* Gallery */}
      {gallery.length > 0 && (
        <section className="py-16 px-6">
          <h3 className="text-center text-sm tracking-[0.2em] uppercase text-muted-foreground mb-8">Gallery</h3>
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-4">
            {gallery.map((url, i) => (
              <img key={i} src={url} alt={`Gallery ${i + 1}`} className="w-full h-48 object-cover rounded-lg" />
            ))}
          </div>
        </section>
      )}

      {/* Closing */}
      <section className="py-16 px-6 text-center max-w-2xl mx-auto">
        <p className="text-base leading-relaxed text-muted-foreground mb-8">
          {closingText}
        </p>
        <h2 className="text-2xl font-serif" style={{ color: primaryColor }}>
          {event.groomName} & {event.brideName}
        </h2>
      </section>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-muted-foreground border-t">
        <p>Created with Inviora</p>
      </footer>
    </div>
  );
}
