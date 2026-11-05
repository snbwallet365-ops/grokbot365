import { useState } from "react";
import { cn } from "../utils/cn";

const SIP = (slug: string) => `https://cdn.jsdelivr.net/npm/simple-icons@13/icons/${slug}.svg`;
const FAV = (domain: string) => `https://icons.duckduckgo.com/ip3/${domain}.ico`;

/**
 * Real brand tile: brand-gradient squircle with the actual provider logo knocked out
 * in white. Falls back to the letter mark if the logo cannot load.
 */
export default function ConnLogo({
  slug,
  domain,
  letter,
  color,
  size = 44,
  connected = false,
  className = "",
}: {
  slug?: string;
  domain?: string;
  letter: string;
  color: string;
  size?: number;
  connected?: boolean;
  className?: string;
}) {
  const src = slug ? SIP(slug) : domain ? FAV(domain) : "";
  const [failed, setFailed] = useState(false);
  const pad = Math.round(size * 0.22);

  return (
    <span
      className={cn("relative grid shrink-0 place-items-center overflow-hidden", className)}
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.28),
        background: `linear-gradient(145deg, ${color}, ${shade(color, -18)})`,
        boxShadow: `0 6px 16px ${hexA(color, 0.32)}, inset 0 1px 0 rgba(255,255,255,.35)`,
      }}
    >
      <span
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{ background: "linear-gradient(180deg, rgba(255,255,255,.35), rgba(255,255,255,0) 55%)" }}
      />
      {src && !failed ? (
        <img
          src={src}
          alt=""
          width={size - pad * 2}
          height={size - pad * 2}
          loading="lazy"
          draggable={false}
          onError={() => setFailed(true)}
          className="relative"
          style={{ width: size - pad * 2, height: size - pad * 2, filter: "brightness(0) invert(1)", objectFit: "contain" }}
        />
      ) : (
        <span className="relative font-bold text-white" style={{ fontSize: size * 0.42 }}>{letter}</span>
      )}
      {connected && (
        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-[#34c759]" />
      )}
    </span>
  );
}

function hexA(hex: string, a: number) {
  const h = hex.replace("#", "");
  const n = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const r = parseInt(n.slice(0, 2), 16), g = parseInt(n.slice(2, 4), 16), b = parseInt(n.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function shade(hex: string, percent: number) {
  const h = hex.replace("#", "");
  const n = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const num = parseInt(n, 16);
  let r = (num >> 16) + Math.round(255 * (percent / 100));
  let g = ((num >> 8) & 0xff) + Math.round(255 * (percent / 100));
  let b = (num & 0xff) + Math.round(255 * (percent / 100));
  r = Math.max(Math.min(255, r), 0); g = Math.max(Math.min(255, g), 0); b = Math.max(Math.min(255, b), 0);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
