import { useEffect, useState } from "react";
import BrandMark from "./Logo";

/**
 * First-open splash: 3 seconds of typographic motion, then the app.
 * Shown once per session (sessionStorage) so reopens stay instant.
 */
export default function Splash({ onDone }: { onDone: () => void }) {
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    const a = setTimeout(() => setLeaving(true), 2700);
    const b = setTimeout(onDone, 3100);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [onDone]);

  return (
    <div className={`splash-bg fixed inset-0 z-[200] grid place-items-center overflow-hidden ${leaving ? "splash-out" : ""}`}>
      <div className="splash-blob splash-blob-a" />
      <div className="splash-blob splash-blob-b" />
      <div className="splash-blob splash-blob-c" />

      <div className="relative flex flex-col items-center px-8">
        <div className="relative">
          <span className="splash-halo" />
          <span className="splash-mark pop"><BrandMark size={96} /></span>
        </div>

        <div className="mt-8 flex items-end gap-[2px] sm:gap-[3px]">
          {"N SPACE".split("").map((ch, i) => (
            <span
              key={i}
              className="splash-letter"
              style={{ animationDelay: `${420 + i * 85}ms` }}
            >
              {ch === " " ? "\u00A0" : ch}
            </span>
          ))}
        </div>

        <div className="splash-tagline mt-4 text-[11.5px] font-medium uppercase tracking-[0.32em] text-label2">
          Visa · Recruitment · Documentation
        </div>

        <div className="splash-bar mt-7 h-[3px] w-[132px] overflow-hidden rounded-full bg-black/10">
          <span className="splash-bar-fill block h-full rounded-full bg-gradient-to-r from-[#0a84ff] via-[#5ac8fa] to-[#bf5af2]" />
        </div>
      </div>
    </div>
  );
}
