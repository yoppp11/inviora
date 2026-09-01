import { cn } from '@/lib/utils';

type InvioraLogoProps = {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
};

const sizeMap = {
  sm: { mark: 28, text: 'text-base' },
  md: { mark: 36, text: 'text-xl' },
  lg: { mark: 48, text: 'text-2xl' },
} as const;

export function InvioraMark({
  size = 36,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn('shrink-0', className)}
    >
      <defs>
        <linearGradient id="inviora-rose" x1="8" y1="6" x2="40" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#C97B8A" />
          <stop offset="0.55" stopColor="#9B4D6A" />
          <stop offset="1" stopColor="#6E3A52" />
        </linearGradient>
        <linearGradient id="inviora-gold" x1="14" y1="10" x2="34" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F2D9A0" />
          <stop offset="1" stopColor="#C9A962" />
        </linearGradient>
        <linearGradient id="inviora-shine" x1="24" y1="8" x2="24" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="white" stopOpacity="0.35" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Card body */}
      <rect x="6" y="10" width="36" height="32" rx="6" fill="url(#inviora-rose)" />
      <rect x="6" y="10" width="36" height="32" rx="6" fill="url(#inviora-shine)" />

      {/* Envelope flap — forms subtle "V" in Inviora */}
      <path
        d="M6 16C6 13.5 8 11.5 10.5 11.5H37.5C40 11.5 42 13.5 42 16L24 27L6 16Z"
        fill="url(#inviora-gold)"
      />

      {/* Pearl seal — the dot of "i" */}
      <circle cx="24" cy="31" r="4.25" fill="white" fillOpacity="0.95" />
      <circle cx="24" cy="31" r="2.5" fill="url(#inviora-gold)" />

      {/* Floral flourish left */}
      <path
        d="M11 36C9.5 34.5 9 32.5 10 31C11 29.5 12.5 30 13 31.5C13.2 32.8 12.5 35 11 36Z"
        fill="white"
        fillOpacity="0.55"
      />
      {/* Floral flourish right */}
      <path
        d="M37 36C38.5 34.5 39 32.5 38 31C37 29.5 35.5 30 35 31.5C34.8 32.8 35.5 35 37 36Z"
        fill="white"
        fillOpacity="0.55"
      />

      {/* Elegant stem — stylized "I" */}
      <path
        d="M24 18V26"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeOpacity="0.9"
      />
    </svg>
  );
}

export function InvioraLogo({ className, showText = true, size = 'md' }: InvioraLogoProps) {
  const { mark, text } = sizeMap[size];

  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <InvioraMark size={mark} />
      {showText && (
        <span className={cn('font-semibold tracking-tight leading-none', text)}>
          <span className="text-foreground">Invi</span>
          <span className="bg-gradient-to-r from-[#9B4D6A] to-[#C9A962] bg-clip-text text-transparent">
            ora
          </span>
        </span>
      )}
    </span>
  );
}
