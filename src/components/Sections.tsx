import { useEffect, useState } from "react";
import { Globe, Play, Plus, Clock, ExternalLink, Server, CheckCircle2, XCircle, Loader2, Copy, MessageCircle, KeyRound, Download, Upload, Bell, ShieldCheck, Gauge, Thermometer, User, Smartphone, RotateCcw, Eye, EyeOff, Terminal } from "lucide-react";
import { useStore, useRuntime, PROVIDERS, type Provider, type Routine } from "../lib/store";
import { checkServer, quickBrowse, runBot } from "../lib/agent";
import { testKey } from "../lib/providers";
import BotAvatar from "./BotAvatar";
import { LargeTitle, Group, Row, Toggle, Sheet, Field, inputCls, Pill, Segmented } from "./ui";
import { LiveScreen } from "./ComputerPanel";
import { cn } from "../utils/cn";

const ago = (t: number) => { const s = (Date.now() - t) / 1000; if (s < 60) return "just now"; if (s < 3600) return `${Math.floor(s / 60)}m ago`; if (s < 86400) return `${Math.floor(s / 3600)}h ago`; return new Date(t).toLocaleDateString(); };
const CMD = "npm run build && npx playwright install chromium && node server/index.mjs";

function ServerCard() {
  const online = useRuntime((s) => s.serverOnline);
  const url = useStore((s) => s.settings.server.url);
  const [checking, setChecking] = useState(false);
  const toast = useRuntime((s) => s.showToast);
  const recheck = async () => { setChecking(true); await checkServer(); setChecking(false); };
  return (
    <div className="mx-4 mb-6 rounded-[20px] bg-surface p-4 shadow-[0_1px_2px_rgba(0,0,0,.04)] md:mx-7">
      <div className="flex items-center gap-3">
        <span className={cn("flex h-11 w-11 items-center justify-center rounded-[12px] text-white", online ? "bg-[#34c759]" : "bg-[#8e8e93]")}><Server size={22} /></span>
        <div className="min-w-0 flex-1">
          <div className="text-[16px] font-semibold">Playwright browser server</div>
          <div className="text-[13px] text-label2">{online ? `Online · ${url} · real Chromium, click & type enabled` : "Offline · using cloud reader + screenshot fallback"}</div>
        </div>
        <button onClick={recheck} className="press rounded-full bg-grouped px-3 py-1.5 text-[13px] font-semibold text-[#007aff]">{checking ? <Loader2 size={14} className="animate-spin" /> : "Check"}</button>
      </div>
      {!online && (
        <div className="mt-3 rounded-xl bg-[#1c1c1e] p-3 font-mono text-[12px] leading-relaxed text-[#e5e5ea]">
          <div className="mb-1 flex items-center justify-between text-label2"><span className="flex items-center gap-1.5"><Terminal size={12} /> Run locally</span><button onClick={() => { navigator.clipboard.writeText(CMD); toast("Command copied"); }} className="flex items-center gap-1 text-[#0a84ff]"><Copy size={11} /> Copy</button></div>
          <span className="break-all">$ {CMD}</span>
        </div>
      )}
    </div>
  );
}

