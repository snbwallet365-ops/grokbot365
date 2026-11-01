import { useEffect, type ReactNode } from "react";
import { ChevronRight, X, Menu } from "lucide-react";
import { useRuntime } from "../lib/store";
import { cn } from "../utils/cn";

export function Toggle({ on, onChange, disabled }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button role="switch" aria-checked={on} disabled={disabled}
      onClick={(e) => { e.stopPropagation(); onChange(!on); navigator.vibrate?.(8); }}
      className={cn("relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors duration-300 disabled:opacity-40", on ? "bg-[#34c759]" : "bg-fill2")}>
      <span className={cn("absolute top-[2px] h-[27px] w-[27px] rounded-full bg-white shadow-[0_3px_8px_rgba(0,0,0,.15),0_1px_1px_rgba(0,0,0,.16)] transition-all duration-300 ease-[cubic-bezier(.3,1.4,.5,1)]", on ? "left-[22px]" : "left-[2px]")} />
    </button>
  );
}

export function MenuButton({ className }: { className?: string }) {
  return (
    <button onClick={() => useRuntime.getState().set({ drawer: true })} aria-label="Menu"
      className={cn("press flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-label md:hidden lg-pill", className)}>
      <Menu size={18} />
    </button>
  );
}

export function Sheet({ open, onClose, title, children, right, size = "md" }: { open: boolean; onClose: () => void; title?: string; children: ReactNode; right?: ReactNode; size?: "md" | "lg" | "full" }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center md:items-center" onClick={onClose}>
      <div className="fade-in absolute inset-0 bg-black/30 backdrop-blur-[3px]" />
      <div onClick={(e) => e.stopPropagation()}
        className={cn("sheet-up md:pop relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[22px] bg-grouped shadow-2xl md:rounded-[24px] border border-[var(--glass-border)]",
          size === "md" && "md:max-w-[560px]", size === "lg" && "md:max-w-[780px]", size === "full" && "h-[92dvh] md:h-[88vh] md:max-w-[1100px]")}>
        <div className="mx-auto mt-1.5 h-[5px] w-9 rounded-full bg-fill2 md:hidden" />
        {title !== undefined && (
          <div className="flex h-12 shrink-0 items-center px-4">
            <button onClick={onClose} className="press -ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-fill text-label2"><X size={16} strokeWidth={2.5} /></button>
            <div className="flex-1 truncate px-3 text-center text-[17px] font-semibold">{title}</div>
            <div className="flex min-w-8 justify-end">{right}</div>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export function Group({ header, footer, children, className }: { header?: ReactNode; footer?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn("mb-7", className)}>
      {header && <div className="mb-1.5 px-4 text-[13px] uppercase tracking-[-0.01em] text-label2">{header}</div>}
      <div className="overflow-hidden rounded-[14px] bg-surface [&>*:not(:last-child)]:shadow-[inset_0_-0.5px_0_var(--sep)]">{children}</div>
      {footer && <div className="mt-1.5 px-4 text-[13px] leading-snug text-label2">{footer}</div>}
    </div>
  );
}

export function Row({ icon, iconBg, title, subtitle, right, onClick, chevron, danger, className }: {
  icon?: ReactNode; iconBg?: string; title: ReactNode; subtitle?: ReactNode; right?: ReactNode; onClick?: () => void; chevron?: boolean; danger?: boolean; className?: string;
}) {
  const C: any = onClick ? "button" : "div";
  return (
    <C onClick={onClick} className={cn("flex min-h-[46px] w-full items-center gap-3 px-4 py-2 text-left", onClick && "active:bg-fill md:hover:bg-fill/60", className)}>
      {icon && <span className="flex h-[29px] w-[29px] shrink-0 items-center justify-center rounded-[8px] text-white" style={{ background: iconBg ?? "#8e8e93" }}>{icon}</span>}
      <div className="min-w-0 flex-1">
        <div className={cn("truncate text-[16px]", danger ? "text-[#ff3b30]" : "text-label")}>{title}</div>
        {subtitle && <div className="truncate text-[13px] text-label2">{subtitle}</div>}
      </div>
      {right}
      {chevron && <ChevronRight size={18} className="shrink-0 text-label3" />}
    </C>
  );
}

export function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[] }) {
  const i = Math.max(0, options.findIndex((o) => o.value === value));
  return (
    <div className="relative flex rounded-[10px] bg-fill p-[2px]">
      <div className="absolute top-[2px] bottom-[2px] rounded-[8px] bg-surface2 shadow-[0_3px_8px_rgba(0,0,0,.12),0_3px_1px_rgba(0,0,0,.04)] transition-all duration-300 ease-[cubic-bezier(.3,1.2,.5,1)]"
        style={{ width: `calc((100% - 4px) / ${options.length})`, left: `calc(2px + (100% - 4px) / ${options.length} * ${i})` }} />
      {options.map((o) => (
        <button key={o.value} onClick={() => onChange(o.value)} className={cn("relative z-10 flex flex-1 items-center justify-center gap-1 rounded-[8px] px-2 py-[6px] text-[13px] transition-colors", value === o.value ? "font-semibold text-label" : "text-label2")}>{o.label}</button>
      ))}
    </div>
  );
}

export function LargeTitle({ title, right, sub }: { title: string; right?: ReactNode; sub?: ReactNode }) {
  return (
    <div className="pt-safe px-4 pt-3 pb-2 md:px-7 md:pt-7">
      <div className="mb-2 md:hidden"><MenuButton /></div>
      <div className="flex items-end gap-3">
        <h1 className="fade-up flex-1 text-[34px] font-bold leading-tight tracking-[-0.025em]">{title}</h1>
        {right}
      </div>
      {sub && <div className="mt-1 text-[15px] text-label2">{sub}</div>}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex min-h-[46px] items-center gap-3 px-4 py-1.5">
      <span className="w-28 shrink-0 text-[16px] text-label">{label}</span>
      <div className="min-w-0 flex-1">{children}</div>
    </label>
  );
}

export const inputCls = "w-full bg-transparent text-[16px] text-label outline-none placeholder:text-label3";

export function Pill({ children, color = "#007aff", onClick, className }: { children: ReactNode; color?: string; onClick?: () => void; className?: string }) {
  return (
    <button onClick={onClick} className={cn("press inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[14px] font-semibold", className)} style={{ background: color + "1f", color }}>
      {children}
    </button>
  );
}
