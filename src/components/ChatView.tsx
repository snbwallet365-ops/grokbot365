import { useEffect, useRef, useState } from "react";
import { ArrowUp, Mic, Paperclip, Square, SlidersHorizontal, X, Trash2, ChevronDown, Smartphone, Monitor, Tablet, RefreshCw, Download, Loader2, PanelRight, Sparkles } from "lucide-react";
import { useStore, useRuntime, PROVIDERS, type Provider } from "../lib/store";
import { runBot, stopBot } from "../lib/agent";
import BotAvatar, { StatusDot } from "./BotAvatar";
import MessageItem from "./MessageItem";
import { Sheet, MenuButton } from "./ui";
import { cn } from "../utils/cn";

const SUGGEST_EN: Record<string, string[]> = {
  grok: ["Plan my week and list the top 5 priorities", "Research the latest AI agent news and summarise with sources", "Ask the Visa Expert what documents a UK visitor visa needs", "Remember: I prefer short bullet-point answers"],
  browser: ["Go to news.ycombinator.com and list the top 5 stories", "Search for the best rated laptop under $1000 in 2026", "Open github.com/trending and summarise the top repos", "Find the official Schengen visa fee today"],
  visa: ["My UK visit visa was refused under V4.2(a) and (c). What should I do?", "Analyse my US B1/B2 214(b) refusal and build a reapplication plan", "Schengen tourist visa checklist for a self-employed applicant", "Write a cover letter for a Canada visitor visa reapplication"],
  legal: ["Draft a mutual NDA between two companies", "Create a freelance service agreement with milestones", "Write a sponsorship invitation letter for a visitor visa", "Generate an affidavit of support template"],
  pdf: ["Create a professional CV PDF for a senior React developer", "Make an invoice PDF for 3 web design services", "Generate a 7-day Japan travel itinerary as PDF", "Produce a project proposal PDF for a mobile app"],
  base44: ["Build a habit tracker app with streaks", "Create a CRM for small business with contacts and deals", "Make an expense splitter app for trips", "Build a Kanban task board with drag and drop"],
  default: ["What can you do for me?", "Search the web for today's top headlines", "Summarise a topic in 5 bullets", "Create a PDF report about renewable energy"],
};
const SUGGEST_BN: Record<string, string[]> = {
  grok: ["আমার এই সপ্তাহের কাজের পরিকল্পনা করে শীর্ষ ৫টি অগ্রাধিকার দাও", "আজকের এআই এজেন্ট খবর খুঁজে সূত্রসহ সারাংশ দাও", "ভিসা এক্সপার্টকে জিজ্ঞেস করো UK ভিজিট ভিসায় কী কী কাগজ লাগে", "মনে রাখো: আমি সংক্ষিপ্ত বুলেট পয়েন্টে উত্তর পছন্দ করি"],
  browser: ["news.ycombinator.com এ গিয়ে শীর্ষ ৫টি খবর বলো", "২০২৬ সালে $১০০০ এর নিচে সেরা ল্যাপটপ খুঁজে দাও", "github.com/trending খুলে শীর্ষ রিপোগুলোর সারাংশ দাও", "আজকের শেনজেন ভিসা ফি অফিসিয়াল সূত্র থেকে খুঁজে দাও"],
  visa: ["আমার UK ভিজিট ভিসা V4.2(a) ও (c) কারণে রিজেক্ট হয়েছে, এখন কী করব?", "আমার US B1/B2 ভিসা 214(b) তে রিফিউজ হয়েছে — পুনরায় আবেদনের পূর্ণ পরিকল্পনা দাও", "সেলফ-এমপ্লয়েড আবেদনকারীর জন্য শেনজেন ট্যুরিস্ট ভিসার চেকলিস্ট", "কানাডা ভিজিটর ভিসা পুনঃআবেদনের কভার লেটার লিখে দাও"],
  legal: ["দুই কোম্পানির মধ্যে একটি মিউচুয়াল NDA তৈরি করো", "মাইলস্টোনসহ ফ্রিল্যান্স সার্ভিস চুক্তি তৈরি করো", "ভিজিট ভিসার জন্য স্পনসরশিপ ইনভাইটেশন লেটার লেখো", "অ্যাফিডেভিট অফ সাপোর্ট টেমপ্লেট বানাও"],
  pdf: ["সিনিয়র React ডেভেলপারের জন্য প্রফেশনাল CV PDF বানাও", "৩টি ওয়েব ডিজাইন সার্ভিসের ইনভয়েস PDF বানাও", "৭ দিনের জাপান ভ্রমণ পরিকল্পনা PDF আকারে দাও", "একটি মোবাইল অ্যাপের প্রজেক্ট প্রপোজাল PDF বানাও"],
  base44: ["স্ট্রিকসহ একটি হ্যাবিট ট্র্যাকার অ্যাপ বানাও", "ছোট ব্যবসার জন্য কন্টাক্ট ও ডিলসহ CRM বানাও", "ট্রিপের খরচ ভাগ করার অ্যাপ বানাও", "ড্র্যাগ-এন্ড-ড্রপ কানবান বোর্ড বানাও"],
  default: ["তুমি আমার জন্য কী কী করতে পারো?", "আজকের প্রধান খবরগুলো ওয়েবে খুঁজে দাও", "যেকোনো বিষয় ৫টি পয়েন্টে বুঝিয়ে দাও", "নবায়নযোগ্য শক্তি নিয়ে একটি PDF রিপোর্ট বানাও"],
};

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
      if (f.size > 2_000_000) { showToast(`${f.name} is too large (2MB max)`); continue; }
      if (!/^text\/|json|csv|xml|markdown|javascript|typescript/.test(f.type) && !/\.(txt|md|csv|json|ts|tsx|js|html|css|py|xml|yml|yaml)$/i.test(f.name)) { showToast("Text-based files only (txt, md, csv, json, code)"); continue; }
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

  const S = lang === "bn" ? SUGGEST_BN : SUGGEST_EN;
  const sugg = S[bot.id] ?? S[bot.knowledge ?? ""] ?? S.default;
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
            <div className="fade-up flex min-h-[55vh] flex-col items-center justify-center text-center">
              <div className="relative"><div className="absolute inset-0 scale-150 rounded-full blur-2xl" style={{ background: bot.color, opacity: 0.25 }} /><BotAvatar shape={bot.shape} color={bot.color} status={bot.status} size={92} /></div>
              <div className="mt-5 text-[28px] font-bold tracking-tight">{bot.name}</div>
              <div className="mt-1 max-w-sm text-[15px] text-label2">{bot.title} · {PROVIDERS[bot.provider].label}{bot.agentId ? " Agent" : ` · ${bot.model}`}</div>
              {!hasKey && <button onClick={onOpenKeys} className="press mt-4 rounded-full bg-[#ff9500]/15 px-4 py-2 text-[14px] font-semibold text-[#ff9500]">Add {PROVIDERS[bot.provider].label} API key to start →</button>}
              <div className="mt-8 grid w-full max-w-[640px] grid-cols-1 gap-2.5 sm:grid-cols-2">
                {sugg.map((s, i) => (
                  <button key={s} onClick={() => send(s)} style={{ animationDelay: `${i * 60}ms` }} className="fade-up press lg-pill flex items-start gap-2 rounded-[18px] px-4 py-3 text-left text-[14.5px] leading-snug hover:-translate-y-0.5">
                    <Sparkles size={15} className="mt-0.5 shrink-0 text-[#007aff]" />{s}
                  </button>
                ))}
              </div>
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
          <div className="mt-1.5 pb-0.5 text-center text-[11px] text-label3">N Space · {bot.name} {lang === "bn" ? "বাংলায় উত্তর দেবে" : "may make mistakes — verify important info"}</div>
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
