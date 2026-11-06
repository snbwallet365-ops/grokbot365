import { useState } from "react";
import { Search, Plus, Globe, Brain, Workflow, Repeat, Plug, Settings, Sun, Moon, PanelLeftClose, PanelLeftOpen, Crown, X, Server, Languages, Cloud, LayoutDashboard, FileStack } from "lucide-react";
import { useStore, useRuntime, PROVIDERS, type Bot } from "../lib/store";
import BotAvatar from "./BotAvatar";
import { cn } from "../utils/cn";

export type Section = "package" | "dashboard" | "bots" | "browser" | "brain" | "automations" | "routines" | "connections" | "cloud" | "settings";
export const NAV: { id: Section; label: string; icon: typeof Globe; color: string }[] = [
  { id: "browser", label: "Computer & Browser", icon: Globe, color: "#007aff" },
  { id: "brain", label: "Brain", icon: Brain, color: "#ff2d55" },
  { id: "automations", label: "Automations", icon: Workflow, color: "#af52de" },
  { id: "routines", label: "Routines", icon: Repeat, color: "#ff9500" },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, color: "#0a84ff" },
  { id: "package", label: "Visa package", icon: FileStack, color: "#ff9500" },
  { id: "connections", label: "Connections", icon: Plug, color: "#34c759" },
  { id: "cloud", label: "Cloud & keys", icon: Cloud, color: "#0a84ff" },
  { id: "settings", label: "Settings", icon: Settings, color: "#8e8e93" },
];
const STATUS = { idle: "", working: "Working", waiting: "Needs you", done: "Done", error: "Error" } as const;
const ago = (t: number) => { const s = (Date.now() - t) / 1000; if (s < 60) return "now"; if (s < 3600) return `${Math.floor(s / 60)}m`; if (s < 86400) return `${Math.floor(s / 3600)}h`; return new Date(t).toLocaleDateString([], { month: "short", day: "numeric" }); };

import BrandMark from "./Logo";
export function Logo({ size = 36 }: { size?: number }) {
  return <BrandMark size={size} className="logo-shine shrink-0" />;
}

