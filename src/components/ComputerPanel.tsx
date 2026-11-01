import { useEffect, useMemo, useRef, useState } from "react";
import { X, Maximize2, Globe, Lock, Loader2, ExternalLink, ArrowLeft, ChevronUp, ChevronDown, Monitor, ListTree, FolderOpen, FileDown, MessageCircle, Check, AlertTriangle, Search, MousePointerClick, Keyboard, FileText, Brain, Users, Sparkles, CornerDownLeft, Hand, Terminal } from "lucide-react";
import { useStore, useRuntime, type Step, type Message } from "../lib/store";
import { quickBrowse, takeover } from "../lib/agent";
import BotAvatar, { StatusDot } from "./BotAvatar";
import { Segmented } from "./ui";
import { cn } from "../utils/cn";

const ICON: Record<string, typeof Globe> = { search: Search, browse: Globe, click: MousePointerClick, type: Keyboard, pdf: FileText, whatsapp: MessageCircle, remember: Brain, ask_bot: Users };

function wallpaper(dark: boolean) {
  const h = new Date().getHours();
  if (dark || h < 6 || h >= 20) return "linear-gradient(160deg,#0b1026 0%,#1b1440 55%,#33205a 100%)";
  if (h < 10) return "linear-gradient(160deg,#ffd7a8 0%,#f6a6b2 45%,#7d8dd8 100%)";
  if (h < 17) return "linear-gradient(160deg,#8ec5ff 0%,#c4e2ff 50%,#eef5ff 100%)";
  return "linear-gradient(160deg,#ff9a62 0%,#c4507a 55%,#3a2a6b 100%)";
}

