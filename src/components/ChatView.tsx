import { useEffect, useRef, useState } from "react";
import { ArrowUp, Mic, Paperclip, Square, SlidersHorizontal, X, Trash2, ChevronDown, Smartphone, Monitor, Tablet, RefreshCw, Download, Loader2, PanelRight } from "lucide-react";
import { useStore, useRuntime, PROVIDERS, type Provider } from "../lib/store";
import { runBot, stopBot } from "../lib/agent";
import BotAvatar, { StatusDot } from "./BotAvatar";
import MessageItem from "./MessageItem";
import { Sheet, MenuButton } from "./ui";
import { contextualSuggestions } from "../lib/suggest";
import { cn } from "../utils/cn";
import { readPassport } from "../lib/ocr";

export default function ChatView({ botId, onEdit, onOpenKeys }: { botId: string; onEdit: () => void; onOpenKeys: () => void }) {
  const bot = useStore((s) => s.bots.find((b) => b.id === botId));
  const thread = useStore((s) => s.threads[botId]) ?? [];
  const keys = useStore((s) => s.settings.keys);
  const lang = useStore((s) => s.settings.language);
  const updateBot = useStore((s) => s.updateBot);
  const clearThread = useStore((s) => s.clearThread);
  const liveId = useRuntime((s) => s.live[botId]);
  const rightOpen = useRuntime((s) => s.rightOpen);
  const setRT = useRuntime((s) => s.set);
  const showToast = useRuntime((s) => s.showToast);
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<{ name: string; size: number; text: string }[]>([]);
  const [listening, setListening] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [device, setDevice] = useState<"phone" | "tablet" | "desktop">("desktop");
  const [modelOpen, setModelOpen] = useState(false);
  const [pKey, setPKey] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const recRef = useRef<any>(null);
  const stick = useRef(true);

  useEffect(() => {
    (window as any).__activeBot = botId; updateBot(botId, { unread: 0 }); stick.current = true;
    return () => { if ((window as any).__activeBot === botId) (window as any).__activeBot = null; };
  }, [botId]);
  useEffect(() => { const el = scrollRef.current; if (el && stick.current) el.scrollTop = el.scrollHeight; }, [thread, botId]);
  useEffect(() => { const ta = taRef.current; if (ta) { ta.style.height = "auto"; ta.style.height = Math.min(ta.scrollHeight, 200) + "px"; } }, [input]);

  if (!bot) return null;
  const busy = !!liveId;
  const hasKey = !!keys[bot.provider];
  const liveMsg = busy ? thread.find((m) => m.id === liveId) : null;
  const liveStep = liveMsg?.steps?.slice().reverse().find((s) => s.status === "running" || s.status === "approval");
  const liveLabel = liveStep ? liveStep.label : liveMsg?.content ? (lang === "bn" ? "উত্তর লিখছে…" : "Writing response…") : (lang === "bn" ? "ভাবছে…" : "Thinking…");

  const send = (text = input) => {
    const t = text.trim(); if ((!t && !files.length) || busy) return;
    setInput(""); const f = files; setFiles([]); stick.current = true;
    navigator.vibrate?.(10);
    runBot(botId, t || `Please review the attached file${f.length > 1 ? "s" : ""}.`, { attachments: f });
  };
  const retry = () => { const u = [...thread].reverse().find((m) => m.role === "user"); if (u) runBot(botId, u.content); };

  const onFiles = async (list: FileList | null) => {
    if (!list) return;
    const out: typeof files = [];
    for (const f of Array.from(list)) {
      const isImg = /^image\//.test(f.type);
      const isPdf = f.type === "application/pdf" || /\.pdf$/i.test(f.name);
      if (!isImg && !isPdf && f.size > 2_000_000) { showToast(`${f.name} অনেক বড় (2MB)`); continue; }
      if (isImg || isPdf) {
        showToast(`${f.name} পড়া হচ্ছে…`);
        try {
          const S = useStore.getState().settings;
          const vision = S.keys.gemini ? { provider: "gemini" as const, key: S.keys.gemini, model: "gemini-3.8-flash" } : undefined;
          const res = await readPassport(f, { serverUrl: S.server.url, serverOnline: useRuntime.getState().serverOnline, vision });
          out.push({ name: f.name, size: f.size, text: `[${isPdf ? "PDF" : "Image"} · ${res.via}]\n${res.text.slice(0, 12000)}` });
          showToast(`${f.name} পড়া হয়েছে (${res.via})`);
        } catch {
          out.push({ name: f.name, size: f.size, text: `[${f.name}] ফাইলটি পড়া যায়নি, ম্যানুয়ালি তথ্য দিন।` });
        }
        continue;
      }
      if (!/^text\/|json|csv|xml|markdown|javascript|typescript/.test(f.type) && !/\.(txt|md|csv|json|ts|tsx|js|html|css|py|xml|yml|yaml)$/i.test(f.name)) { showToast("টেক্সট, ছবি বা PDF দিন"); continue; }
      out.push({ name: f.name, size: f.size, text: await f.text() });
    }
    setFiles((p) => [...p, ...out]);
  };

  const toggleMic = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { showToast("Voice input isn't supported in this browser"); return; }
    if (listening) { recRef.current?.stop(); return; }
    const r = new SR(); r.lang = lang === "bn" ? "bn-BD" : navigator.language || "en-US"; r.interimResults = true; r.continuous = false;
    const base = input;
    r.onresult = (e: any) => { const t = Array.from(e.results).map((x: any) => x[0].transcript).join(""); setInput((base ? base + " " : "") + t); };
    r.onend = () => setListening(false); r.onerror = () => setListening(false);
    recRef.current = r; r.start(); setListening(true);
  };

  const followUps = contextualSuggestions(thread, lang);
  const deviceW = { phone: 390, tablet: 820, desktop: "100%" }[device];

  return (
    <div className="relative flex h-full min-w-0 flex-1 flex-col">
      {/* Header */}
      <header className="lg-bar pt-safe z-10 shrink-0">
        <div className="flex h-[60px] items-center gap-2 px-3 md:px-5">
          <MenuButton />
          <button onClick={onEdit} className="press flex min-w-0 items-center gap-2.5 rounded-xl px-1 py-1 text-left">
            <BotAvatar shape={bot.shape} color={bot.color} status={busy ? "working" : bot.status} size={34} ring={false} />
            <div className="min-w-0">
              <div className="truncate text-[16px] font-semibold leading-tight">{bot.name}</div>
              <div className="flex items-center gap-1.5 text-[12px] text-label2"><StatusDot status={busy ? "working" : bot.status} /><span className="truncate">{busy ? liveLabel : bot.title}</span></div>
            </div>
          </button>
          <div className="flex-1" />
          <button onClick={() => setModelOpen(true)} className="press lg-pill hidden h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium lg:flex">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: hasKey ? "#34c759" : "#ff9500" }} />{bot.agentId ? "Mistral Agent" : bot.model}<ChevronDown size={12} />
          </button>
          <button onClick={() => { if (confirm(`Clear chat with ${bot.name}?`)) clearThread(botId); }} title="Clear chat" className="press flex h-9 w-9 items-center justify-center rounded-full text-label2 hover:bg-fill"><Trash2 size={17} /></button>
          <button onClick={onEdit} title="Bot settings" className="press flex h-9 w-9 items-center justify-center rounded-full text-label2 hover:bg-fill"><SlidersHorizontal size={17} /></button>
          <button onClick={() => setRT({ rightOpen: !rightOpen, rightTab: "computer" })} title="Computer"
            className={cn("press relative flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold transition-all", rightOpen ? "bg-[#007aff] text-white shadow-[0_6px_18px_rgba(0,122,255,.35)]" : "lg-pill text-label")}>
            <Monitor size={16} /><span className="hidden sm:inline">Computer</span>
            {busy && <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--surface)] bg-[#34c759]" />}
          </button>
        </div>
      </header>

      {/* Thread */}
      <div ref={scrollRef} onScroll={(e) => { const el = e.currentTarget; stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80; }} className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[800px] px-4 pt-6 pb-4 md:px-8">
          {thread.length === 0 ? (
            <div className="fade-up flex min-h-[62vh] flex-col items-center justify-center text-center">
              <div className="relative">
                <div className="absolute inset-0 scale-150 rounded-full blur-2xl" style={{ background: bot.color, opacity: 0.22 }} />
                <BotAvatar shape={bot.shape} color={bot.color} status={bot.status} size={96} />
              </div>
              <div className="mt-6 text-[26px] font-bold tracking-tight">{bot.name}</div>
              <div className="mt-1.5 max-w-[38ch] text-[14.5px] leading-snug text-label2">{bot.title}</div>
            </div>
          ) : (
            <div className="space-y-6">
              {thread.map((m) => <MessageItem key={m.id} m={m} bot={bot} live={liveId === m.id} onPreview={setPreview} onOpenKeys={onOpenKeys} onRetry={retry} onToast={showToast} />)}
            </div>
          )}
        </div>
      </div>

      {/* Fixed composer */}
      <div className="pb-safe relative z-10 shrink-0 px-3 pt-1 md:px-8">
        {thread.length > 0 && !busy && followUps.length > 0 && (
          <div className="mx-auto mb-2 flex w-full max-w-[800px] gap-2 overflow-x-auto no-scrollbar">
            {followUps.map((c, i) => (
              <button
                key={c}
                onClick={() => send(c)}
                style={{ animationDelay: `${i * 70}ms` }}
                className="fade-up press shrink-0 rounded-full bg-fill px-3.5 py-1.5 text-[13px] font-medium text-label hover:bg-fill2"
              >
                {c}
              </button>
            ))}
          </div>
        )}
        <div className="mx-auto w-full max-w-[800px]">
          {busy && (
            <button onClick={() => setRT({ rightOpen: true, rightTab: "activity" })} className="pop press lg-pill mx-auto mb-2 flex max-w-full items-center gap-2 rounded-full py-1.5 pr-3.5 pl-2 text-[13px]">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#007aff] text-white"><Loader2 size={13} className="animate-spin" /></span>
              <span className="shimmer-text truncate font-semibold">{liveLabel}</span>
              <span className="shrink-0 text-label2">· {liveMsg?.steps?.length ?? 0} steps</span>
              <PanelRight size={14} className="shrink-0 text-[#007aff]" />
            </button>
          )}
          {files.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {files.map((f, i) => (
                <span key={i} className="pop lg-pill flex items-center gap-1.5 rounded-full py-1 pr-1 pl-3 text-[13px]">
                  <Paperclip size={12} className="text-[#007aff]" />{f.name}
                  <button onClick={() => setFiles(files.filter((_, j) => j !== i))} className="flex h-5 w-5 items-center justify-center rounded-full bg-fill2"><X size={11} /></button>
                </span>
              ))}
            </div>
          )}
          <div className={cn("lg-card rounded-[26px] px-2 pt-2 pb-2 transition-shadow", listening && "ring-2 ring-[#ff3b30]/60")}>
            <textarea
              ref={taRef} rows={1} value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !(e.nativeEvent as any).isComposing && window.innerWidth >= 768) { e.preventDefault(); send(); } }}
              placeholder={listening ? (lang === "bn" ? "শুনছি…" : "Listening…") : lang === "bn" ? `${bot.name} কে বার্তা লিখুন` : `Message ${bot.name}`}
              className="block max-h-[200px] w-full resize-none bg-transparent px-3 py-1.5 text-[16px] leading-6 outline-none placeholder:text-label3"
            />
            <div className="mt-1 flex items-center gap-1">
              <button onClick={() => fileRef.current?.click()} title="Attach" className="press flex h-9 w-9 items-center justify-center rounded-full text-label2 hover:bg-fill"><Paperclip size={18} /></button>
              <input ref={fileRef} type="file" multiple hidden onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }} />
              <button onClick={() => setModelOpen(true)} className="press flex h-8 min-w-0 items-center gap-1.5 rounded-full bg-fill px-2.5 text-[12.5px] font-medium text-label">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: hasKey ? "#34c759" : "#ff9500" }} />
                <span className="truncate">{PROVIDERS[bot.provider].label.replace(" · xAI", "")} · {bot.agentId ? "Agent" : bot.model}</span><ChevronDown size={12} className="shrink-0" />
              </button>
              <div className="flex-1" />
              <button onClick={toggleMic} title="Voice" className={cn("press flex h-9 w-9 items-center justify-center rounded-full", listening ? "bg-[#ff3b30] text-white" : "text-label2 hover:bg-fill")}><Mic size={18} /></button>
              {busy ? (
                <button onClick={() => stopBot(botId)} className="press flex h-9 w-9 items-center justify-center rounded-full bg-label text-[var(--surface)]"><Square size={12} fill="currentColor" /></button>
              ) : (
                <button onClick={() => send()} disabled={!input.trim() && !files.length} className="press flex h-9 w-9 items-center justify-center rounded-full bg-[#007aff] text-white shadow-[0_4px_14px_rgba(0,122,255,.4)] transition-all disabled:bg-fill2 disabled:text-label3 disabled:shadow-none"><ArrowUp size={19} strokeWidth={2.6} /></button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Model switcher */}
      <Sheet open={modelOpen} onClose={() => setModelOpen(false)} title="Model">
        <div className="p-4">
          {(Object.keys(PROVIDERS) as Provider[]).map((p) => (
            <div key={p} className="mb-4">
              <div className="mb-1.5 flex items-center gap-2 px-2 text-[13px] uppercase text-label2">{PROVIDERS[p].label}{!keys[p] && <span className="normal-case text-[#ff9500]">· no key</span>}</div>
              <div className="overflow-hidden rounded-[14px] bg-surface">
                {PROVIDERS[p].models.map((m) => (
                  <button key={m} onClick={() => { updateBot(botId, { provider: p, model: m }); setModelOpen(false); }} className="flex w-full items-center justify-between px-4 py-2.5 text-left text-[15px] shadow-[inset_0_-0.5px_0_var(--sep)] last:shadow-none active:bg-fill">
                    {m}{bot.provider === p && bot.model === m && <span className="text-[#007aff]">✓</span>}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Sheet>

      {/* App preview */}
      <Sheet open={!!preview} onClose={() => setPreview(null)} title="App preview" size="full"
        right={<button onClick={() => { const b = new Blob([preview ?? ""], { type: "text/html" }); const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "app.html"; a.click(); }} className="press flex h-8 w-8 items-center justify-center rounded-full text-[#007aff]"><Download size={18} /></button>}>
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-center gap-2 px-4 pb-3">
            {([["phone", Smartphone], ["tablet", Tablet], ["desktop", Monitor]] as const).map(([d, I]) => (
              <button key={d} onClick={() => setDevice(d)} className={cn("press flex h-8 w-10 items-center justify-center rounded-lg", device === d ? "bg-surface text-[#007aff] shadow-sm" : "text-label2")}><I size={16} /></button>
            ))}
            <button onClick={() => setPKey((k) => k + 1)} className="press flex h-8 w-10 items-center justify-center rounded-lg text-label2"><RefreshCw size={15} /></button>
          </div>
          <div className="flex min-h-[60vh] flex-1 justify-center overflow-auto bg-fill p-3">
            <iframe key={pKey} title="preview" srcDoc={preview ?? ""} sandbox="allow-scripts allow-forms allow-modals allow-popups allow-same-origin" className="h-full min-h-[60vh] rounded-xl bg-white shadow-xl transition-all duration-300" style={{ width: deviceW, maxWidth: "100%" }} />
          </div>
        </div>
      </Sheet>
    </div>
  );
}