export default function Sidebar({ section, setSection, activeId, onSelectBot, onNewBot, collapsed, setCollapsed, mobile }: {
  section: Section; setSection: (s: Section) => void; activeId: string | null; onSelectBot: (id: string) => void; onNewBot: () => void;
  collapsed?: boolean; setCollapsed?: (v: boolean) => void; mobile?: boolean;
}) {
  const bots = useStore((s) => s.bots);
  const docs = useStore((s) => s.docs.length);
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  const live = useRuntime((s) => s.live);
  const online = useRuntime((s) => s.serverOnline);
  const flowRuns = useRuntime((s) => s.flowRuns);
  const [q, setQ] = useState("");
  const c = !!collapsed && !mobile;
  const dark = settings.theme === "dark";
  const close = () => useRuntime.getState().set({ drawer: false });

  const list = [...bots].filter((b) => (b.name + b.title).toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => Number(b.status === "waiting") - Number(a.status === "waiting") || Number(!!b.main) - Number(!!a.main) || b.updatedAt - a.updatedAt);
  const runningFlows = Object.values(flowRuns).filter((f) => f.running).length;
  const badge = (id: Section) => id === "brain" ? docs : id === "automations" ? runningFlows : 0;

  const BotRow = (b: Bot, i: number) => {
    const status = live[b.id] && b.status !== "waiting" ? "working" : b.status;
    const active = section === "bots" && activeId === b.id;
    return (
      <button key={b.id} title={b.name} onClick={() => { onSelectBot(b.id); if (mobile) close(); }} style={{ animationDelay: `${i * 22}ms` }}
        className={cn("fade-up press group relative flex w-full items-center gap-2.5 rounded-[14px] text-left transition-all duration-200", c ? "justify-center p-1.5" : "px-2 py-2",
          active ? "bg-[#007aff] text-white shadow-[0_6px_20px_rgba(0,122,255,.35)]" : "hover:bg-[var(--surface)]/60 active:bg-fill")}>
        <BotAvatar shape={b.shape} color={active && b.color === "#1c1c1e" ? "#ffffff" : b.color} status={status} size={c ? 38 : 36} />
        {c && b.unread ? <span className="absolute top-0.5 right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--surface)] bg-[#ff3b30]" /> : null}
        {!c && (
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <span className="truncate text-[14.5px] font-semibold">{b.name}</span>
              {b.main && <Crown size={11} className={active ? "text-white/80" : "text-[#ff9500]"} />}
              <span className={cn("ml-auto shrink-0 text-[11.5px]", active ? "text-white/70" : "text-label3")}>{ago(b.updatedAt)}</span>
            </div>
            <div className="flex items-center gap-1">
              {STATUS[status] && <span className={cn("shrink-0 text-[12.5px] font-medium", active ? "text-white" : status === "working" ? "shimmer-text" : status === "waiting" ? "text-[#ff9500]" : status === "done" ? "text-[#34c759]" : "text-[#ff3b30]")}>{STATUS[status]} ·</span>}
              <span className={cn("truncate text-[12.5px]", active ? "text-white/80" : "text-label2")}>{status === "idle" ? b.title : b.preview}</span>
              {b.unread ? <span className={cn("ml-auto flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full px-1 text-[11px] font-bold", active ? "bg-white text-[#007aff]" : "bg-[#007aff] text-white")}>{b.unread}</span> : null}
            </div>
          </div>
        )}
      </button>
    );
  };

  return (
    <aside className={cn("lg-panel relative z-20 flex h-full shrink-0 flex-col overflow-hidden transition-[width] duration-300 ease-[cubic-bezier(.2,.9,.25,1)]",
      mobile ? "pt-safe w-[86vw] max-w-[340px] rounded-r-[28px]" : c ? "w-[76px] rounded-[26px]" : "w-[300px] rounded-[26px]")}>
      {/* Brand */}
      <div className={cn("flex items-center gap-2.5 px-3 pt-3.5 pb-3", c && "flex-col")}>
        <Logo size={c ? 40 : 38} />
        {!c && <div className="min-w-0 flex-1"><div className="truncate text-[17px] font-bold tracking-tight">N Space</div><div className="truncate text-[11.5px] text-label2">AI teammates</div></div>}
        <button onClick={() => setSettings((s) => ({ ...s, theme: dark ? "light" : "dark" }))} title={dark ? "Light mode" : "Dark mode"}
          className="press lg-pill relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full">
          <Sun size={16} className={cn("absolute text-[#ff9f0a] transition-all duration-500", dark ? "translate-y-6 rotate-90 opacity-0" : "translate-y-0 opacity-100")} />
          <Moon size={15} className={cn("absolute text-[#5e5ce6] transition-all duration-500", dark ? "translate-y-0 opacity-100" : "-translate-y-6 -rotate-90 opacity-0")} />
        </button>
        {mobile ? (
          <button onClick={close} className="press lg-pill flex h-8 w-8 items-center justify-center rounded-full"><X size={16} /></button>
        ) : (
          <button onClick={() => setCollapsed?.(!c)} title={c ? "Expand" : "Collapse"} className="press flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-label2 hover:bg-fill">
            {c ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
          </button>
        )}
      </div>

      {/* New + search */}
      {c ? (
        <div className="flex justify-center pb-2"><button onClick={onNewBot} title="New Bot" className="press flex h-10 w-10 items-center justify-center rounded-[13px] bg-[#007aff] text-white shadow-[0_6px_18px_rgba(0,122,255,.35)]"><Plus size={20} strokeWidth={2.5} /></button></div>
      ) : (
        <div className="flex items-center gap-2 px-3 pb-2">
          <div className="flex h-9 flex-1 items-center gap-1.5 rounded-[11px] bg-fill px-2.5 text-label2">
            <Search size={15} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search Bots" className="w-full bg-transparent text-[15px] text-label outline-none placeholder:text-label2" />
          </div>
          <button onClick={() => { onNewBot(); if (mobile) close(); }} title="New Bot" className="press flex h-9 w-9 items-center justify-center rounded-[11px] bg-[#007aff] text-white shadow-[0_6px_18px_rgba(0,122,255,.35)]"><Plus size={19} strokeWidth={2.5} /></button>
        </div>
      )}

      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {/* Sections */}
        <div className={cn("mb-1 space-y-0.5", c && "flex flex-col items-center")}>
          {NAV.map((n, i) => {
            const active = section === n.id; const bd = badge(n.id);
            return (
              <button key={n.id} title={n.label} onClick={() => { setSection(n.id); if (mobile) close(); }} style={{ animationDelay: `${i * 30}ms` }}
                className={cn("fade-up press relative flex items-center gap-2.5 rounded-[12px] transition-all", c ? "h-11 w-11 justify-center" : "w-full px-2 py-1.5",
                  active ? "bg-[var(--surface)] shadow-[0_2px_10px_rgba(0,0,0,.06)]" : "hover:bg-[var(--surface)]/50")}>
                <span className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-[8px] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.35)]" style={{ background: `linear-gradient(160deg, ${n.color}cc, ${n.color})` }}><n.icon size={16} strokeWidth={2.2} /></span>
                {!c && <span className={cn("flex-1 text-left text-[14.5px]", active ? "font-semibold" : "font-medium")}>{n.label}</span>}
                {!c && n.id === "browser" && <span className={cn("h-2 w-2 rounded-full", online ? "bg-[#34c759] shadow-[0_0_6px_#34c759]" : "bg-label3")} />}
                {!c && bd > 0 && <span className={cn("rounded-full px-1.5 text-[11.5px] font-semibold", n.id === "automations" ? "bg-[#af52de] text-white" : "text-label2")}>{bd}</span>}
              </button>
            );
          })}
        </div>

        {/* Roster */}
        {!c && <div className="flex items-center px-2 pt-3 pb-1"><span className="flex-1 text-[12px] font-semibold uppercase tracking-wide text-label2">Bots · {bots.length}</span></div>}
        {c && <div className="mx-auto my-2 h-px w-8 bg-sep" />}
        <div className={cn("space-y-0.5", c && "flex flex-col items-center")}>
          {list.map(BotRow)}
          {!c && list.length === 0 && <div className="py-6 text-center text-[13px] text-label2">No Bots match “{q}”</div>}
        </div>
      </div>

      {/* Footer */}
      <div className={cn("pb-safe shadow-[inset_0_0.5px_0_var(--sep)] p-2.5", c && "flex flex-col items-center gap-2")}>
        {c ? (
          <span title={online ? "Local server online" : "Local server offline"} className={cn("flex h-9 w-9 items-center justify-center rounded-full", online ? "bg-[#34c759]/15 text-[#34c759]" : "bg-fill text-label2")}><Server size={16} /></span>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#5e5ce6] to-[#bf5af2] text-[13px] font-bold text-white">{(settings.userName || "U").slice(0, 1).toUpperCase()}</div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[14px] font-semibold">{settings.userName}</div>
              <button onClick={() => setSection("cloud")} className="press flex items-center gap-1 text-[11.5px] text-label2 hover:text-[#007aff]">
                <span className={cn("h-1.5 w-1.5 rounded-full", online ? "bg-[#34c759]" : "bg-label3")} />
                {online ? "Local server" : "Cloud mode"} · {Object.values(settings.keys).filter(Boolean).length}/{Object.keys(PROVIDERS).length} keys
              </button>
            </div>
            <button onClick={() => setSettings((s) => ({ ...s, language: s.language === "bn" ? "en" : s.language === "en" ? "auto" : "bn" }))} title="Reply language"
              className="press lg-pill flex h-8 items-center gap-1 rounded-full px-2.5 text-[12.5px] font-semibold"><Languages size={13} />{settings.language === "bn" ? "বাংলা" : settings.language === "en" ? "EN" : "Auto"}</button>
          </div>
        )}
      </div>
    </aside>
  );
}
