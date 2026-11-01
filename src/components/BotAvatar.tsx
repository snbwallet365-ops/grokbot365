import type { BotStatus, Shape } from "../lib/store";

const SHAPES: Record<Shape, string> = {
  circle: "M20 4a16 16 0 1 1 0 32a16 16 0 1 1 0-32z",
  squircle: "M20 4c11 0 16 5 16 16s-5 16-16 16S4 31 4 20 9 4 20 4z",
  triangle: "M20 4.5c1.6 0 2.6.8 3.5 2.3l12 21.5c1.6 2.9 0 5.7-3.3 5.7H7.8c-3.3 0-4.9-2.8-3.3-5.7l12-21.5c.9-1.5 1.9-2.3 3.5-2.3z",
  hex: "M20 4l13.5 7.8v15.6L20 36 6.5 27.4V11.8z",
  diamond: "M20 3.5c1 0 1.8.4 2.6 1.2l12.7 12.7c1.6 1.6 1.6 3.6 0 5.2L22.6 35.3c-1.6 1.6-3.6 1.6-5.2 0L4.7 22.6c-1.6-1.6-1.6-3.6 0-5.2L17.4 4.7c.8-.8 1.6-1.2 2.6-1.2z",
  blob: "M21 4c8 0 15 5 15 14s-4 18-15 18S4 30 4 21 12 4 21 4z",
  pill: "M12 6h16a8 8 0 0 1 8 8v12a8 8 0 0 1-8 8H12a8 8 0 0 1-8-8V14a8 8 0 0 1 8-8z",
  star: "M20 3.5l4.4 7.6 8.6-1.1-3.3 8 5.8 6.4-8.4 2.3-1 8.7L20 30.6l-6.1 4.8-1-8.7-8.4-2.3 5.8-6.4-3.3-8 8.6 1.1z",
};

function isDark(hex: string) {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return (r * 299 + g * 587 + b * 114) / 1000 < 150;
}

export default function BotAvatar({ shape, color, status, size = 36, ring = true }: { shape: Shape; color: string; status: BotStatus; size?: number; ring?: boolean }) {
  const eyeY = shape === "triangle" ? 23 : 19;
  const eye = isDark(color) ? "#ffffff" : "#111111";
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {ring && status === "waiting" && <span className="pulse-ring absolute inset-0 rounded-full border-2 border-[#ff9500]" />}
      <svg viewBox="0 0 40 40" width={size} height={size} className={status === "working" ? "bot-bob" : ""}>
        <path d={SHAPES[shape]} fill={color} />
        {status === "working" && ring && <circle cx="20" cy="20" r="18.6" fill="none" stroke={color} strokeOpacity=".5" strokeWidth="1.3" strokeDasharray="6 5" className="spin-slow" />}
        <g className={status === "working" ? "eye-look" : ""}>
          {status === "done" ? (
            <>
              <path d={`M12.5 ${eyeY + 1}q2.5-3.2 5 0`} stroke={eye} strokeWidth="2.2" fill="none" strokeLinecap="round" />
              <path d={`M22.5 ${eyeY + 1}q2.5-3.2 5 0`} stroke={eye} strokeWidth="2.2" fill="none" strokeLinecap="round" />
            </>
          ) : status === "error" ? (
            <>
              <path d={`M13 ${eyeY - 2}l4 4M17 ${eyeY - 2}l-4 4`} stroke={eye} strokeWidth="2" strokeLinecap="round" />
              <path d={`M23 ${eyeY - 2}l4 4M27 ${eyeY - 2}l-4 4`} stroke={eye} strokeWidth="2" strokeLinecap="round" />
            </>
          ) : status === "waiting" ? (
            <>
              <ellipse cx="15" cy={eyeY - 1} rx="2.6" ry="3.4" fill={eye} />
              <ellipse cx="25" cy={eyeY - 1} rx="2.6" ry="3.4" fill={eye} />
            </>
          ) : (
            <>
              <ellipse className="eye-blink" cx="15" cy={eyeY} rx="2.3" ry={status === "working" ? 2.3 : 3} fill={eye} />
              <ellipse className="eye-blink" cx="25" cy={eyeY} rx="2.3" ry={status === "working" ? 2.3 : 3} fill={eye} />
            </>
          )}
        </g>
      </svg>
    </div>
  );
}

export function StatusDot({ status }: { status: BotStatus }) {
  const c = { idle: "#c7c7cc", working: "#007aff", waiting: "#ff9500", done: "#34c759", error: "#ff3b30" }[status];
  return (
    <span className="relative inline-flex h-2 w-2">
      {status === "working" && <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: c }} />}
      <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: c }} />
    </span>
  );
}
