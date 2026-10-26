'use client';

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { InvitationData } from '@/types';
import { UniversalAudioPlayer } from '@/components/wedding/universal-audio-player';
import { getSafeUrl } from '@/lib/safeUrl';
import { callaHandFont, callaSansFont } from './fonts';
import { parseCallaContent } from './parse-calla-content';
import { TransferConfirmationForm } from './transfer-confirmation-form';
import {
  buildCalendar,
  formatLongDateId,
  formatShortDate,
  formatTimeId,
  monthNameEn,
  pad2,
  parseDateParts,
} from './format';
import './calla-bloom.css';

/* -------------------------------------------------------------------------- */
/*  Layout primitives (576-unit design space, see calla-bloom.css)             */
/* -------------------------------------------------------------------------- */

const ASSET = '/templates/calla-bloom';
const u = (n: number) => `calc(${n} * var(--cb-u))`;

const SecContext = createContext(0);

function Sec({
  top,
  h,
  className = '',
  children,
}: {
  top: number;
  /** Section height in design units. Omit for sections that size themselves to their content. */
  h?: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <SecContext.Provider value={top}>
      <section
        className={`cb-sec ${className}`}
        style={h === undefined ? undefined : { height: u(h) }}
      >
        {children}
      </section>
    </SecContext.Provider>
  );
}

type AnimStyle = React.CSSProperties & Record<`--cb-${string}`, string>;

function anim(kind: 'rise' | 'soft' | 'wipe' | 'fade' | 'pop', delay: number, dur?: number) {
  const style: AnimStyle = { '--cb-d': `${delay}s` };
  if (dur) style['--cb-t'] = `${dur}s`;
  return { className: `cb-in-${kind}`, style };
}

type RvKind = 'rise' | 'soft' | 'wipe' | 'fade' | 'pop' | 'left' | 'right';

/**
 * Scroll reveal: the element stays hidden until it first scrolls into view, then plays
 * its entrance once (see the `cb-rv` rules in calla-bloom.css and the observer below).
 * `delay` only sequences elements that enter the viewport together.
 */
function rv(kind: RvKind, delay = 0, dur?: number) {
  const style: AnimStyle = {};
  if (delay) style['--cb-d'] = `${delay}s`;
  if (dur) style['--cb-t'] = `${dur}s`;
  return { className: `cb-rv cb-rv-${kind}`, style };
}

/** A word of the hero title: rises into place on load. */
function word(delay: number) {
  const a = anim('rise', delay);
  return { className: `cb-word ${a.className}`, style: a.style };
}

function Img({
  src,
  x,
  y,
  w,
  h,
  alt = '',
  className = '',
  style,
}: {
  src: string;
  x: number;
  y: number;
  w: number;
  h: number;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const top = useContext(SecContext);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={`cb-img ${className}`}
      src={src}
      alt={alt}
      draggable={false}
      style={{ left: u(x), top: u(y - top), width: u(w), height: u(h), ...style }}
    />
  );
}

function Box({
  x,
  y,
  w,
  h,
  className = '',
  style,
  children,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}) {
  const top = useContext(SecContext);
  return (
    <div
      className={`cb-abs ${className}`}
      style={{ left: u(x), top: u(y - top), width: u(w), height: u(h), ...style }}
    >
      {children}
    </div>
  );
}

/**
 * Single-line text positioned by the top of its line box (page coordinates).
 * `cx` centres the text on a design x; `left` aligns it from a design x.
 */
