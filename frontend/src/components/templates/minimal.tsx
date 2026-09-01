'use client';

import type { InvitationData } from '@/types';

function getMediaByCategory(data: InvitationData, category: string) {
  return data.media.find((m) => m.category === category)?.secureUrl;
}

export function MinimalTemplate({ data }: { data: InvitationData }) {
  const { event, guest, template } = data;
  const config = template.config;
  const primaryColor = config.primaryColor || '#000000';

  const heroImage = config.heroImage || getMediaByCategory(data, 'hero');
  const coupleImage = config.coupleImage || getMediaByCategory(data, 'couple');
  const gallery = config.gallery || [];

  const weddingDate = new Date(event.weddingDate);
  const openingText = config.openingText || event.openingText || 'You are cordially invited to celebrate with us.';
  const closingText = config.closingText || event.closingText || 'Your presence means the world to us.';

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      {/* Header */}
      <section className="pt-20 pb-12 px-6 text-center">
        <div className="max-w-lg mx-auto">
          <div className="w-8 h-px bg-neutral-300 mx-auto mb-8" />
          <p className="text-xs tracking-[0.4em] uppercase text-neutral-400 mb-6">
            Wedding Invitation
          </p>
          <h1 className="text-3xl md:text-5xl font-light tracking-wide" style={{ color: primaryColor }}>
            {event.groomName}
          </h1>
          <p className="text-xl my-2 text-neutral-400">&</p>
          <h1 className="text-3xl md:text-5xl font-light tracking-wide" style={{ color: primaryColor }}>
            {event.brideName}
          </h1>
          <div className="w-8 h-px bg-neutral-300 mx-auto mt-8" />
        </div>
      </section>

      {/* Hero Image */}
      {heroImage && (
        <section className="px-6 pb-12">
          <div className="max-w-2xl mx-auto">
            <img src={heroImage} alt="Wedding" className="w-full aspect-[3/2] object-cover" />
          </div>
        </section>
      )}

      {/* Guest */}
      <section className="py-12 px-6 text-center">
        <p className="text-xs tracking-[0.3em] uppercase text-neutral-400 mb-3">To</p>
        <h2 className="text-xl md:text-2xl font-light" style={{ color: primaryColor }}>
          {guest.name}
        </h2>
        {guest.address && (
          <p className="text-sm text-neutral-500 mt-1">{guest.address}</p>
        )}
        <p className="max-w-md mx-auto mt-6 text-sm leading-relaxed text-neutral-600">
          {openingText}
        </p>
      </section>

      {/* Couple Photo */}
      {coupleImage && (
        <section className="py-8 px-6">
          <div className="max-w-md mx-auto">
            <img src={coupleImage} alt="Couple" className="w-full aspect-square object-cover" />
          </div>
        </section>
      )}

      {/* Details */}
      <section className="py-16 px-6">
        <div className="max-w-sm mx-auto space-y-10 text-center">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-neutral-400 mb-2">Date</p>
            <p className="text-lg" style={{ color: primaryColor }}>
              {weddingDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          {(event.ceremonyTime || event.receptionTime) && (
            <div>
              <p className="text-xs tracking-[0.3em] uppercase text-neutral-400 mb-2">Time</p>
              {event.ceremonyTime && <p style={{ color: primaryColor }}>Ceremony — {event.ceremonyTime}</p>}
              {event.receptionTime && <p style={{ color: primaryColor }}>Reception — {event.receptionTime}</p>}
            </div>
          )}

          {event.venueName && (
            <div>
              <p className="text-xs tracking-[0.3em] uppercase text-neutral-400 mb-2">Location</p>
              <p style={{ color: primaryColor }}>{event.venueName}</p>
              {event.venueAddress && (
                <p className="text-sm text-neutral-500 mt-1">{event.venueAddress}</p>
              )}
            </div>
          )}

          {event.mapUrl && (
            <a
              href={event.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-xs tracking-[0.2em] uppercase border-b border-current pb-0.5 hover:opacity-70 transition-opacity"
              style={{ color: primaryColor }}
            >
              View Map
            </a>
          )}
        </div>
      </section>

      {/* Gallery */}
      {gallery.length > 0 && (
        <section className="py-12 px-6">
          <div className="max-w-2xl mx-auto grid grid-cols-2 gap-2">
            {gallery.map((url, i) => (
              <img key={i} src={url} alt={`Gallery ${i + 1}`} className="w-full aspect-square object-cover" />
            ))}
          </div>
        </section>
      )}

      {/* Closing */}
      <section className="py-16 px-6 text-center">
        <p className="max-w-md mx-auto text-sm leading-relaxed text-neutral-600 mb-6">
          {closingText}
        </p>
        <div className="w-8 h-px bg-neutral-300 mx-auto mb-4" />
        <p className="text-sm text-neutral-400">
          {event.groomName} & {event.brideName}
        </p>
      </section>
    </div>
  );
}