// ---------------- Browser ----------------
export function BrowserView({ onOpenBot }: { onOpenBot: (id: string) => void }) {
  const sessions = useStore((s) => s.sessions);
  const bots = useStore((s) => s.bots);
  const clear = useStore((s) => s.clearSessions);
  const browserBots = bots.filter((b) => b.tools.includes("browse"));
  const [task, setTask] = useState("");
  const [botId, setBotId] = useState(browserBots.find((b) => b.id === "browser")?.id ?? browserBots[0]?.id ?? "");
  const [url, setUrl] = useState("");

  return (
    <div className="h-full overflow-y-auto pb-10">
      <LargeTitle title="Computer & Browser" sub="Watch Bots browse in real time — click the screen to take control (local server)." />
      <div className="mx-4 mb-6 md:mx-7"><LiveScreen interactive /></div>
      <ServerCard />

      <Group header="Run a browser task" className="mx-4 md:mx-7">
        <div className="p-3">
          <textarea value={task} onChange={(e) => setTask(e.target.value)} rows={3} placeholder="e.g. Find the 3 cheapest flights from London to Dubai next Friday and list prices" className="w-full resize-none bg-transparent text-[16px] outline-none placeholder:text-label3" />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <select value={botId} onChange={(e) => setBotId(e.target.value)} className="rounded-full bg-grouped px-3 py-1.5 text-[14px] font-medium text-[#007aff] outline-none">
              {browserBots.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <div className="flex-1" />
            <button disabled={!task.trim() || !botId} onClick={() => { runBot(botId, task.trim()); setTask(""); onOpenBot(botId); }} className="press flex items-center gap-1.5 rounded-full bg-[#007aff] px-4 py-2 text-[14px] font-semibold text-white disabled:opacity-40"><Play size={14} fill="currentColor" /> Run</button>
          </div>
        </div>
      </Group>

      <Group header="Open a page" className="mx-4 md:mx-7">
        <form onSubmit={(e) => { e.preventDefault(); if (url.trim()) quickBrowse(url.trim()); }} className="flex items-center gap-2 px-3 py-2">
          <Globe size={18} className="text-label2" />
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="example.com" inputMode="url" autoCapitalize="off" className={inputCls} />
          <button className="press rounded-full bg-grouped px-3 py-1.5 text-[14px] font-semibold text-[#007aff]">Open</button>
        </form>
      </Group>

      <div className="mx-4 mb-2 flex items-center px-4 md:mx-7">
        <div className="flex-1 text-[13px] uppercase text-label2">History · {sessions.length}</div>
        {sessions.length > 0 && <button onClick={() => confirm("Clear browser history?") && clear()} className="text-[14px] text-[#007aff]">Clear</button>}
      </div>
      <div className="grid gap-3 px-4 sm:grid-cols-2 xl:grid-cols-3 md:px-7">
        {sessions.map((s, i) => {
          const b = bots.find((x) => x.id === s.botId);
          return (
            <button key={s.id} style={{ animationDelay: `${Math.min(i, 10) * 30}ms` }} onClick={() => useRuntime.getState().set({ browser: { botId: s.botId, botName: b?.name ?? "Bot", url: s.url, title: s.title, screenshot: s.screenshot, label: s.title, loading: false }, browserMin: false, rightOpen: true, rightTab: "computer" })}
              className="fade-up press overflow-hidden rounded-[18px] bg-surface text-left shadow-[0_1px_2px_rgba(0,0,0,.04)] hover:shadow-md">
              <div className="aspect-[16/10] bg-fill2">{s.screenshot ? <img src={s.screenshot} loading="lazy" alt="" className="h-full w-full object-cover object-top" /> : <div className="flex h-full items-center justify-center text-label3"><Globe size={28} /></div>}</div>
              <div className="flex items-center gap-2 p-3">
                {b && <BotAvatar shape={b.shape} color={b.color} status="idle" size={24} ring={false} />}
                <div className="min-w-0 flex-1"><div className="truncate text-[14px] font-semibold">{s.title || s.url}</div><div className="truncate text-[12px] text-label2">{s.url.replace(/^https?:\/\//, "")} · {ago(s.time)}</div></div>
                <ExternalLink size={14} className="text-label3" onClick={(e) => { e.stopPropagation(); window.open(s.url, "_blank"); }} />
              </div>
            </button>
          );
        })}
        {sessions.length === 0 && <div className="col-span-full rounded-[18px] bg-surface py-12 text-center text-[15px] text-label2">No pages yet — ask a Bot to browse something.</div>}
      </div>
    </div>
  );
}

// ---------------- Routines ----------------
const INTERVALS = [[15, "Every 15 minutes"], [60, "Every hour"], [360, "Every 6 hours"], [1440, "Daily"], [10080, "Weekly"]] as const;
export function RoutinesView() {
  const routines = useStore((s) => s.routines);
  const bots = useStore((s) => s.bots);
  const { addRoutine, updateRoutine, removeRoutine } = useStore.getState();
  const [edit, setEdit] = useState<Partial<Routine> | null>(null);
  const save = () => {
    if (!edit?.name?.trim() || !edit.prompt?.trim() || !edit.botId) return;
    if (edit.id) updateRoutine(edit.id, edit); else addRoutine({ name: edit.name, prompt: edit.prompt, botId: edit.botId, everyMinutes: edit.everyMinutes ?? 1440, enabled: true });
    setEdit(null);
  };
  return (
    <div className="h-full overflow-y-auto pb-10">
      <LargeTitle title="Routines" sub="Bots wake up on a schedule and work without a prompt." right={<button onClick={() => setEdit({ botId: bots[0]?.id, everyMinutes: 1440, name: "", prompt: "" })} className="press mb-1.5 flex h-9 w-9 items-center justify-center rounded-full text-[#007aff] hover:bg-fill"><Plus size={24} /></button>} />
      <div className="px-4 md:px-7">
        <Group footer="Routines run while the app is open (desktop, PWA or the local server tab). You'll get a notification when they finish if enabled in Settings.">
          {routines.map((r) => {
            const b = bots.find((x) => x.id === r.botId);
            const next = r.lastRun ? r.lastRun + r.everyMinutes * 60000 : null;
            return (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                {b && <BotAvatar shape={b.shape} color={b.color} status={b.status} size={36} ring={false} />}
                <button onClick={() => setEdit(r)} className="min-w-0 flex-1 text-left">
                  <div className="truncate text-[16px] font-medium">{r.name}</div>
                  <div className="flex items-center gap-1 truncate text-[13px] text-label2"><Clock size={12} /> {INTERVALS.find((x) => x[0] === r.everyMinutes)?.[1] ?? `Every ${r.everyMinutes}m`} · {b?.name}{r.enabled && next ? ` · next ${new Date(next).toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" })}` : ""}</div>
                </button>
                <button onClick={() => { if (b) { runBot(b.id, r.prompt, { routine: r.name }); updateRoutine(r.id, { lastRun: Date.now() }); useRuntime.getState().showToast(`${r.name} started`); } }} className="press flex h-8 w-8 items-center justify-center rounded-full bg-[#007aff]/10 text-[#007aff]"><Play size={13} fill="currentColor" /></button>
                <Toggle on={r.enabled} onChange={(v) => updateRoutine(r.id, { enabled: v, lastRun: v ? Date.now() : r.lastRun })} />
              </div>
            );
          })}
          {routines.length === 0 && <div className="px-4 py-8 text-center text-[15px] text-label2">No routines yet</div>}
        </Group>
      </div>
      <Sheet open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? "Edit routine" : "New routine"} right={<button onClick={save} className="text-[17px] font-semibold text-[#007aff]">Save</button>}>
        <div className="px-4 pb-8">
          <Group>
            <Field label="Name"><input value={edit?.name ?? ""} onChange={(e) => setEdit({ ...edit, name: e.target.value })} placeholder="Morning briefing" className={inputCls} /></Field>
            <Field label="Bot"><select value={edit?.botId} onChange={(e) => setEdit({ ...edit, botId: e.target.value })} className="w-full bg-transparent text-[16px] text-[#007aff] outline-none">{bots.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></Field>
            <Field label="Repeat"><select value={edit?.everyMinutes} onChange={(e) => setEdit({ ...edit, everyMinutes: Number(e.target.value) })} className="w-full bg-transparent text-[16px] text-[#007aff] outline-none">{INTERVALS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
          </Group>
          <Group header="Instructions"><textarea value={edit?.prompt ?? ""} onChange={(e) => setEdit({ ...edit, prompt: e.target.value })} rows={5} placeholder="What should the Bot do each time?" className="block w-full resize-none bg-transparent px-4 py-3 text-[16px] outline-none" /></Group>
          {edit?.id && <Group><Row title="Delete routine" danger onClick={() => { removeRoutine(edit.id!); setEdit(null); }} /></Group>}
        </div>
      </Sheet>
    </div>
  );
}

// ---------------- Connections ----------------
function KeyRow({ p }: { p: Provider }) {
  const key = useStore((s) => s.settings.keys[p]);
  const setSettings = useStore((s) => s.setSettings);
  const useProxy = useStore((s) => s.settings.server.useProxy);
  const online = useRuntime((s) => s.serverOnline);
  const [show, setShow] = useState(false);
  const [state, setState] = useState<"idle" | "testing" | "ok" | "fail">("idle");
  const [msg, setMsg] = useState("");
  const test = async () => {
    setState("testing"); setMsg("");
    try { await testKey(p, key, useProxy && online ? useStore.getState().settings.server.url : null); setState("ok"); setMsg("Connected"); }
    catch (e: any) { setState("fail"); const m = String(e?.message ?? e); setMsg(m === "Failed to fetch" ? "Blocked by browser (CORS) — enable local server proxy" : m.slice(0, 140)); }
  };
  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="flex h-[29px] w-[29px] items-center justify-center rounded-[7px] text-[13px] font-bold text-white" style={{ background: PROVIDERS[p].color }}>{PROVIDERS[p].label[0]}</span>
        <div className="flex-1 text-[16px] font-medium">{PROVIDERS[p].label}</div>
        {key ? <span className="text-[13px] font-medium text-[#34c759]">Saved</span> : <a href={PROVIDERS[p].keyUrl} target="_blank" rel="noreferrer" className="text-[13px] text-[#007aff]">Get key ↗</a>}
      </div>
      <div className="mt-2 flex items-center gap-2 rounded-[10px] bg-grouped px-3">
        <KeyRound size={14} className="shrink-0 text-label2" />
        <input type={show ? "text" : "password"} value={key} autoComplete="off" spellCheck={false} placeholder={PROVIDERS[p].keyHint}
          onChange={(e) => { setState("idle"); const v = e.target.value.trim(); setSettings((s) => ({ ...s, keys: { ...s.keys, [p]: v } })); }}
          className="h-10 w-full bg-transparent font-mono text-[14px] outline-none placeholder:text-label3" />
        <button onClick={() => setShow(!show)} className="text-label2">{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>
        <button disabled={!key || state === "testing"} onClick={test} className="press shrink-0 rounded-full bg-surface px-3 py-1 text-[13px] font-semibold text-[#007aff] shadow-sm disabled:opacity-40">{state === "testing" ? <Loader2 size={13} className="animate-spin" /> : "Test"}</button>
      </div>
      {msg && <div className={cn("mt-1.5 flex items-center gap-1 text-[12.5px]", state === "ok" ? "text-[#34c759]" : "text-[#ff3b30]")}>{state === "ok" ? <CheckCircle2 size={13} /> : <XCircle size={13} />}{msg}</div>}
    </div>
  );
}

export function ConnectionsView() {
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  const toast = useRuntime((s) => s.showToast);
  const [waOpen, setWaOpen] = useState(false);
  const wa = settings.whatsapp;
  const setWa = (p: Partial<typeof wa>) => setSettings((s) => ({ ...s, whatsapp: { ...s.whatsapp, ...p } }));

  return (
    <div className="h-full overflow-y-auto pb-10">
      <LargeTitle title="Connections" sub="Keys are stored only on this device and sent directly to each provider." />
      <div className="px-4 md:px-7">
        <div className="mb-7 flex items-center gap-4 rounded-[20px] bg-surface p-4 shadow-[0_1px_2px_rgba(0,0,0,.04)]">
          <span className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#25d366] text-white"><MessageCircle size={26} fill="white" /></span>
          <div className="min-w-0 flex-1">
            <div className="text-[16px] font-semibold">WhatsApp</div>
            <div className="truncate text-[13px] text-label2">{wa.connected ? `Connected · +${wa.phone}${wa.token ? " · Cloud API" : " · one-tap links"}` : "Get Bot results on WhatsApp in one tap"}</div>
          </div>
          {wa.connected ? <Pill color="#34c759" onClick={() => setWaOpen(true)}>Manage</Pill> : <button onClick={() => setWaOpen(true)} className="press rounded-full bg-[#25d366] px-4 py-2 text-[14px] font-semibold text-white">Connect</button>}
        </div>

        <Group header="AI providers · real-time API keys">
          {(Object.keys(PROVIDERS) as Provider[]).map((p) => <KeyRow key={p} p={p} />)}
        </Group>
      </div>

      <ServerCard />
      <div className="px-4 md:px-7">
        <Group footer="If a provider blocks direct browser requests (CORS), route calls through your local server.">
          <Field label="Server URL"><input value={settings.server.url} onChange={(e) => setSettings((s) => ({ ...s, server: { ...s.server, url: e.target.value } }))} className={inputCls} /></Field>
          <Row title="Route API calls through local server" right={<Toggle on={settings.server.useProxy} onChange={(v) => setSettings((s) => ({ ...s, server: { ...s.server, useProxy: v } }))} />} />
        </Group>
      </div>

      <Sheet open={waOpen} onClose={() => setWaOpen(false)} title="WhatsApp">
        <div className="px-4 pb-8">
          <div className="mb-5 flex flex-col items-center pt-2 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-[18px] bg-[#25d366] text-white"><MessageCircle size={34} fill="white" /></span>
            <div className="mt-3 text-[20px] font-bold">Connect WhatsApp</div>
            <div className="mt-1 max-w-xs text-[14px] text-label2">Bots send summaries, PDFs links and alerts straight to your chat.</div>
          </div>
          <Group header="Your number" footer="Include country code, e.g. 447700900123">
            <Field label="Phone"><input value={wa.phone} onChange={(e) => setWa({ phone: e.target.value.replace(/[^\d]/g, "") })} inputMode="tel" placeholder="Country code + number" className={inputCls} /></Field>
          </Group>
          <button disabled={wa.phone.length < 8} onClick={() => { setWa({ connected: true }); window.open(`https://wa.me/${wa.phone}?text=${encodeURIComponent("✅ Grok Bot is connected to this WhatsApp.")}`, "_blank"); toast("WhatsApp connected"); }}
            className="press mb-7 w-full rounded-[14px] bg-[#25d366] py-3.5 text-[17px] font-semibold text-white disabled:opacity-40">One-tap connect & send test</button>
          <Group header="Optional · WhatsApp Cloud API" footer="For fully automatic sending (no tap), add a Meta WhatsApp Cloud API token and Phone Number ID from developers.facebook.com.">
            <Field label="Token"><input type="password" value={wa.token} onChange={(e) => setWa({ token: e.target.value.trim() })} placeholder="EAAG…" className={inputCls} /></Field>
            <Field label="Phone ID"><input value={wa.phoneNumberId} onChange={(e) => setWa({ phoneNumberId: e.target.value.trim() })} placeholder="1234567890" className={inputCls} /></Field>
          </Group>
          {wa.connected && <Group><Row title="Disconnect WhatsApp" danger onClick={() => { setWa({ connected: false, token: "", phoneNumberId: "" }); setWaOpen(false); }} /></Group>}
        </div>
      </Sheet>
    </div>
  );
}

// ---------------- Settings ----------------
export function SettingsView() {
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  const toast = useRuntime((s) => s.showToast);
  const [installEvt, setInstallEvt] = useState<any>((window as any).__installPrompt ?? null);
  const standalone = window.matchMedia?.("(display-mode: standalone)").matches || (navigator as any).standalone;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  useEffect(() => {
    const h = (e: any) => { e.preventDefault(); (window as any).__installPrompt = e; setInstallEvt(e); };
    window.addEventListener("beforeinstallprompt", h); return () => window.removeEventListener("beforeinstallprompt", h);
  }, []);

  const exportData = () => {
    const s = useStore.getState();
    const data = JSON.stringify({ bots: s.bots, threads: s.threads, docs: s.docs, routines: s.routines, settings: { ...s.settings, keys: { xai: "", openai: "", deepseek: "", mistral: "", gemini: "" } } }, null, 2);
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([data], { type: "application/json" })); a.download = `grokbot-backup-${Date.now()}.json`; a.click();
  };
  const importData = () => {
    const i = document.createElement("input"); i.type = "file"; i.accept = "application/json";
    i.onchange = async () => { try { const d = JSON.parse(await i.files![0].text()); const keys = useStore.getState().settings.keys; useStore.getState().importAll({ ...d, settings: { ...useStore.getState().settings, ...d.settings, keys } }); toast("Backup restored"); } catch { toast("Invalid backup file"); } };
    i.click();
  };
  const set = (p: Partial<typeof settings>) => setSettings((s) => ({ ...s, ...p }));

  return (
    <div className="h-full overflow-y-auto pb-10">
      <LargeTitle title="Settings" />
      <div className="px-4 md:px-7">
        <Group>
          <Field label="Your name"><input value={settings.userName} onChange={(e) => set({ userName: e.target.value })} className={inputCls} /></Field>
        </Group>

        <Group header="Appearance & language" footer="Bots always reply in the selected language — the Brain remembers this permanently. Long questions get long, detailed answers.">
          <div className="px-4 py-3"><div className="mb-2 text-[15px]">Theme · ⌘J</div><Segmented value={settings.theme} onChange={(v) => set({ theme: v })} options={[{ value: "light", label: "☀️ Light" }, { value: "dark", label: "🌙 Dark" }]} /></div>
          <div className="px-4 py-3"><div className="mb-2 text-[15px]">Reply language</div><Segmented value={settings.language} onChange={(v) => set({ language: v })} options={[{ value: "bn", label: "বাংলা" }, { value: "en", label: "English" }, { value: "auto", label: "Auto" }]} /></div>
          <Row title="Smart answer length" subtitle="Short questions → short; long questions → long" right={<Toggle on={settings.adaptive} onChange={(v) => set({ adaptive: v })} />} />
        </Group>

        <Group header="App" footer={standalone ? "Running as an installed app." : isIOS ? "On iPhone/iPad: tap Share → Add to Home Screen to install as a full-screen app." : "Install for a native app experience on Windows, macOS, Android, iPad and iPhone."}>
          <Row icon={<Smartphone size={17} />} iconBg="#007aff" title={standalone ? "Installed" : "Install app"} subtitle="PWA · works offline" chevron={!standalone}
            onClick={standalone ? undefined : async () => { if (installEvt) { installEvt.prompt(); await installEvt.userChoice; setInstallEvt(null); } else toast(isIOS ? "Tap Share → Add to Home Screen" : "Use your browser menu → Install app"); }} />
        </Group>

        <Group header="Behaviour">
          <Row icon={<ShieldCheck size={17} />} iconBg="#34c759" title="Ask before actions" subtitle="Clicks, typing & WhatsApp sends" right={<Toggle on={settings.approvals} onChange={(v) => set({ approvals: v })} />} />
          <Row icon={<Bell size={17} />} iconBg="#ff3b30" title="Notifications" subtitle="When a Bot finishes in background" right={<Toggle on={settings.notifications} onChange={async (v) => {
            if (v && typeof Notification !== "undefined") { const p = await Notification.requestPermission(); if (p !== "granted") { toast("Notifications blocked by browser"); return; } }
            set({ notifications: v });
          }} />} />
          <Row icon={<Gauge size={17} />} iconBg="#ff9500" title="Max agent steps" subtitle="Tool calls per turn"
            right={<div className="flex items-center gap-0 overflow-hidden rounded-lg bg-grouped">
              <button onClick={() => set({ maxSteps: Math.max(1, settings.maxSteps - 1) })} className="px-3 py-1 text-[18px] text-[#007aff]">−</button>
              <span className="w-6 text-center text-[15px] font-semibold">{settings.maxSteps}</span>
              <button onClick={() => set({ maxSteps: Math.min(15, settings.maxSteps + 1) })} className="px-3 py-1 text-[18px] text-[#007aff]">+</button>
            </div>} />
          <div className="flex items-center gap-3 px-4 py-3">
            <span className="flex h-[29px] w-[29px] items-center justify-center rounded-[7px] bg-[#5856d6] text-white"><Thermometer size={17} /></span>
            <div className="flex-1"><div className="text-[16px]">Creativity</div><input type="range" min={0} max={1.2} step={0.1} value={settings.temperature} onChange={(e) => set({ temperature: Number(e.target.value) })} className="mt-1 w-full accent-[#007aff]" /></div>
            <span className="w-8 text-right text-[15px] text-label2">{settings.temperature.toFixed(1)}</span>
          </div>
        </Group>

        <Group header="Data" footer="Backups never include API keys.">
          <Row icon={<Download size={17} />} iconBg="#007aff" title="Export backup" onClick={exportData} chevron />
          <Row icon={<Upload size={17} />} iconBg="#34c759" title="Import backup" onClick={importData} chevron />
          <Row icon={<RotateCcw size={17} />} iconBg="#ff3b30" title="Reset everything" danger onClick={() => { if (confirm("Delete all bots, chats, memories and keys?")) { useStore.getState().resetAll(); toast("Reset complete"); } }} />
        </Group>

        <div className="flex flex-col items-center gap-1 pb-6 text-[12px] text-label3">
          <User size={14} /> N Space · Grok Bot · v3.0
        </div>
      </div>
    </div>
  );
}