function Txt({
  y,
  size,
  font,
  color = '',
  cx = 288,
  left,
  right,
  ls,
  sx,
  sy,
  weight,
  className = '',
  style,
  children,
}: {
  y: number;
  size: number;
  font: 'hand' | 'sans';
  color?: string;
  cx?: number;
  left?: number;
  right?: number;
  ls?: number;
  sx?: number;
  sy?: number;
  weight?: number;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const top = useContext(SecContext);
  const pos: React.CSSProperties =
    left !== undefined
      ? { left: u(left), width: u(576 - left), textAlign: 'left' }
      : right !== undefined
        ? { left: 0, width: u(right), textAlign: 'right' }
        : { left: u(cx - 288), width: u(576), textAlign: 'center' };
  return (
    <p
      className={`cb-t cb-${font} ${color} ${className}`}
      style={{
        top: u(y - top),
        fontSize: u(size),
        ...(ls !== undefined ? { letterSpacing: u(ls) } : {}),
        ...(weight !== undefined ? { fontWeight: weight } : {}),
        ...pos,
        ...style,
      }}
    >
      {sx !== undefined || sy !== undefined ? (
        // The scale lives on an inner box so it never fights the entrance animation transform.
        <span
          style={{
            display: 'inline-block',
            transform: `scale(${sx ?? 1}, ${sy ?? 1})`,
            transformOrigin:
              left !== undefined ? 'left center' : right !== undefined ? 'right center' : 'center',
          }}
        >
          {children}
        </span>
      ) : (
        children
      )}
    </p>
  );
}

/** Wrapped paragraph (fixed width, centred at 288). */
function Para({
  y,
  w,
  size,
  lineHeight,
  className = '',
  style,
  children,
}: {
  y: number;
  w: number;
  size: number;
  lineHeight: number;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const top = useContext(SecContext);
  return (
    <p
      className={`cb-abs cb-sans ${className}`}
      style={{
        left: u(288 - w / 2),
        top: u(y - top),
        width: u(w),
        margin: 0,
        fontSize: u(size),
        lineHeight: u(lineHeight),
        textAlign: 'center',
        ...style,
      }}
    >
      {children}
    </p>
  );
}

/**
 * Top of a (line-height: 1) text box so that, after a vertical scale of `sy` around the
 * box centre, the glyph ink starts at `ink`. `off` is the ink top offset as a fraction of
 * the font size (measured per font).
 */
function boxTop(ink: number, size: number, off: number, sy = 1) {
  return ink - (off * size - size / 2) * sy - size / 2;
}

/** Shrinks a font size when user supplied text is much longer than the reference text. */
function fit(size: number, text: string, maxChars: number) {
  const len = Math.max(text.length, 1);
  return len > maxChars ? (size * maxChars) / len : size;
}

/* -------------------------------------------------------------------------- */
/*  Vector pieces                                                              */
/* -------------------------------------------------------------------------- */

/** Five point star as measured from the reference (radius, inner ratio, rotation in degrees). */
function starPoints(R: number, ratio: number, rotDeg: number) {
  const pts: string[] = [];
  for (let k = 0; k < 5; k += 1) {
    const a = ((rotDeg + k * 72) * Math.PI) / 180;
    const b = ((rotDeg + k * 72 + 36) * Math.PI) / 180;
    pts.push(`${(R * Math.cos(a)).toFixed(2)},${(R * Math.sin(a)).toFixed(2)}`);
    pts.push(`${(R * ratio * Math.cos(b)).toFixed(2)},${(R * ratio * Math.sin(b)).toFixed(2)}`);
  }
  return pts.join(' ');
}

const HERO_STAR = starPoints(40, 0.453, 175.4);
const CAL_STAR = starPoints(29.37, 0.436, 181.7);

/** Double rule frame with notched corners used for the bank cards. */
function CardFrame({ w, h }: { w: number; h: number }) {
  const notch = (inset: number, r: number) => {
    const x0 = inset;
    const y0 = inset;
    const x1 = w - inset;
    const y1 = h - inset;
    return [
      `M ${x0 + r} ${y0}`,
      `H ${x1 - r}`,
      `A ${r} ${r} 0 0 0 ${x1} ${y0 + r}`,
      `V ${y1 - r}`,
      `A ${r} ${r} 0 0 0 ${x1 - r} ${y1}`,
      `H ${x0 + r}`,
      `A ${r} ${r} 0 0 0 ${x0} ${y1 - r}`,
      `V ${y0 + r}`,
      `A ${r} ${r} 0 0 0 ${x0 + r} ${y0}`,
      'Z',
    ].join(' ');
  };
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width="100%"
      height="100%"
      style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
      aria-hidden="true"
    >
      <path d={notch(1, 11)} fill="#ffffff" stroke="#a9b08c" strokeWidth="0.9" />
      <path d={notch(5.5, 8)} fill="none" stroke="#a9b08c" strokeWidth="0.75" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  Template                                                                   */
/* -------------------------------------------------------------------------- */

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const CAL_COLS = [108.5, 165, 221.5, 278.5, 336, 386.5, 440];
const CAL_ROW_TOPS = [2781.8, 2815.4, 2847.4, 2880.4, 2913.4];
const calRowTop = (r: number) =>
  CAL_ROW_TOPS[r] ?? CAL_ROW_TOPS[CAL_ROW_TOPS.length - 1] + (r - (CAL_ROW_TOPS.length - 1)) * 33;
function findDayCell(rows: { day: number | null }[][], day: number | null) {
  for (let r = 0; r < rows.length; r += 1) {
    for (let c = 0; c < 7; c += 1) {
      if (day !== null && rows[r][c].day === day) return { r, c };
    }
  }
  return { r: 1, c: 5 };
}
const COUNT_CENTERS = [142, 240, 336.5, 432.5];
const COLON_CENTERS = [190.5, 288, 385.5];
const LABEL_CENTERS = [142.5, 239.5, 337, 433.5];

function buildEmbedUrl(
  explicit: string,
  mapUrl: string | null,
  venue: string,
  address: string | null
): string | null {
  const safeExplicit = getSafeUrl(explicit);
  if (safeExplicit) return safeExplicit;
  const safeMap = getSafeUrl(mapUrl);
  if (safeMap && /google\.[^/]+\/maps\/embed/.test(safeMap)) return safeMap;
  const query = [venue, address].filter(Boolean).join(', ');
  if (!query) return null;
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
}

export function CallaBloomTemplate({ data }: { data: InvitationData }) {
  const { event, template } = data;
  const config = template.config as Record<string, unknown>;
  const rootRef = useRef<HTMLDivElement>(null);

  const content = useMemo(() => parseCallaContent(config.callaContent), [config.callaContent]);

  /* ---- dynamic values (all from the invitation data) ---- */
  const dateParts = useMemo(() => parseDateParts(event.weddingDate), [event.weddingDate]);
  const brideName = content.couple.brideName || event.brideName;
  const groomName = content.couple.groomName || event.groomName;
  const heroNames = `${brideName} & ${groomName}`;
  const heroDate = content.hero.dateLabel || formatShortDate(dateParts);
  const longDate = formatLongDateId(dateParts);
  const akadDate = content.schedule.akadDateLabel || longDate;
  const akadTime = content.schedule.akadTimeLabel || formatTimeId(event.ceremonyTime);
  const receptionDate = content.schedule.receptionDateLabel || longDate;
  const receptionTime = content.schedule.receptionTimeLabel || formatTimeId(event.receptionTime);
  const venueName = content.location.venueName || event.venueName || '';
  const mapEmbed = buildEmbedUrl(
    content.location.mapEmbedUrl,
    event.mapUrl,
    venueName,
    event.venueAddress
  );
  const mapLink =
    getSafeUrl(event.mapUrl) ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      [venueName, event.venueAddress].filter(Boolean).join(', ')
    )}`;
  const calendarRows = useMemo(() => (dateParts ? buildCalendar(dateParts) : []), [dateParts]);
  const starCell = findDayCell(calendarRows, dateParts?.day ?? null);
  const accounts = content.gift.accounts.filter((a) => a.bankName || a.accountNumber);

  /* ---- scroll reveal: mark every `.cb-rv` element the first time it enters the view ---- */
  const accountCount = accounts.length;
  const calendarRowCount = calendarRows.length;
  const hasMap = Boolean(mapEmbed);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const targets = Array.from(root.querySelectorAll<HTMLElement>('.cb-rv:not([data-cb-seen])'));
    if (targets.length === 0) return;
    const show = (el: Element) => el.setAttribute('data-cb-seen', '');
    if (typeof IntersectionObserver === 'undefined') {
      targets.forEach(show);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Also reveal anything already scrolled past (e.g. a restored scroll position).
          if (entry.isIntersecting || entry.boundingClientRect.bottom < 0) {
            show(entry.target);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
    );
    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
    // Re-scan when optional elements (accounts, calendar, map, origins) appear or disappear.
  }, [content, accountCount, calendarRowCount, hasMap]);

  /* ---- countdown ---- */
  const [left, setLeft] = useState<number[]>([0, 0, 0, 0]);
  const countdownTarget = content.countdown.targetDate || event.weddingDate;
  useEffect(() => {
    const target = new Date(countdownTarget).getTime();
    if (Number.isNaN(target)) return;
    const tick = () => {
      const diff = Math.max(0, target - Date.now());
      setLeft([
        Math.floor(diff / 86400000),
        Math.floor((diff / 3600000) % 24),
        Math.floor((diff / 60000) % 60),
        Math.floor((diff / 1000) % 60),
      ]);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [countdownTarget]);

  /* ---- music (self managed: the star in the hero is the control) ---- */
  const musicUrl = (config.musicUrl as string | undefined) || undefined;
  const musicEnabled = Boolean(config.musicEnabled && musicUrl);
  const [isPlaying, setIsPlaying] = useState(false);

  /* ---- copy account number ---- */
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const copyAccount = async (idx: number, value: string) => {
    let ok = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        ok = true;
      }
    } catch {
      ok = false;
    }
    if (!ok) {
      // Phones opening the page over plain http (or older WebViews) have no async clipboard.
      const ta = document.createElement('textarea');
      ta.value = value;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;font-size:16px';
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, value.length);
      try {
        ok = document.execCommand('copy');
      } catch {
        ok = false;
      }
      document.body.removeChild(ta);
    }
    if (ok) {
      setCopiedIdx(idx);
      window.setTimeout(() => setCopiedIdx((cur) => (cur === idx ? null : cur)), 1800);
    }
  };

  const brideFace = getSafeUrl(content.couple.brideFaceImageUrl) || `${ASSET}/face_bride.webp`;
  const groomFace = getSafeUrl(content.couple.groomFaceImageUrl) || `${ASSET}/face_groom.webp`;
  const tagsImage = getSafeUrl(content.couple.tagsImageUrl) || `${ASSET}/tags.webp`;

  const giftExtra = Math.max(0, accounts.length - 2);
  const giftHeight = accounts.length === 0 ? 520 : 1100 + giftExtra * 240;

  return (
    <div ref={rootRef} className={`calla-bloom ${callaHandFont.variable} ${callaSansFont.variable}`}>
      <UniversalAudioPlayer
        url={musicUrl}
        enabled={musicEnabled}
        isPlaying={isPlaying}
        isOpened={true}
      />

      <div className="cb-column">
        {/* ============================ HERO ============================ */}
        <Sec top={0} h={1014}>
          <Img src={`${ASSET}/hero_top.webp`} x={268} y={0} w={308} h={214} {...anim('wipe', 0.1, 0.7)} />

          <Txt y={196.6} size={78.4} font="hand" color="cb-olive">
            <span {...word(0.33)}>{content.hero.titleLine1.split(' ')[0]}</span>
            {content.hero.titleLine1.includes(' ') && ' '}
            {content.hero.titleLine1.includes(' ') && (
              <span {...word(0.47)}>
                {content.hero.titleLine1.split(' ').slice(1).join(' ')}
              </span>
            )}
          </Txt>
          <Txt y={272.5} size={78.2} font="hand" color="cb-olive">
            <span {...word(0.67)}>{content.hero.titleLine2.split(' ')[0]}</span>
            {content.hero.titleLine2.includes(' ') && ' '}
            {content.hero.titleLine2.includes(' ') && (
              <span {...word(0.8)}>
                {content.hero.titleLine2.split(' ').slice(1).join(' ')}
              </span>
            )}
          </Txt>
          <Txt y={356.7} size={69.1} font="hand" color="cb-olive">
            <span {...word(0.93)}>{content.hero.titleLine3}</span>
          </Txt>

          <Img src={groomFace} x={299.4} y={450.8} w={130} h={164} {...anim('wipe', 0.27, 0.45)} />
          <Img src={brideFace} x={141.6} y={458} w={131} h={180} {...anim('wipe', 0.4, 0.45)} />

          <Txt
            y={boxTop(656, fit(55.6, heroNames, 20), 0.14, 1.11)}
            size={fit(55.6, heroNames, 20)}
            sx={0.88}
            sy={1.11}
            cx={277.5}
            font="hand"
            color="cb-maroon"
            {...anim('soft', 0.55)}
          >
            {heroNames}
          </Txt>
          <Txt
            y={boxTop(725, 45, 0.16, 0.97)}
            size={45}
            sx={1.03}
            sy={0.97}
            font="hand"
            color="cb-maroon"
            {...anim('wipe', 0.63, 0.55)}
          >
            {heroDate}
          </Txt>

          <Img src={`${ASSET}/hero_lilies.webp`} x={0} y={730} w={321} h={278} {...anim('fade', 0.63, 0.5)} />
          <Img src={`${ASSET}/hero_tail.webp`} x={176} y={966} w={145} h={43} {...anim('wipe', 0.3, 0.25)} />

          {musicEnabled && (
            <HeroMusicButton
              isPlaying={isPlaying}
              onToggle={() => setIsPlaying((p) => !p)}
              line1={content.hero.hintLine1}
              line2={content.hero.hintLine2}
            />
          )}
        </Sec>

        {/* ===================== COUPLE / TAGS / NAMES ===================== */}
        <Sec top={1014} h={1054}>
          <Txt y={1085.6} size={49.3} font="hand" color="cb-olive" {...rv('rise')}>
            {content.couple.headingLine1}
          </Txt>
          <Txt y={1145.6} size={53} font="hand" color="cb-olive" {...rv('rise', 0.14)}>
            {content.couple.headingLine2}
          </Txt>

          <Img src={tagsImage} x={83} y={1232} w={412} h={294} alt="" {...rv('wipe', 0.1, 1)} />

          <Txt
            y={boxTop(1585, fit(60, brideName, 14), 0.14, 1.152)}
            size={fit(60, brideName, 14)}
            sx={0.868}
            sy={1.152}
            font="hand"
            color="cb-maroon"
            {...rv('rise')}
          >
            {brideName}
          </Txt>
          <Txt
            y={1649.1}
            size={fit(21.1, content.couple.brideParents, 42)}
            font="sans"
            color="cb-ink"
            {...rv('soft', 0.18)}
          >
            {content.couple.brideParents}
          </Txt>
          {content.couple.brideOrigin && (
            <Txt
              y={1679.1}
              size={fit(20.8, content.couple.brideOrigin, 42)}
              font="sans"
              color="cb-ink"
              {...rv('soft', 0.26)}
            >
              {content.couple.brideOrigin}
            </Txt>
          )}

          <Txt
            y={boxTop(1742, 70.8, 0.19, 1.116)}
            size={70.8}
            sx={0.897}
            sy={1.116}
            font="hand"
            color="cb-maroon"
            {...rv('pop')}
          >
            &amp;
          </Txt>

          <Txt
            y={boxTop(1833, fit(70.7, groomName, 12), 0.15, 1.11)}
            size={fit(70.7, groomName, 12)}
            sx={0.9}
            sy={1.11}
            font="hand"
            color="cb-maroon"
            {...rv('rise')}
          >
            {groomName}
          </Txt>
          <Txt
            y={1903.1}
            size={fit(21.2, content.couple.groomParents, 42)}
            font="sans"
            color="cb-ink"
            {...rv('soft', 0.18)}
          >
            {content.couple.groomParents}
          </Txt>
          {content.couple.groomOrigin && (
            <Txt
              y={1933.2}
              size={fit(20.4, content.couple.groomOrigin, 42)}
              font="sans"
              color="cb-ink"
              {...rv('soft', 0.26)}
            >
              {content.couple.groomOrigin}
            </Txt>
          )}
        </Sec>

        {/* ============================ COUNTDOWN ============================ */}
        <Sec top={2068} h={329}>
          <Box x={0} y={2094} w={576} h={303} className="cb-cord cb-rv cb-rv-fade" style={{ '--cb-t': '0.9s' } as AnimStyle} />
          <Img src={`${ASSET}/banner_pearls.webp`} x={0} y={2068} w={576} h={36} {...rv('wipe', 0.1, 0.9)} />

          <Txt
            y={2157.4}
            size={fit(47, content.countdown.heading, 18)}
            ls={3.1}
            font="hand"
            color="cb-white"
            {...rv('rise', 0.2)}
          >
            {content.countdown.heading.toUpperCase()}
          </Txt>

          {left.map((value, i) => (
            <Txt
              key={i}
              y={2232.6}
              size={58}
              font="sans"
              color="cb-white"
              weight={300}
              cx={COUNT_CENTERS[i]}
              className={rv('soft').className}
              style={{ fontVariantNumeric: 'tabular-nums', ...rv('soft', 0.4 + i * 0.12).style }}
            >
              {pad2(value)}
            </Txt>
          ))}
          {COLON_CENTERS.map((c, i) => (
            <Txt
              key={c}
              y={2232.6}
              size={58}
              font="sans"
              color="cb-white"
              weight={300}
              cx={c}
              {...rv('fade', 0.46 + i * 0.12)}
            >
              :
            </Txt>
          ))}
          {[
            content.countdown.daysLabel,
            content.countdown.hoursLabel,
            content.countdown.minutesLabel,
            content.countdown.secondsLabel,
          ].map((label, i) => (
            <Txt
              key={i}
              y={2303.3}
              size={12.5}
              font="sans"
              color="cb-white"
              cx={LABEL_CENTERS[i]}
              {...rv('fade', 0.7 + i * 0.1)}
            >
              {label}
            </Txt>
          ))}
        </Sec>

        {/* ============================ CALENDAR ============================ */}
        <Sec top={2397} h={603}>
          <Box
            x={58}
            y={2618}
            w={460}
            h={365}
            className={`cb-cord ${rv('rise').className}`}
            style={{ borderRadius: u(46), ...rv('rise', 0.05, 0.9).style }}
          />
          <Img src={`${ASSET}/disco_small.webp`} x={46} y={2398} w={114} h={175} {...rv('soft', 0.3, 1)} />
          <Img src={`${ASSET}/disco_large.webp`} x={318} y={2398} w={195} h={312} {...rv('soft', 0.15, 1)} />
          <Img src={`${ASSET}/stars_card.webp`} x={323} y={2662} w={76} h={66} {...rv('pop', 0.5)} />

          <Txt y={2657.2} size={41.5} font="hand" color="cb-white" left={108} {...rv('soft', 0.35)}>
            {monthNameEn(dateParts)}
          </Txt>

          {dateParts && (
            <>
              {WEEKDAYS.map((d, i) => (
                <CalCell key={`w${i}`} x={CAL_COLS[i]} y={2743.8} size={23} {...rv('soft', 0.45 + i * 0.05)}>
                  {d}
                </CalCell>
              ))}

              {/* The star sits behind the wedding day, wherever it falls in the month grid. */}
              <svg
                aria-hidden="true"
                viewBox="-32 -32 64 64"
                className={rv('pop').className}
                style={{
                  position: 'absolute',
                  left: u(CAL_COLS[starCell.c] - 0.2 - 32),
                  top: u(calRowTop(starCell.r) + 7.6 - 32 - 2397),
                  width: u(64),
                  height: u(64),
                  overflow: 'visible',
                  ...rv('pop', 1.1).style,
                }}
              >
                <polygon points={CAL_STAR} fill="#ffffff" />
              </svg>

              {calendarRows.map((row, r) =>
                row.map((cell, c) =>
                  cell.day === null ? null : (
                    <CalCell
                      key={`d${r}-${c}`}
                      x={CAL_COLS[c]}
                      y={calRowTop(r)}
                      size={18.5}
                      color={cell.day === dateParts.day ? '#2d0609' : undefined}
                      {...rv('fade', 0.7 + (r * 7 + c) * 0.018, 0.5)}
                    >
                      {pad2(cell.day)}
                    </CalCell>
                  )
                )
              )}
            </>
          )}
        </Sec>

        {/* ============================ SCHEDULE / LOCATION ============================ */}
        <Sec top={3000} h={800}>
          <Txt y={3052.1} size={46} font="hand" color="cb-maroon" {...rv('rise')}>
            {content.schedule.akadTitle}
          </Txt>
          <Txt y={3109.9} size={23.2} font="sans" color="cb-ink" {...rv('soft', 0.16)}>{akadDate}</Txt>
          <Txt y={3142.4} size={23.2} font="sans" color="cb-ink" {...rv('soft', 0.26)}>{akadTime}</Txt>

          <Txt
            y={boxTop(3224, 42, 0.15, 1.086)}
            size={42}
            sx={0.92}
            sy={1.086}
            font="hand"
            color="cb-maroon"
            {...rv('rise')}
          >
            {content.schedule.receptionTitle}
          </Txt>
          <Txt y={3277.9} size={23.2} font="sans" color="cb-ink" {...rv('soft', 0.16)}>{receptionDate}</Txt>
          <Txt y={3310.4} size={23.2} font="sans" color="cb-ink" {...rv('soft', 0.26)}>{receptionTime}</Txt>

          {mapEmbed && (
            <Box
              x={153}
              y={3390}
              w={276}
              h={207}
              className={rv('wipe').className}
              style={rv('wipe', 0, 0.9).style}
            >
              {/* The frame is not interactive: on a phone it would swallow the scroll gesture.
                  The link above it opens the full map instead. */}
              <iframe
                className="cb-map"
                title={venueName || 'Map'}
                src={mapEmbed}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                tabIndex={-1}
                style={{ inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
              />
              <a
                className="cb-map-link"
                href={mapLink}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Buka peta${venueName ? `: ${venueName}` : ''}`}
                style={{ inset: 0 }}
              />
            </Box>
          )}

          <Txt
            y={boxTop(3643, 41.5, 0.15, 1.08)}
            size={41.5}
            sx={0.925}
            sy={1.08}
            font="hand"
            color="cb-maroon"
            {...rv('rise')}
          >
            {content.location.title}
          </Txt>
          {venueName && (
            <Txt y={3691} size={fit(23.2, venueName, 30)} font="sans" color="cb-ink" {...rv('soft', 0.16)}>
              {venueName}
            </Txt>
          )}
        </Sec>

        {/* ============================ GIFT ============================ */}
        <Sec top={3800} h={giftHeight}>
          <Img
            src={`${ASSET}/gift_anthurium.webp`}
            x={0}
            y={3839}
            w={243}
            h={335}
            {...rv('left', 0, 1)}
          />

          <Txt y={4020.9} size={59.2} font="hand" color="cb-olive" cx={348} {...rv('rise', 0.1)}>
            {content.gift.titleLine1}
          </Txt>
          <Txt y={4089.5} size={60.8} font="hand" color="cb-olive" cx={348} {...rv('rise', 0.24)}>
            {content.gift.titleLine2}
          </Txt>

          <Para
            y={4191.4}
            w={396}
            size={17.7}
            lineHeight={25}
            className={`cb-ink ${rv('soft').className}`}
            style={rv('soft', 0.2).style}
          >
            {content.gift.description}
          </Para>

          {accounts.map((account, i) => {
            const cx = i % 2 === 0 ? 285.1 : 262.6;
            const cy = 4423.9 + i * 238.4;
            const rot = i % 2 === 0 ? -6.17 : 5.55;
            return (
              <GiftCard
                key={i}
                cx={cx}
                cy={cy}
                rot={rot}
                bankName={account.bankName}
                number={account.accountNumber}
                holder={account.accountHolder}
                copied={copiedIdx === i}
                onCopy={() => copyAccount(i, account.accountNumber)}
                reveal={rv(i % 2 === 0 ? 'left' : 'right', 0.1)}
              />
            );
          })}

          {accounts.length > 0 && (
            <Img src={`${ASSET}/lily2.webp`} x={362} y={4612} w={194} h={245} {...rv('right', 0.2, 1)} />
          )}
        </Sec>

        {/* ==================== TRANSFER CONFIRMATION ==================== */}
        {content.transferConfirmation.enabled && data.invitationMeta && (
          <Sec top={4900} className="cb-transfer-sec">
            <Img src={`${ASSET}/banner_pearls.webp`} x={0} y={4900} w={576} h={36} {...rv('fade', 0, 0.9)} />

            {/* Anchored to the section bottom so it stays at the card's lower corner. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${ASSET}/lily2.webp`}
              alt=""
              aria-hidden="true"
              draggable={false}
              className={`cb-img cb-transfer-lily ${rv('left', 0.15, 1).className}`}
              style={rv('left', 0.15, 1).style}
            />

            <div
              className={`cb-transfer-card ${rv('rise').className}`}
              style={rv('rise', 0.05, 0.9).style}
            >
              <TransferConfirmationForm
                eventSlug={data.invitationMeta.eventSlug}
                guestToken={data.invitationMeta.guestToken}
                guestName={data.guest.name}
                accounts={accounts}
                title={content.transferConfirmation.title}
                description={content.transferConfirmation.description}
                successMessage={content.transferConfirmation.successMessage}
                alreadySubmitted={data.hasTransferConfirmation}
              />
            </div>
          </Sec>
        )}

        {/* ============================ VERSE ============================ */}
        <Sec top={4900} h={803}>
          <Img src={brideFace} x={106} y={4985} w={164} h={225} {...rv('wipe', 0, 0.8)} />
          <Img src={groomFace} x={301} y={4975} w={163} h={205} {...rv('wipe', 0.14, 0.8)} />

          <Para
            y={5230.2}
            w={386}
            size={17.2}
            lineHeight={25}
            className={`cb-ink cb-light ${rv('soft').className}`}
            style={rv('soft', 0.1, 0.9).style}
          >
            {content.verse.text}
          </Para>

          <Txt y={5506.4} size={47} font="hand" color="cb-olive" {...rv('rise')}>
            {content.closing.titleLine1}
          </Txt>
          <Txt y={5551.7} size={43.9} font="hand" color="cb-olive" {...rv('rise', 0.16)}>
            {content.closing.titleLine2}
          </Txt>
        </Sec>

        {/* ============================ CLOSING ============================ */}
        <Sec top={5703} h={250}>
          <Box
            x={0}
            y={5703}
            w={576}
            h={250}
            className={`cb-cord ${rv('fade').className}`}
            style={rv('fade', 0, 0.9).style}
          />
          <Txt y={5775.5} size={16.6} font="sans" color="cb-white" left={85} {...rv('soft', 0.25)}>
            {content.closing.signOff}
          </Txt>
          <Txt
            y={boxTop(5811, fit(68.4, heroNames, 18), 0.14, 1.097)}
            size={fit(68.4, heroNames, 18)}
            sx={0.91}
            sy={1.097}
            font="hand"
            color="cb-white"
            left={85}
            {...rv('rise', 0.4)}
          >
            {heroNames}
          </Txt>
          <Img src={`${ASSET}/closing_pearls.webp`} x={485} y={5830} w={85} h={122} {...rv('wipe', 0.5, 1)} />
        </Sec>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Small components                                                           */
/* -------------------------------------------------------------------------- */

function CalCell({
  x,
  y,
  size,
  color,
  className = '',
  style,
  children,
}: {
  x: number;
  y: number;
  size: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const top = useContext(SecContext);
  return (
    <span
      className={`cb-cal-cell cb-sans ${className}`}
      style={{
        left: u(x),
        top: u(y - top),
        fontSize: u(size),
        ...(color ? { color } : {}),
        ...style,
      }}
    >
      {children}
    </span>
  );
}

function HeroMusicButton({
  isPlaying,
  onToggle,
  line1,
  line2,
}: {
  isPlaying: boolean;
  onToggle: () => void;
  line1: string;
  line2: string;
}) {
  const top = useContext(SecContext);
  const cx = 484.5;
  const cy = 832.1;
  return (
    <>
      <svg
        aria-hidden="true"
        viewBox="-45 -45 90 90"
        className="cb-in-pop cb-abs"
        style={{
          ...({ '--cb-d': '0.86s' } as AnimStyle),
          left: u(cx - 45),
          top: u(cy - 45 - top),
          width: u(90),
          height: u(90),
          overflow: 'visible',
          pointerEvents: 'none',
        }}
      >
        <polygon points={HERO_STAR} fill="#4c0f1d" />
        {isPlaying ? (
          <>
            <rect x="-6" y="-8" width="4.6" height="17" fill="#ffffff" />
            <rect x="2" y="-8" width="4.6" height="17" fill="#ffffff" />
          </>
        ) : (
          <polygon points="-6.3,-7.1 -6.3,9.7 8.8,0.9" fill="#ffffff" />
        )}
      </svg>
      <Txt y={865} size={20.5} font="sans" color="cb-ink" right={514} {...anim('wipe', 1.08, 0.3)}>
        {isPlaying ? 'Playing' : line1}
      </Txt>
      <Txt y={893.2} size={20.5} font="sans" color="cb-ink" right={514} {...anim('wipe', 1.08, 0.3)}>
        {isPlaying ? 'Tap to Pause' : line2}
      </Txt>
      <button
        type="button"
        className="cb-music"
        onClick={onToggle}
        aria-label={isPlaying ? 'Pause music' : 'Play music'}
        aria-pressed={isPlaying}
        style={{ left: u(405), top: u(790 - top), width: u(112), height: u(128) }}
      />
    </>
  );
}

function GiftCard({
  cx,
  cy,
  rot,
  bankName,
  number,
  holder,
  copied,
  onCopy,
  reveal,
}: {
  cx: number;
  cy: number;
  rot: number;
  bankName: string;
  number: string;
  holder: string;
  copied: boolean;
  onCopy: () => void;
  reveal: { className: string; style: React.CSSProperties };
}) {
  const top = useContext(SecContext);
  const W = 248.5;
  const H = 192.5;
  const textLeft = W / 2 - 96.6;
  const isJatim = /jatim/i.test(bankName);
  return (
    // The outer box carries the scroll reveal; the inner one the tilt (both use `transform`).
    <div
      className={`cb-abs ${reveal.className}`}
      style={{
        left: u(cx - W / 2),
        top: u(cy - H / 2 - top),
        width: u(W),
        height: u(H),
        ...reveal.style,
      }}
    >
      <div
        className="cb-abs"
        style={{ inset: 0, transform: `rotate(${rot}deg)` }}
      >
      <CardFrame w={W} h={H} />
      {isJatim ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`${ASSET}/bank_jatim.webp`}
          alt={bankName}
          draggable={false}
          className="cb-img"
          style={{ left: u(W / 2 - 11.5 - 85.5), top: u(H / 2 - 46.2 - 21), width: u(171), height: u(42) }}
        />
      ) : (
        <p
          className="cb-t cb-hand cb-maroon"
          style={{ left: u(textLeft), width: u(W - 56), top: u(H / 2 - 46.2 - 14), fontSize: u(28), textAlign: 'left' }}
        >
          {bankName}
        </p>
      )}
      <button
        type="button"
        className="cb-copy cb-t cb-hand cb-ink"
        onClick={onCopy}
        aria-label={`Copy account number ${number}`}
        style={{
          left: u(textLeft),
          width: u(W - 56),
          // Padding enlarges the touch target without moving the text.
          top: u(H / 2 - 5.2 - 10 - 14),
          paddingTop: u(14),
          paddingBottom: u(14),
          fontSize: u(15.5),
          fontWeight: 400,
          letterSpacing: u(2),
          WebkitTextStroke: 0,
          touchAction: 'manipulation',
        }}
      >
        {copied ? 'copied' : number}
      </button>
      <p
        className="cb-t cb-hand cb-ink"
        style={{ left: u(textLeft), width: u(W - 56), top: u(H / 2 + 31.7 - 10), fontSize: u(15.5), fontWeight: 400, textAlign: 'left', WebkitTextStroke: 0 }}
      >
        a/n
      </p>
      <p
        className="cb-t cb-hand cb-ink"
        style={{ left: u(textLeft), width: u(W - 56), top: u(H / 2 + 56.2 - 10), fontSize: u(15.5), fontWeight: 400, textAlign: 'left', letterSpacing: u(1), WebkitTextStroke: 0 }}
      >
        {holder}
      </p>
      </div>
    </div>
  );
}
