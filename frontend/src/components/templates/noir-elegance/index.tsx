'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { ChevronLeft, ChevronRight, Menu, X, Copy, Check } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { UniversalAudioPlayer } from '@/components/wedding/universal-audio-player';
import { MusicController } from '@/components/wedding/music-controller';
import type { InvitationData } from '@/types';
import { noirEleganceSchema } from './schema';
import { getSafeUrl } from '@/lib/safeUrl';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import './noir-elegance.css';

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="p-1.5 rounded hover:bg-white/10 transition-colors"
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
}

export function NoirEleganceTemplate({ data }: { data: InvitationData }) {
  const { event, guest, template } = data;
  const config = template.config;

  const content = useMemo(() => {
    try {
      const raw = (config as Record<string, unknown>).noirContent || config;
      return noirEleganceSchema.parse(raw);
    } catch {
      return noirEleganceSchema.parse({});
    }
  }, [config]);

  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isOpened, setIsOpened] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Inject event data into content defaults
  const coverTitle = content.cover.title !== 'Norman & Ayumi'
    ? content.cover.title
    : `${event.groomName} & ${event.brideName}`;

  const coverDate = content.cover.date !== 'Saturday, 25th October 2025'
    ? content.cover.date
    : new Date(event.weddingDate).toLocaleDateString('en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

  // Countdown
  useEffect(() => {
    const targetStr = content.event.countdownDate !== '2027-10-25T13:00:00'
      ? content.event.countdownDate
      : event.weddingDate;
    const target = new Date(targetStr).getTime();
    if (isNaN(target)) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = target - now;
      if (diff <= 0) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / (1000 * 60)) % 60),
          seconds: Math.floor((diff / 1000) % 60),
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [content.event.countdownDate, event.weddingDate]);

  // Loading progress
  useEffect(() => {
    if (!isLoading) return;
    const duration = 2500;
    const intervalTime = 50;
    const steps = duration / intervalTime;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = Math.min(100, Math.floor((currentStep / steps) * 100));
      setLoadingProgress(progress);
      if (progress >= 100) {
        clearInterval(timer);
        setTimeout(() => setIsLoading(false), 500);
      }
    }, intervalTime);
    return () => clearInterval(timer);
  }, [isLoading]);

  const loadingImages = useMemo(() => {
    const imgs = [
      content.cover.coverImageUrl,
      content.couple.groom.profileImageUrl,
      content.couple.bride.profileImageUrl,
      ...content.gallery.images,
    ].filter(Boolean) as string[];
    if (content.cover.slideshowImages.length > 0) return content.cover.slideshowImages;
    return imgs.length > 0 ? imgs : ['https://placehold.co/1080x1920'];
  }, [content]);

  useEffect(() => {
    if (!isLoading) return;
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % loadingImages.length);
    }, 150);
    return () => clearInterval(timer);
  }, [isLoading, loadingImages.length]);

  const musicUrl =
    content.music?.trackUrl ||
    ((config as Record<string, unknown>).musicUrl as string | undefined);
  const musicEnabled =
    content.music?.enabled ??
    ((config as Record<string, unknown>).musicEnabled as boolean | undefined) ??
    false;

  const handleOpen = () => {
    setIsOpened(true);
    if (musicEnabled) setIsPlaying(true);
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
  };
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
  };

  const renderSection = (id: string, children: React.ReactNode, overlayClass = 'noir-overlay-medium') => (
    <section id={id} className="noir-section">
      <div className={`absolute inset-0 z-10 ${overlayClass}`} />
      <div className="relative z-20 flex flex-col h-full w-full">{children}</div>
    </section>
  );

  const scrollToSection = (id: string) => {
    setIsMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const navItems = [
    { id: 'cover-clean', label: 'Home' },
    ...(content.verse.enabled ? [{ id: 'verse', label: 'Verse' }] : []),
    { id: 'groom', label: 'Groom' },
    { id: 'bride', label: 'Bride' },
    ...(content.story.enabled ? [{ id: 'story', label: 'Our Story' }] : []),
    { id: 'event', label: 'Event' },
    { id: 'countdown', label: 'Countdown' },
    ...(content.dressCode.enabled ? [{ id: 'dress-code', label: 'Dress Code' }] : []),
    { id: 'gallery', label: 'Gallery' },
    ...(content.gift.enabled ? [{ id: 'gift', label: 'Gift' }] : []),
    { id: 'closing', label: 'Closing' },
  ];

  const groomName = content.couple.groom.name !== 'Norman Utojo'
    ? content.couple.groom.name : event.groomName;
  const brideName = content.couple.bride.name !== 'Judee Ayumi Yoshino'
    ? content.couple.bride.name : event.brideName;

  const ceremonyVenue = content.event.ceremony.venue !== 'St. John Church'
    ? content.event.ceremony.venue : (event.venueName || content.event.ceremony.venue);
  const ceremonyAddr = content.event.ceremony.address !== 'Jl. Melawai Raya, Jakarta Selatan'
    ? content.event.ceremony.address : (event.venueAddress || content.event.ceremony.address);
  const ceremonyTime = content.event.ceremony.time !== '13:00 - 15:00'
    ? content.event.ceremony.time : (event.ceremonyTime || content.event.ceremony.time);
  const receptionTime = content.event.reception.time !== '19:00 - 22:00'
    ? content.event.reception.time : (event.receptionTime || content.event.reception.time);

  return (
    <div className="noir-elegance min-h-screen w-full relative">
      <UniversalAudioPlayer
        url={musicUrl}
        enabled={musicEnabled}
        isPlaying={isPlaying}
        isOpened={isOpened}
      />
      {isOpened && (
        <MusicController
          isPlaying={isPlaying}
          onToggle={() => setIsPlaying(!isPlaying)}
          accentColor="#FFFFFF"
        />
      )}

      {/* LOADING SCREEN */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="fixed inset-0 z-[200] bg-[#101010] flex items-center justify-center overflow-hidden"
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 1, ease: [0.65, 0, 0.35, 1] }}
          >
            <div className="relative flex flex-col items-center justify-center">
              <div className="overflow-hidden mb-6">
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.8, ease: [0.33, 1, 0.68, 1] }}
                  className="text-[10px] uppercase tracking-[5px] text-white text-center"
                >
                  {content.cover.subtitle}
                </motion.div>
              </div>
              <div className="w-[180px] h-[240px] md:w-[240px] md:h-[320px] overflow-hidden relative shadow-2xl">
                <img
                  src={getSafeUrl(loadingImages[currentImageIndex]) || 'https://placehold.co/1080x1920'}
                  alt="loading"
                  className="w-full h-full object-cover filter grayscale opacity-80"
                />
                <div className="absolute inset-0 bg-black/20" />
              </div>
              <div className="overflow-hidden mt-6">
                <motion.div
                  initial={{ y: '-100%' }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.8, ease: [0.33, 1, 0.68, 1], delay: 0.2 }}
                  className="font-ovo text-3xl md:text-4xl text-white tracking-[2px] text-center"
                >
                  {coverTitle}
                </motion.div>
              </div>
            </div>
            <div className="absolute bottom-10 left-10 flex items-center gap-4">
              <span className="text-[10px] font-bold text-white tracking-[2px] w-8">{loadingProgress}%</span>
              <div className="w-32 h-[1px] bg-white/20">
                <motion.div className="h-full bg-white" initial={{ width: '0%' }} animate={{ width: `${loadingProgress}%` }} transition={{ ease: 'linear', duration: 0.1 }} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN LAYOUT */}
      <div className="noir-layout w-full h-screen overflow-hidden">
        {/* LEFT PANEL (Desktop) */}
        <div className="noir-panel-left hidden lg:block relative">
          <img src={getSafeUrl(content.cover.coverImageUrl) || 'https://placehold.co/1080x1920'} alt="Hero" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute inset-0 flex flex-col items-center justify-end text-center p-12">
            <h1 className="text-l mb-4 tracking-[5px]">{coverTitle}</h1>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="noir-panel-right relative w-full h-screen">
          {/* COVER OVERLAY */}
          <AnimatePresence>
            {!isOpened && (
              <motion.div
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, y: '-100%' }}
                transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
                className="absolute inset-0 z-[100] flex flex-col items-center justify-start bg-black overflow-hidden"
              >
                <div className="absolute inset-0">
                  <img src={getSafeUrl(content.cover.coverImageUrl) || 'https://placehold.co/1080x1920'} alt="Cover" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40" />
                </div>
                <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="relative z-10 flex flex-col items-center text-center px-6 pt-8">
                  <motion.span variants={itemVariants} className="text-[10px] uppercase tracking-[3px] mb-4 opacity-80 block">{content.cover.subtitle}</motion.span>
                  <motion.h1 variants={itemVariants} className="text-3xl md:text-3xl mb-2 tracking-[2px]">{coverTitle}</motion.h1>
                  <motion.span variants={itemVariants} className="text-[10px] uppercase tracking-[2px] mb-12 opacity-80 block">{coverDate}</motion.span>
                  <motion.div variants={itemVariants} className="p-8 max-w-xs w-full mb-8">
                    <span className="text-[10px] uppercase tracking-[1px] block mb-2 opacity-70 italic">Dear,</span>
                    <span className="text-lg font-ovo block mb-1">{guest.name}</span>
                    {guest.address && <p className="text-[9px] opacity-60 mb-6 italic">{guest.address}</p>}
                    <button onClick={handleOpen} className="bg-[#D5D5D5] text-[#252525] text-[10px] font-bold tracking-[2px] px-10 py-3 rounded-sm uppercase hover:bg-white transition-colors">
                      Open
                    </button>
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* MOBILE BURGER */}
          <AnimatePresence>
            {isOpened && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed top-6 right-6 z-[150] lg:hidden">
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="w-10 h-10 rounded-full bg-black/50 border border-white/20 flex items-center justify-center text-white backdrop-blur-md">
                  {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* MOBILE NAV */}
          <AnimatePresence>
            {isMenuOpen && (
              <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMenuOpen(false)} className="fixed inset-0 z-[130] bg-black/60 backdrop-blur-sm lg:hidden" />
                <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }} className="fixed top-0 right-0 bottom-0 w-[280px] z-[140] bg-[#101010]/95 backdrop-blur-lg flex flex-col items-center justify-center lg:hidden border-l border-white/10">
                  <div className="flex flex-col items-center gap-8 w-full px-6">
                    {navItems.map((item, idx) => (
                      <motion.button key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + idx * 0.05, duration: 0.4 }} onClick={() => scrollToSection(item.id)} className="text-[13px] uppercase tracking-[3px] font-medium text-white/80 hover:text-white transition-colors">
                        {item.label}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* SCROLLABLE CONTENT */}
          <div className={`noir-scroller no-scrollbar w-full h-full ${!isOpened ? 'overflow-hidden' : 'overflow-y-auto'}`}>
            {/* 1. COVER CLEAN */}
            {renderSection('cover-clean', (
              <div className="flex flex-col h-full items-center justify-start text-center p-6 pt-8">
                <img src={getSafeUrl(content.cover.coverImageUrl) || 'https://placehold.co/1080x1920'} alt="Bg" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 z-0" />
                <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} className="relative z-10 flex flex-col items-center">
                  <motion.span variants={itemVariants} className="text-[10px] uppercase tracking-[3px] mb-4 opacity-80 block">{content.cover.subtitle}</motion.span>
                  <motion.h1 variants={itemVariants} className="text-3xl mb-2 tracking-[2px]">{coverTitle}</motion.h1>
                  <motion.span variants={itemVariants} className="text-[10px] uppercase tracking-[2px] opacity-80 block">{coverDate}</motion.span>
                </motion.div>
              </div>
            ), 'noir-overlay-medium')}

            {/* 2. VERSE */}
            {content.verse.enabled && (
              <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }}>
                {renderSection('verse', (
                  <div className="flex flex-col h-full items-start justify-start text-left p-10">
                    {getSafeUrl(content.verse.backgroundImageUrl) && <img src={getSafeUrl(content.verse.backgroundImageUrl)!} alt="Bg" className="absolute inset-0 w-full h-full object-cover" />}
                    <div className="relative z-10 max-w-sm">
                      <motion.p variants={itemVariants} className="text-[13px] leading-[1.8] mb-6 italic opacity-90">{content.verse.quote}</motion.p>
                      <motion.span variants={itemVariants} className="text-[11px] uppercase tracking-[2px] font-bold block">{content.verse.source}</motion.span>
                    </div>
                  </div>
                ), 'noir-overlay-light')}
              </motion.div>
            )}

            {/* 3. GROOM */}
            {renderSection('groom', (
              <div className="flex flex-col h-full justify-end p-10">
                <img src={getSafeUrl(content.couple.groom.profileImageUrl) || 'https://placehold.co/800x1200'} alt="Groom" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10" />
                <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} className="relative z-20">
                  <motion.span variants={itemVariants} className="text-[10px] uppercase tracking-[3px] font-times block mb-4">{content.couple.groom.label}</motion.span>
                  <motion.h2 variants={itemVariants} className="text-4xl mb-4 tracking-[1px]">{groomName}</motion.h2>
                  <motion.div variants={itemVariants} className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="text-[11px] opacity-80">{content.couple.groom.parentDescription}</span>
                      <span className="text-[11px] text-[var(--silver)]">{content.couple.groom.parentNames}</span>
                    </div>
                    <div className="h-[1px] flex-grow bg-white/40" />
                  </motion.div>
                </motion.div>
              </div>
            ), '')}

            {/* 4. BRIDE */}
            {renderSection('bride', (
              <div className="flex flex-col h-full justify-end p-10">
                <img src={getSafeUrl(content.couple.bride.profileImageUrl) || 'https://placehold.co/800x1200'} alt="Bride" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10" />
                <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} className="relative z-20">
                  <motion.span variants={itemVariants} className="text-[10px] uppercase tracking-[3px] font-times block mb-4">{content.couple.bride.label}</motion.span>
                  <motion.h2 variants={itemVariants} className="text-4xl mb-4 tracking-[1px]">{brideName}</motion.h2>
                  <motion.div variants={itemVariants} className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="text-[11px] opacity-80">{content.couple.bride.parentDescription}</span>
                      <span className="text-[11px] text-[var(--silver)]">{content.couple.bride.parentNames}</span>
                    </div>
                    <div className="h-[1px] flex-grow bg-white/40" />
                  </motion.div>
                </motion.div>
              </div>
            ), '')}

            {/* 5. STORY */}
            {content.story.enabled && renderSection('story', (
              <div className="flex flex-col h-full p-10 justify-center">
                {getSafeUrl(content.story.backgroundImageUrl) && <img src={getSafeUrl(content.story.backgroundImageUrl)!} alt="Bg" className="absolute inset-0 w-full h-full object-cover" />}
                <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} className="relative z-10">
                  <motion.h2 variants={itemVariants} className="text-4xl mb-12 tracking-[2px]">{content.story.title}</motion.h2>
                  <div className="space-y-8">
                    {content.story.milestones.map((item, idx) => (
                      <motion.div variants={itemVariants} key={idx} className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-[1px] font-times mb-2 block">{item.date}</span>
                        <p className="text-[11px] leading-relaxed opacity-80">{item.description}</p>
                      </motion.div>
                    ))}
                  </div>
                  <motion.div variants={itemVariants} className="mt-12 flex items-center gap-4">
                    <div className="h-[1px] flex-grow bg-white/20" />
                    <span className="text-[11px] uppercase tracking-[5.5px] font-ovo">{coverTitle}</span>
                  </motion.div>
                </motion.div>
              </div>
            ), 'noir-overlay-heavy')}

            {/* 6. EVENT */}
            {renderSection('event', (
              <div className="flex flex-col h-full p-10 justify-center items-center text-center">
                {getSafeUrl(content.event.backgroundImageUrl) && <img src={getSafeUrl(content.event.backgroundImageUrl)!} alt="Bg" className="absolute inset-0 w-full h-full object-cover" />}
                <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} className="relative z-10 space-y-12">
                  <motion.div variants={itemVariants} className="space-y-6">
                    <span className="text-[10px] uppercase tracking-[3px] opacity-70 block">Save Our Date</span>
                    <h2 className="text-[11px] font-bold uppercase tracking-[2.5px]">{coverDate}</h2>
                  </motion.div>
                  <motion.div variants={itemVariants} className="space-y-4">
                    <h3 className="text-2xl">{content.event.ceremony.title}</h3>
                    <p className="text-sm font-bold">{ceremonyTime}</p>
                    <div className="space-y-1">
                      <p className="text-[11px] font-bold">{ceremonyVenue}</p>
                      <p className="text-[9px] opacity-70 max-w-[250px] mx-auto">{ceremonyAddr}</p>
                    </div>
                    {getSafeUrl(content.event.ceremony.mapUrl) && (
                      <a href={getSafeUrl(content.event.ceremony.mapUrl)} target="_blank" rel="noreferrer" className="inline-block bg-white/50 px-6 py-2 rounded-sm text-[11px] font-bold tracking-[1px] uppercase">Google Maps</a>
                    )}
                  </motion.div>
                  <motion.div variants={itemVariants} className="space-y-4">
                    <h3 className="text-2xl">{content.event.reception.title}</h3>
                    <p className="text-sm font-bold">{receptionTime}</p>
                    <div className="space-y-1">
                      <p className="text-[11px] font-bold">{content.event.reception.venue}</p>
                      <p className="text-[9px] opacity-70 max-w-[250px] mx-auto">{content.event.reception.address}</p>
                    </div>
                    {getSafeUrl(content.event.reception.mapUrl) && (
                      <a href={getSafeUrl(content.event.reception.mapUrl)} target="_blank" rel="noreferrer" className="inline-block bg-white/50 px-6 py-2 rounded-sm text-[11px] font-bold tracking-[1px] uppercase">Google Maps</a>
                    )}
                  </motion.div>
                </motion.div>
              </div>
            ), 'noir-overlay-heavy')}

            {/* 7. COUNTDOWN */}
            {renderSection('countdown', (
              <div className="flex flex-col h-full p-10 justify-start items-center text-center">
                {getSafeUrl(content.event.countdownBackgroundImageUrl) && <img src={getSafeUrl(content.event.countdownBackgroundImageUrl)!} alt="Bg" className="absolute inset-0 w-full h-full object-cover blur-[2px]" />}
                <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} className="relative z-10 w-full max-w-[300px]">
                  <div className="grid grid-cols-4 gap-4">
                    {[
                      { label: 'Days', val: timeLeft.days },
                      { label: 'Hours', val: timeLeft.hours },
                      { label: 'Minutes', val: timeLeft.minutes },
                      { label: 'Seconds', val: timeLeft.seconds },
                    ].map((item, idx) => (
                      <motion.div variants={itemVariants} key={idx} className="flex flex-col items-center gap-1">
                        <div className="w-full aspect-square bg-white/10 backdrop-blur-md rounded-[5px] flex items-center justify-center border border-white/10">
                          <span className="text-xl font-medium">{item.val}</span>
                        </div>
                        <span className="text-[8px] uppercase tracking-[1.5px] opacity-80 block">{item.label}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>
            ), 'noir-overlay-heavy')}

            {/* DRESS CODE */}
            {content.dressCode.enabled && renderSection('dress-code', (
              <div className="flex flex-col h-full p-10 justify-end items-center text-center">
                {getSafeUrl(content.dressCode.backgroundImageUrl) && <img src={getSafeUrl(content.dressCode.backgroundImageUrl)!} alt="Bg" className="absolute inset-0 w-full h-full object-cover" />}
                <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} className="relative z-10 space-y-8">
                  <motion.div variants={itemVariants} className="space-y-4">
                    <span className="text-xs tracking-[1px] block">{coverTitle}</span>
                    <h2 className="text-3xl tracking-[2px] uppercase">Dress Codes</h2>
                  </motion.div>
                  <motion.p variants={itemVariants} className="text-[10px] opacity-80 max-w-[300px] leading-relaxed mx-auto">{content.dressCode.description}</motion.p>
                  <motion.div variants={itemVariants} className="flex justify-center gap-4">
                    {content.dressCode.colors.map((color, idx) => (
                      <div key={idx} className="w-[39px] h-[39px] rounded-full border border-white/30" style={{ backgroundColor: color }} />
                    ))}
                  </motion.div>
                </motion.div>
              </div>
            ), 'noir-overlay-medium')}

            {/* 9. GIFT */}
            {content.gift.enabled && renderSection('gift', (
              <div className="flex flex-col h-full p-10 justify-end items-center text-center">
                {getSafeUrl(content.gift.backgroundImageUrl) && <img src={getSafeUrl(content.gift.backgroundImageUrl)!} alt="Bg" className="absolute inset-0 w-full h-full object-cover" />}
                <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} className="relative z-10 w-full space-y-8">
                  {getSafeUrl(content.gift.thumbnailImageUrl) && (
                    <motion.div variants={itemVariants} className="w-[180px] h-[180px] mx-auto overflow-hidden rounded-sm shadow-2xl">
                      <img src={getSafeUrl(content.gift.thumbnailImageUrl)!} alt="Gift" className="w-full h-full object-cover" />
                    </motion.div>
                  )}
                  <motion.h2 variants={itemVariants} className="text-3xl tracking-[1px]">{content.gift.title}</motion.h2>
                  <motion.p variants={itemVariants} className="text-[10px] opacity-80 leading-relaxed max-w-[320px] mx-auto">{content.gift.description}</motion.p>
                  <motion.div variants={itemVariants} className="space-y-3 w-full">
                    {content.gift.accounts.map((acc, idx) => (
                      <div key={idx} className="flex items-center gap-3 w-full">
                        <div className="flex-1 flex flex-col text-left">
                          <span className="text-[12px]">{acc.accountHolder}</span>
                        </div>
                        <div className="flex-[2] bg-white/20 p-2.5 rounded-sm flex items-center justify-between gap-2 border border-white/10">
                          <div className="flex flex-col text-left">
                            <span className="text-[8px] uppercase tracking-wider opacity-70">{acc.bankName}</span>
                            <span className="text-[11px] font-bold">{acc.accountNumber}</span>
                          </div>
                          <CopyBtn text={acc.accountNumber} />
                        </div>
                      </div>
                    ))}
                  </motion.div>
                </motion.div>
              </div>
            ), 'noir-overlay-heavy')}

            {/* 10. GALLERY */}
            {renderSection('gallery', (
              <div className="flex flex-col h-full p-6 justify-center items-center text-center">
                <motion.h2 variants={itemVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} className="text-[13px] tracking-[4px] font-bold uppercase mb-8">
                  {content.gallery.title}
                </motion.h2>
                <div className="w-full h-[60%] relative group">
                  <Swiper
                    modules={[Navigation, Pagination, Autoplay]}
                    spaceBetween={20}
                    slidesPerView={1}
                    loop
                    autoplay={{ delay: 3000, disableOnInteraction: false }}
                    pagination={{ type: 'fraction' }}
                    navigation={{ nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' }}
                    className="noir-gallery-swiper h-full"
                  >
                    {(content.gallery.images.length > 0
                      ? content.gallery.images
                      : [1, 2, 3].map((i) => `https://placehold.co/800x1200?text=Gallery+${i}`)
                    ).map((img, idx) => (
                      <SwiperSlide key={idx}>
                        <div className="w-full h-full relative overflow-hidden rounded-sm">
                          <img src={typeof img === 'string' ? (getSafeUrl(img) || 'https://placehold.co/800x1200') : 'https://placehold.co/800x1200'} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/10" />
                        </div>
                      </SwiperSlide>
                    ))}
                    <button className="swiper-button-prev absolute left-2 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"><ChevronLeft size={30} /></button>
                    <button className="swiper-button-next absolute right-2 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"><ChevronRight size={30} /></button>
                  </Swiper>
                </div>
              </div>
            ), 'noir-overlay-medium')}

            {/* 11. CLOSING */}
            {renderSection('closing', (
              <div className="flex flex-col h-full p-10 justify-center items-center text-center">
                {getSafeUrl(content.closing.backgroundImageUrl) && <img src={getSafeUrl(content.closing.backgroundImageUrl)!} alt="Bg" className="absolute inset-0 w-full h-full object-cover" />}
                <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} className="relative z-10 space-y-4">
                  <motion.span variants={itemVariants} className="text-[10px] uppercase tracking-[3.5px] text-[var(--alto)] block">{content.closing.title}</motion.span>
                  <motion.p variants={itemVariants} className="text-[11px] leading-relaxed text-[var(--mercury)] max-w-[280px] mx-auto italic">{content.closing.text}</motion.p>
                  <motion.div variants={itemVariants} className="pt-4 flex items-center justify-center gap-4">
                    <div className="h-[1px] w-8 bg-white/30" />
                    <span className="text-xl font-ovo tracking-[3px]">{coverTitle}</span>
                    <div className="h-[1px] w-8 bg-white/30" />
                  </motion.div>
                </motion.div>
                <div className="relative z-10 pb-8 mt-auto">
                  <p className="text-[8px] tracking-[2px] opacity-40 uppercase">Created with Inviora</p>
                </div>
              </div>
            ), 'noir-overlay-heavy')}
          </div>
        </div>
      </div>
    </div>
  );
}
