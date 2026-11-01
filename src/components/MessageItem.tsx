import { memo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChevronRight, Globe, Search, MousePointerClick, Keyboard, FileText, MessageCircle, Brain, Users, Check, Loader2, Copy, FileDown, RotateCcw, Volume2, Play, KeyRound, AlertTriangle, Paperclip, ExternalLink, Sparkles } from "lucide-react";
import type { Bot, Message, Step } from "../lib/store";
import { useRuntime, PROVIDERS } from "../lib/store";
import { resolveApproval, visibleText } from "../lib/agent";
import { pdfFromMarkdown } from "../lib/pdf";
import BotAvatar from "./BotAvatar";
import { cn } from "../utils/cn";

const ICON: Record<string, typeof Globe> = { search: Search, browse: Globe, click: MousePointerClick, type: Keyboard, pdf: FileText, whatsapp: MessageCircle, remember: Brain, ask_bot: Users };
const fmtTime = (t: number) => new Date(t).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

function StepRow({ s, bot }: { s: Step; bot: Bot }) {
  const I = ICON[s.tool] ?? Sparkles;
  const openShot = () => s.screenshot && useRuntime.getState().set({ browser: { botId: bot.id, botName: bot.name, url: s.url ?? "", screenshot: s.screenshot, label: s.label, loading: false }, browserMin: false, rightOpen: true, rightTab: "computer" });
  return (
    <div className="fade-up py-1.5">
      {s.note && <div className="mb-1 text-[13.5px] italic text-label2">{s.note}</div>}
      <div className="flex items-center gap-2.5">
        <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", s.status === "error" ? "bg-[#ff3b30]/10 text-[#ff3b30]" : "bg-[#007aff]/10 text-[#007aff]")}><I size={14} /></span>
        <div className="min-w-0 flex-1">
          <div className={cn("truncate text-[14px]", s.status === "running" ? "shimmer-text font-medium" : "text-label")}>{s.label}</div>
          {s.detail && <div className="truncate text-[12.5px] text-label2">{s.detail}</div>}
        </div>
        {s.status === "running" && <Loader2 size={15} className="animate-spin text-label2" />}
        {s.status === "done" && <Check size={15} className="text-[#34c759]" strokeWidth={2.6} />}
        {s.status === "error" && <AlertTriangle size={15} className="text-[#ff3b30]" />}
        {s.status === "denied" && <span className="text-[12px] text-label2">Denied</span>}
      </div>
      {s.status === "approval" && (
        <div className="pop mt-2 ml-9 rounded-2xl border border-[#ff9500]/30 bg-[#ff9500]/10 p-3">
          <div className="text-[14px] font-semibold text-label">Allow {bot.name} to {s.label.toLowerCase()}?</div>
          {s.detail && <div className="mt-0.5 text-[13px] text-label2">{s.detail}</div>}
          <div className="mt-2.5 flex gap-2">
            <button onClick={() => resolveApproval(s.id, true)} className="press rounded-full bg-[#007aff] px-4 py-1.5 text-[14px] font-semibold text-white">Allow</button>
            <button onClick={() => resolveApproval(s.id, false)} className="press rounded-full bg-fill px-4 py-1.5 text-[14px] font-semibold text-label">Deny</button>
          </div>
        </div>
      )}
      {s.screenshot && (
        <button onClick={openShot} className="press group mt-2 ml-9 block w-[min(320px,calc(100%-36px))] overflow-hidden rounded-xl border border-sep bg-grouped">
          <img src={s.screenshot} alt="" loading="lazy" className="aspect-[16/10] w-full object-cover object-top" onError={(e) => ((e.target as HTMLImageElement).style.opacity = "0")} />
          <div className="flex items-center gap-1.5 bg-surface px-2.5 py-1.5 text-[11.5px] text-label2"><Globe size={11} /><span className="truncate">{s.url}</span></div>
        </button>
      )}
      {s.link && (
        <a href={s.link} target="_blank" rel="noreferrer" download={s.tool === "pdf" ? s.detail : undefined}
          className={cn("press mt-2 ml-9 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13.5px] font-semibold", s.tool === "whatsapp" ? "bg-[#25d366] text-white" : "bg-[#007aff]/10 text-[#007aff]")}>
          {s.tool === "whatsapp" ? <MessageCircle size={14} /> : <FileDown size={14} />} {s.linkLabel}
        </a>
      )}
    </div>
  );
}

function Markdown({ text, onPreview }: { text: string; onPreview: (html: string) => void }) {
  return (
    <div className="md">
      <ReactMarkdown remarkPlugins={[remarkGfm]}
        components={{
          a: ({ node, ...p }) => <a {...p} target="_blank" rel="noreferrer" />,
          pre: ({ children }) => <>{children}</>,
          code: ({ className, children, ...rest }) => {
            const lang = /language-(\w+)/.exec(className || "")?.[1];
            const code = String(children).replace(/\n$/, "");
            if (!lang && !code.includes("\n")) return <code {...rest}>{children}</code>;
            return (
              <div className="my-3 overflow-hidden rounded-[14px] border border-sep bg-grouped">
                <div className="flex items-center gap-2 border-b border-sep bg-surface px-3 py-1.5 text-[12px] text-label2">
                  <span className="font-medium uppercase">{lang ?? "code"}</span>
                  <div className="flex-1" />
                  {(lang === "html" || /^<!doctype html/i.test(code)) && (
                    <button onClick={() => onPreview(code)} className="press flex items-center gap-1 rounded-full bg-[#34c759] px-2.5 py-0.5 text-[12px] font-semibold text-white"><Play size={11} fill="currentColor" /> Run app</button>
                  )}
                  <button onClick={() => navigator.clipboard.writeText(code)} className="press flex items-center gap-1 rounded-full px-2 py-0.5 hover:bg-fill"><Copy size={11} /> Copy</button>
                </div>
                <pre className="!m-0 !rounded-none !border-0 max-h-[360px] overflow-auto"><code>{code}</code></pre>
              </div>
            );
          },
        }}>
        {text}
      </ReactMarkdown>
    </div>
  );
}

function MessageItem({ m, bot, live, onPreview, onOpenKeys, onRetry, onToast }: {
  m: Message; bot: Bot; live: boolean; onPreview: (html: string) => void; onOpenKeys: () => void; onRetry: () => void; onToast: (t: string) => void;
}) {
  const [stepsOpen, setStepsOpen] = useState(true);
  const [thinkOpen, setThinkOpen] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  if (m.role === "note")
    return (
      <div className="flex items-center gap-3 py-1 text-[12px] text-label2">
        <div className="h-px flex-1 bg-fill" /><span className="max-w-[70%] truncate">{m.content}</span><div className="h-px flex-1 bg-fill" />
      </div>
    );

  if (m.role === "user")
    return (
      <div className="fade-up flex flex-col items-end gap-1">
        {m.attachments?.map((a) => (
          <div key={a.name} className="flex items-center gap-2 rounded-2xl bg-surface px-3 py-2 text-[13px] shadow-sm"><Paperclip size={13} className="text-[#007aff]" /> {a.name} <span className="text-label2">{Math.ceil(a.size / 1024)} KB</span></div>
        ))}
        <div className="max-w-[82%] whitespace-pre-wrap break-words rounded-[20px] rounded-br-[6px] bg-[#007aff] px-4 py-2.5 text-[16px] leading-[1.4] text-white">{m.content}</div>
      </div>
    );

  const text = visibleText(m.content);
  const steps = m.steps ?? [];
  const running = steps.some((s) => s.status === "running");
  const errKey = m.error?.startsWith("NO_KEY:") ? (m.error.split(":")[1] as keyof typeof PROVIDERS) : null;
  const errNet = m.error?.startsWith("NETWORK:") ? (m.error.split(":")[1] as keyof typeof PROVIDERS) : null;

  const speak = () => {
    if (speaking) { speechSynthesis.cancel(); setSpeaking(false); return; }
    const u = new SpeechSynthesisUtterance(text.replace(/[#*`>|_-]/g, ""));
    u.onend = () => setSpeaking(false); setSpeaking(true); speechSynthesis.speak(u);
  };
  const shareWa = () => window.open(`https://wa.me/?text=${encodeURIComponent(`${bot.name}:\n\n${text}`.slice(0, 3500))}`, "_blank");

  return (
    <div className="fade-up group flex gap-3">
      <div className="pt-0.5"><BotAvatar shape={bot.shape} color={bot.color} status={live ? "working" : "idle"} size={30} ring={false} /></div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-baseline gap-2">
          <span className="text-[14px] font-semibold">{bot.name}</span>
          <span className="text-[12px] text-label2">{fmtTime(m.time)}</span>
          {m.model && <span className="hidden truncate text-[11.5px] text-label3 sm:inline">{m.model}</span>}
        </div>

        {m.reasoning && (
          <div className="mb-2">
            <button onClick={() => setThinkOpen(!thinkOpen)} className="flex items-center gap-1 text-[13px] text-label2 hover:text-label">
              <span className={live && !text ? "shimmer-text font-medium" : ""}>{live && !text ? "Thinking" : "Thought process"}</span>
              <ChevronRight size={14} className={cn("transition-transform", thinkOpen && "rotate-90")} />
            </button>
            {thinkOpen && <div className="mt-1.5 max-h-60 overflow-y-auto whitespace-pre-wrap border-l-2 border-black/10 pl-3 text-[13px] leading-relaxed text-label2">{m.reasoning}</div>}
          </div>
        )}

        {steps.length > 0 && (
          <div className="mb-2 rounded-2xl bg-surface px-3 py-1.5 shadow-[0_0.5px_0_rgba(0,0,0,.06)]">
            <button onClick={() => setStepsOpen(!stepsOpen)} className="flex w-full items-center gap-1.5 py-1 text-[13px] text-label2">
              <span className={running ? "shimmer-text font-semibold" : "font-medium"}>{running ? "Working" : "Worked"} · {steps.length} step{steps.length > 1 ? "s" : ""}</span>
              <ChevronRight size={14} className={cn("ml-auto transition-transform", stepsOpen && "rotate-90")} />
            </button>
            {stepsOpen && <div className="pb-1">{steps.map((s) => <StepRow key={s.id} s={s} bot={bot} />)}</div>}
          </div>
        )}

        {text ? <Markdown text={text} onPreview={onPreview} /> : live && !running ? (
          <div className="flex gap-1 py-2.5">{[0, 1, 2].map((i) => <span key={i} className="typing-dot h-2 w-2 rounded-full bg-[#c4c4c7]" />)}</div>
        ) : null}

        {errKey && (
          <div className="pop mt-1 flex items-center gap-3 rounded-2xl bg-surface p-3.5 shadow-sm">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ff9500]/12 text-[#ff9500]"><KeyRound size={18} /></span>
            <div className="min-w-0 flex-1"><div className="text-[14.5px] font-semibold">Connect {PROVIDERS[errKey]?.label}</div><div className="text-[13px] text-label2">Add your API key to run {bot.name} in real time.</div></div>
            <button onClick={onOpenKeys} className="press rounded-full bg-[#007aff] px-3.5 py-1.5 text-[13.5px] font-semibold text-white">Add key</button>
          </div>
        )}
        {errNet && (
          <div className="pop mt-1 rounded-2xl bg-surface p-3.5 text-[13.5px] shadow-sm">
            <div className="mb-1 flex items-center gap-2 font-semibold text-[#ff3b30]"><AlertTriangle size={15} /> Network / CORS blocked</div>
            <div className="text-label2">{PROVIDERS[errNet]?.label} could not be reached from the browser. Start the local server (<code className="rounded bg-fill px-1">node server/index.mjs</code>) and enable “Route API calls through local server” in Connections.</div>
            <button onClick={onOpenKeys} className="press mt-2 rounded-full bg-fill px-3 py-1 text-[13px] font-semibold">Open Connections</button>
          </div>
        )}
        {m.error && !errKey && !errNet && (
          <div className="pop mt-1 flex items-start gap-2 rounded-2xl bg-[#ff3b30]/[0.07] p-3 text-[13.5px] text-[#c4271d]"><AlertTriangle size={15} className="mt-0.5 shrink-0" /><span className="break-words">{m.error}</span></div>
        )}

        {!live && (text || m.error) && (
          <div className="mt-1.5 flex flex-wrap gap-0.5 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
            {text && <ActionBtn title="Copy" onClick={() => { navigator.clipboard.writeText(text); onToast("Copied"); }}><Copy size={15} /></ActionBtn>}
            {text && <ActionBtn title="Export PDF" onClick={() => { const t = text.match(/^#\s+(.+)$/m)?.[1] ?? `${bot.name} - ${new Date().toLocaleDateString()}`; pdfFromMarkdown(t, text); onToast("PDF downloaded"); }}><FileDown size={15} /></ActionBtn>}
            {text && <ActionBtn title="Share to WhatsApp" onClick={shareWa}><MessageCircle size={15} /></ActionBtn>}
            {text && <ActionBtn title="Read aloud" onClick={speak}><Volume2 size={15} className={speaking ? "text-[#007aff]" : ""} /></ActionBtn>}
            <ActionBtn title="Retry" onClick={onRetry}><RotateCcw size={15} /></ActionBtn>
            {steps.find((s) => s.url) && <ActionBtn title="Open page" onClick={() => window.open(steps.filter((s) => s.url).pop()!.url, "_blank")}><ExternalLink size={15} /></ActionBtn>}
          </div>
        )}
      </div>
    </div>
  );
}

function ActionBtn({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title: string }) {
  return <button title={title} onClick={onClick} className="press flex h-8 w-8 items-center justify-center rounded-full text-label2 hover:bg-fill hover:text-label">{children}</button>;
}

export default memo(MessageItem);