/** Real-time screen of a Bot's computer. Clickable (real Playwright control) when the local server is online. */
export function LiveScreen({ botId, interactive = false, fill = false }: { botId?: string; interactive?: boolean; fill?: boolean }) {
  const b = useRuntime((s) => s.browser);
  const online = useRuntime((s) => s.serverOnline);
  const live = useRuntime((s) => s.live);
  const sessions = useStore((s) => s.sessions);
  const bots = useStore((s) => s.bots);
  const dark = useStore((s) => s.settings.theme === "dark");
  const [addr, setAddr] = useState("");
  const [ripple, setRipple] = useState<{ x: number; y: number; k: number } | null>(null);
  const [imgOk, setImgOk] = useState(true);
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(t); }, []);

  const last = sessions.find((s) => !botId || s.botId === botId);
  const cur = b && (!botId || b.botId === botId) ? b
    : last ? { botId: last.botId, botName: bots.find((x) => x.id === last.botId)?.name ?? "Bot", url: last.url, title: last.title, screenshot: last.screenshot, label: "Last page visited", loading: false } : null;
  useEffect(() => { setAddr(cur?.url ?? ""); setImgOk(true); }, [cur?.url, cur?.screenshot]);
  const running = cur ? !!live[cur.botId] : false;
  let host = cur?.url ?? ""; try { host = new URL(host).hostname; } catch { /* */ }

  const click = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !cur) return;
    if (!online) { useRuntime.getState().showToast("Start the local server to click on the real computer"); return; }
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    setRipple({ x, y, k: Date.now() }); takeover("mouse", { x, y });
  };

  return (
    <div className={cn("flex flex-col overflow-hidden rounded-[18px] border border-sep bg-surface shadow-[0_8px_30px_rgba(0,0,0,.08)]", fill && "h-full")}>
      <div className="flex h-10 shrink-0 items-center gap-2 bg-grouped/80 px-3 shadow-[inset_0_-0.5px_0_var(--sep)]">
        <div className="flex gap-1.5"><span className="h-3 w-3 rounded-full bg-[#ff5f57]" /><span className="h-3 w-3 rounded-full bg-[#febc2e]" /><span className="h-3 w-3 rounded-full bg-[#28c840]" /></div>
        <form onSubmit={(e) => { e.preventDefault(); if (addr.trim()) quickBrowse(addr.trim(), botId); }} className="mx-1 flex h-6 min-w-0 flex-1 items-center gap-1.5 rounded-md bg-surface px-2 text-[12px] shadow-[0_0_0_0.5px_var(--sep)]">
          {cur?.loading ? <Loader2 size={11} className="shrink-0 animate-spin text-[#007aff]" /> : <Lock size={10} className="shrink-0 text-label2" />}
          {interactive ? <input value={addr} onChange={(e) => setAddr(e.target.value)} placeholder="Enter a URL" autoCapitalize="off" className="w-full bg-transparent text-[12px] outline-none" />
            : <span className="truncate text-label">{host || "about:blank"}</span>}
        </form>
        {cur && <button onClick={() => window.open(cur.url, "_blank")} className="press text-label2 hover:text-label"><ExternalLink size={14} /></button>}
      </div>
      <div onClick={click} className={cn("relative overflow-hidden bg-grouped", fill ? "min-h-0 flex-1" : "aspect-[16/10]", cur?.loading && "scanline", interactive && online && cur && "cursor-crosshair")}>
        {cur?.screenshot && imgOk ? (
          <img key={cur.screenshot.slice(-48)} src={cur.screenshot} alt="Live computer" draggable={false} onError={() => setImgOk(false)} className="fade-in h-full w-full select-none object-cover object-top" />
        ) : cur ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-label2"><Loader2 className="animate-spin" size={22} /><span className="text-[13px]">Loading {host}…</span></div>
        ) : (
          <div className="relative flex h-full flex-col items-center justify-center text-white" style={{ background: wallpaper(dark) }}>
            <div className="text-[44px] font-light leading-none tracking-tight drop-shadow">{now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</div>
            <div className="mt-1 text-[13px] font-medium opacity-90 drop-shadow">{now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}</div>
            <div className="lg-pill mt-4 rounded-full px-3 py-1 text-[12px] text-label">Computer idle — ask a Bot to browse</div>
            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-2xl bg-white/25 px-2 py-1.5 backdrop-blur">
              {[Globe, Terminal, FolderOpen, FileText].map((I, i) => <span key={i} className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/85 text-[#3c3c43]"><I size={14} /></span>)}
            </div>
          </div>
        )}
        {ripple && <span key={ripple.k} className="click-ripple" style={{ left: `${ripple.x * 100}%`, top: `${ripple.y * 100}%` }} />}
      </div>
      <div className="flex h-9 shrink-0 items-center gap-2 px-3 text-[12px]">
        <span className={cn("h-2 w-2 rounded-full", running ? "bg-[#34c759] shadow-[0_0_6px_#34c759]" : "bg-label3")} />
        <span className="font-semibold">{cur?.botName ?? "Computer"}</span>
        <span className={cn("truncate", running && cur?.loading ? "shimmer-text font-medium" : "text-label2")}>{cur?.label ?? "Idle"}</span>
        <span className="ml-auto shrink-0 text-label3">{online ? "Playwright · live" : "Cloud preview"}</span>
      </div>
    </div>
  );
}

function StepNode({ s, last }: { s: Step; last: boolean }) {
  const I = ICON[s.tool] ?? Sparkles;
  const col = s.status === "error" ? "#ff3b30" : s.status === "running" ? "#007aff" : s.status === "approval" ? "#ff9500" : s.status === "denied" ? "#8e8e93" : "#34c759";
  return (
    <div className="fade-up relative flex gap-3 pb-3">
      {!last && <span className="absolute top-8 bottom-0 left-[15px] w-[2px] rounded bg-sep" />}
      <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white shadow-sm" style={{ background: col }}>
        {s.status === "running" ? <Loader2 size={14} className="animate-spin" /> : <I size={14} />}
        {s.status === "running" && <span className="pulse-ring absolute inset-0 rounded-full border-2" style={{ borderColor: col }} />}
      </span>
      <div className="min-w-0 flex-1 pt-1">
        <div className={cn("text-[13.5px] font-medium", s.status === "running" && "shimmer-text")}>{s.label}</div>
        {s.note && <div className="mt-0.5 text-[12.5px] italic text-label2">{s.note}</div>}
        {s.detail && <div className="truncate text-[12px] text-label2">{s.detail}</div>}
        {s.status === "approval" && <div className="mt-1 text-[12px] font-semibold text-[#ff9500]">Waiting for your approval in chat</div>}
        {s.screenshot && <img src={s.screenshot} alt="" loading="lazy" onClick={() => useRuntime.getState().set({ rightTab: "computer", browser: { botId: "", botName: "Step", url: s.url ?? "", screenshot: s.screenshot, label: s.label, loading: false } })} className="mt-1.5 aspect-[16/10] w-40 cursor-pointer rounded-lg border border-sep object-cover object-top" />}
      </div>
    </div>
  );
}

export default function ComputerPanel({ botId, onClose }: { botId: string; onClose: () => void }) {
  const bot = useStore((s) => s.bots.find((b) => b.id === botId));
  const thread = useStore((s) => s.threads[botId]);
  const tab = useRuntime((s) => s.rightTab);
  const set = useRuntime((s) => s.set);
  const liveId = useRuntime((s) => s.live[botId]);
  const online = useRuntime((s) => s.serverOnline);
  const [full, setFull] = useState(false);
  const [typed, setTyped] = useState("");
  const actRef = useRef<HTMLDivElement>(null);

  const turns = useMemo(() => {
    const out: { id: string; prompt: string; time: number; reply: Message | null }[] = [];
    let cur: (typeof out)[number] | null = null;
    for (const m of thread ?? []) {
      if (m.role === "user") { cur = { id: m.id, prompt: m.content, time: m.time, reply: null }; out.push(cur); }
      else if (m.role === "assistant" && cur && !cur.reply) cur.reply = m;
    }
    return out.slice(-8);
  }, [thread]);
  const files = useMemo(() => (thread ?? []).flatMap((m) => (m.steps ?? []).filter((s) => s.link).map((s) => ({ ...s, time: m.time }))).reverse(), [thread]);
  useEffect(() => { if (tab === "activity" && actRef.current) actRef.current.scrollTop = actRef.current.scrollHeight; }, [turns, tab]);

  if (!bot) return null;
  const sendKeys = (enter: boolean) => { takeover("keys", { text: typed, enter }); setTyped(""); };

  const controls = (
    <div className="mt-3 space-y-2">
      <div className="grid grid-cols-4 gap-2">
        {[[ArrowLeft, "Back", () => takeover("back")], [ChevronUp, "Up", () => takeover("scroll", { dy: -600 })], [ChevronDown, "Down", () => takeover("scroll", { dy: 600 })], [Maximize2, "Take over", () => setFull(true)]].map(([I, l, fn]: any) => (
          <button key={l} onClick={fn} className="press flex flex-col items-center gap-1 rounded-[14px] bg-fill py-2 text-[11.5px] font-medium text-label"><I size={16} />{l}</button>
        ))}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); sendKeys(true); }} className="flex items-center gap-2 rounded-[14px] bg-fill px-3">
        <Keyboard size={15} className="text-label2" />
        <input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={online ? "Type into the page…" : "Local server needed for typing"} className="h-10 w-full bg-transparent text-[14px] outline-none placeholder:text-label3" />
        <button type="button" onClick={() => sendKeys(false)} disabled={!typed} className="text-[12.5px] font-semibold text-[#007aff] disabled:opacity-30">Type</button>
        <button className="text-[#007aff]"><CornerDownLeft size={15} /></button>
      </form>
      {!online && <div className="rounded-[14px] bg-[#ff9500]/10 p-3 text-[12.5px] leading-snug text-label2"><b className="text-[#ff9500]">Cloud preview mode.</b> Run <code className="rounded bg-fill px-1">node server/index.mjs</code> for a real Chromium computer you can click, scroll and type on.</div>}
    </div>
  );

  return (
    <aside className="lg-card flex h-full w-full flex-col overflow-hidden md:rounded-[26px]">
      <div className="pt-safe shrink-0">
        <div className="flex h-[58px] items-center gap-2.5 px-4">
          <BotAvatar shape={bot.shape} color={bot.color} status={liveId ? "working" : bot.status} size={30} ring={false} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[15px] font-semibold">{bot.name}'s computer</div>
            <div className="flex items-center gap-1.5 text-[11.5px] text-label2"><StatusDot status={liveId ? "working" : bot.status} />{liveId ? "Active · working now" : "Idle"}</div>
          </div>
          <button onClick={() => setFull(true)} title="Take over" className="press flex h-8 w-8 items-center justify-center rounded-full text-label2 hover:bg-fill"><Hand size={16} /></button>
          <button onClick={onClose} className="press flex h-8 w-8 items-center justify-center rounded-full bg-fill text-label2"><X size={15} /></button>
        </div>
        <div className="px-4 pb-3">
          <Segmented value={tab} onChange={(v) => set({ rightTab: v })} options={[
            { value: "computer", label: <><Monitor size={13} /> Computer</> },
            { value: "activity", label: <><ListTree size={13} /> Activity{liveId && <span className="ml-0.5 h-1.5 w-1.5 animate-pulse rounded-full bg-[#007aff]" />}</> },
            { value: "files", label: <><FolderOpen size={13} /> Files{files.length ? ` ${files.length}` : ""}</> },
          ]} />
        </div>
      </div>

      <div ref={actRef} className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
        {tab === "computer" && <div className="fade-in"><LiveScreen botId={botId} interactive />{controls}</div>}

        {tab === "activity" && (
          <div className="fade-in">
            {turns.length === 0 && <div className="py-16 text-center text-[14px] text-label2">No activity yet. Every step of the agentic flow shows here in real time.</div>}
            {turns.map((t) => {
              const steps = t.reply?.steps ?? []; const isLive = t.reply?.id === liveId;
              return (
                <div key={t.id} className="mb-5">
                  <div className="mb-2.5 flex justify-end"><div className="max-w-[90%] truncate rounded-[16px] rounded-br-[5px] bg-[#007aff] px-3 py-1.5 text-[13px] text-white">{t.prompt}</div></div>
                  {steps.map((s, i) => <StepNode key={s.id} s={s} last={i === steps.length - 1 && !t.reply} />)}
                  {t.reply && (
                    <div className="fade-up flex gap-3">
                      <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white", t.reply.error ? "bg-[#ff3b30]" : isLive ? "bg-[#5e5ce6]" : "bg-[#34c759]")}>
                        {t.reply.error ? <AlertTriangle size={14} /> : isLive ? <Sparkles size={14} className="animate-pulse" /> : <Check size={15} strokeWidth={3} />}
                      </span>
                      <div className="min-w-0 pt-1">
                        <div className={cn("text-[13.5px] font-medium", isLive && "shimmer-text")}>{t.reply.error ? "Failed" : isLive ? (t.reply.content ? "Writing response…" : "Thinking…") : "Responded"}</div>
                        <div className="truncate text-[12px] text-label2">{new Date(t.reply.time).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} · {t.reply.model}</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab === "files" && (
          <div className="fade-in space-y-2">
            {files.length === 0 && <div className="py-16 text-center text-[14px] text-label2">PDFs and links created by {bot.name} appear here.</div>}
            {files.map((f) => (
              <a key={f.id} href={f.link} target="_blank" rel="noreferrer" download={f.tool === "pdf" ? f.detail : undefined} className="press flex items-center gap-3 rounded-[16px] bg-surface p-3 shadow-[0_1px_2px_rgba(0,0,0,.05)]">
                <span className={cn("flex h-10 w-10 items-center justify-center rounded-[12px] text-white", f.tool === "pdf" ? "bg-[#ff3b30]" : "bg-[#25d366]")}>{f.tool === "pdf" ? <FileDown size={18} /> : <MessageCircle size={18} />}</span>
                <div className="min-w-0 flex-1"><div className="truncate text-[14px] font-semibold">{f.detail || f.linkLabel}</div><div className="text-[12px] text-label2">{f.linkLabel} · {new Date(f.time).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</div></div>
                <ExternalLink size={14} className="text-label3" />
              </a>
            ))}
          </div>
        )}
      </div>

      {full && (
        <div className="fade-in fixed inset-0 z-[70] flex flex-col bg-black/55 p-3 backdrop-blur-md md:p-8">
          <div className="pt-safe mb-3 flex items-center gap-3">
            <span className="lg-pill flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] font-semibold text-label"><Hand size={14} className="text-[#007aff]" /> You're in control of {bot.name}'s computer</span>
            <button onClick={() => setFull(false)} className="press ml-auto rounded-full bg-white px-4 py-1.5 text-[13.5px] font-semibold text-black">Hand back</button>
          </div>
          <div className="min-h-0 flex-1"><LiveScreen botId={botId} interactive fill /></div>
          <div className="mx-auto mt-3 w-full max-w-xl">{controls}</div>
        </div>
      )}
    </aside>
  );
}
