/**
 * N Space brand mark — a visa/passport inspired typographic icon.
 * Globe meridians + stamp ring + the N cut-out. Pure SVG, no assets.
 */
export function BrandMark({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" className={className} aria-label="N Space" role="img">
      <defs>
        <linearGradient id="ns-body" x1="8" y1="0" x2="112" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#5AC8FA" />
          <stop offset="0.45" stopColor="#0A84FF" />
          <stop offset="1" stopColor="#5E5CE6" />
        </linearGradient>
        <linearGradient id="ns-gloss" x1="20" y1="4" x2="86" y2="66" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.75" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="112" height="112" rx="30" fill="url(#ns-body)" />
      {/* passport stamp ring */}
      <circle cx="60" cy="60" r="42" fill="none" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="1.6" strokeDasharray="3 5" />
      {/* globe meridians */}
      <ellipse cx="60" cy="60" rx="30" ry="42" fill="none" stroke="#ffffff" strokeOpacity="0.22" strokeWidth="1.4" />
      <ellipse cx="60" cy="60" rx="14" ry="42" fill="none" stroke="#ffffff" strokeOpacity="0.18" strokeWidth="1.2" />
      <path d="M22 46h76M20 60h80M22 74h76" stroke="#ffffff" strokeOpacity="0.18" strokeWidth="1.2" />
      {/* N letterform */}
      <path d="M38 88V36h10l24 34V36h10v52H72L48 54v34H38z" fill="#ffffff" opacity="0.97" />
      <path d="M4 46c0-23 19-42 42-42h30C47 12 24 32 4 70V46z" fill="url(#ns-gloss)" />
      <rect x="4" y="4" width="112" height="112" rx="30" fill="none" stroke="#ffffff" strokeOpacity="0.45" strokeWidth="1.4" />
    </svg>
  );
}

export function Wordmark({ size = 17, className = "" }: { size?: number; className?: string }) {
  return (
    <span className={className} style={{ fontSize: size, letterSpacing: "0.02em" }}>
      <span className="font-bold tracking-tight">N</span>
      <span className="font-bold tracking-tight text-[#007aff]"> Space</span>
    </span>
  );
}

export default BrandMark;
