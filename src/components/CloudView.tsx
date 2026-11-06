import { useState } from "react";
import { ArrowRight, Check, ChevronRight, Loader2, Plug, RefreshCw, Server, Sparkles } from "lucide-react";
import { useStore, useRuntime, PROVIDERS, type Provider } from "../lib/store";
import { testKey } from "../lib/providers";
import { listModels, pickBest } from "../lib/models";
import { CONNECTORS } from "../lib/connectors";
import ConnLogo from "./ConnLogo";
import { Sheet } from "./ui";
import { cn } from "../utils/cn";

const AI_META: Record<Provider, { slug?: string; domain?: string; note: string }> = {
  xai: { slug: "x", note: "grok-4 family · reasoning + tools" },
  openai: { slug: "openai", note: "gpt-4o / gpt-5 · vision + tools" },
  gemini: { slug: "googlegemini", note: "2.5 Flash / Pro · long context" },
  deepseek: { domain: "deepseek.com", note: "deepseek-chat / reasoner" },
  mistral: { domain: "mistral.ai", note: "large / codestral · EU hosted" },
};

/**
 * Cloud & keys — opened by tapping the "Cloud mode · n/5 keys" pill.
 * Real brand logos, live key testing, animated cards.
 */
export default function CloudView({ onConnections, onSettings }: { onConnections: () => void; onSettings: () => void }) {
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  const online = useRuntime((s) => s.serverOnline);
  const toast = useRuntime((s) => s.showToast);
  const [editing, setEditing] = useState<Provider | null>(null);
  const [draft, setDraft] = useState("");
  const [testing, setTesting] = useState<Provider | null>(null);
  const [result, setResult] = useState<Record<string, "ok" | "fail">>({});
  const [err, setErr] = useState<string | null>(null);
  const [live, setLive] = useState<Record<string, string[]>>({});
  const [model, setModel] = useState<Record<string, string>>({});
  const [loadingModels, setLoadingModels] = useState<Provider | null>(null);

  const saved = Object.values(settings.keys).filter(Boolean).length;
  const connectedConns = Object.keys((settings as any).connectors ?? {}).length;

  const refreshModels = async (p: Provider) => {
    const key = ((editing ? settings.keys[p] : settings.keys[p]) ?? "").trim();
    if (!key) { setErr("আগে কী দিন, তারপর মডেল লিস্ট আনব"); return; }
    setLoadingModels(p); setErr(null);
    try {
      const list = await listModels(p, key, null);
      if (!list.length) throw new Error("কোনো মডেল পাওয়া যায়নি");
      setLive((l) => ({ ...l, [p]: list }));
      const best = pickBest(list, p, model[p]);
      setModel((m) => ({ ...m, [p]: best }));
      toast(`${list.length} live models · ${best}`);
    } catch (e: any) {
      setErr(String(e?.message ?? e).slice(0, 110));
    } finally { setLoadingModels(null); }
  };

  const save = async () => {
    if (!editing) return;
    const p = editing;
    const key = draft.trim();
    setSettings((s) => ({ ...s, keys: { ...s.keys, [p]: key } }));
    if (!key) { setEditing(null); return; }
    setTesting(p); setErr(null);
    try {
      await testKey(p, key, null);
      setResult((r) => ({ ...r, [p]: "ok" }));
      const chosen = model[p];
      if (chosen) {
        const st = useStore.getState();
        st.bots.filter((b) => b.provider === p).forEach((b) => st.updateBot(b.id, { model: chosen }));
      }
      toast(`${PROVIDERS[p].label} connected`);
      setTimeout(() => setEditing(null), 600);
    } catch (e: any) {
      const m = String(e?.message ?? e);
      setResult((r) => ({ ...r, [p]: "fail" }));
      setErr(m.includes("Failed to fetch") ? "ব্রাউজার ব্লক করেছে · কী সেভ হয়েছে, লোকাল সার্ভার দিয়ে যাচাই হবে" : m.slice(0, 110));
    } finally {
      setTesting(null);
    }
  };

  return (
    <div className="h-full overflow-y-auto pb-14">
      <div className="px-4 pt-2 md:px-7">
        <div className="pop overflow-hidden rounded-[24px] bg-gradient-to-br from-[#0a84ff] via-[#5e5ce6] to-[#bf5af2] p-5 text-white shadow-[0_18px_44px_rgba(10,132,255,.32)]">
          <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.18em] opacity-90">
            <Sparkles size={13} /> {online ? "Local server" : "Cloud mode"}
          </div>
          <div className="mt-2 text-[27px] font-bold leading-tight tracking-tight">Cloud & keys</div>
          <div className="mt-1 text-[13.5px] leading-snug text-white/85">
            {saved}/{Object.keys(PROVIDERS).length} AI keys · {connectedConns}/{CONNECTORS.length} connectors live
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={onConnections} className="press rounded-full bg-white/18 px-3.5 py-2 text-[13px] font-semibold backdrop-blur">
              All connections <ArrowRight size={13} className="ml-1 inline" />
            </button>
            <button onClick={onSettings} className="press rounded-full bg-white/18 px-3.5 py-2 text-[13px] font-semibold backdrop-blur">Settings</button>
          </div>
        </div>
      </div>

      <div className="mt-5 px-4 md:px-7">
        <div className="mb-2 px-1 text-[11.5px] font-semibold uppercase tracking-wide text-label2">AI providers</div>
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-3">
          {Object.keys(PROVIDERS).map((p, i) => {
            const key = (settings.keys as any)[p] as string;
            const meta = AI_META[p as Provider];
            const state = result[p];
            return (
              <button
                key={p}
                onClick={() => { setEditing(p as Provider); setDraft(key ?? ""); setErr(null); }}
                style={{ animationDelay: `${i * 45}ms` }}
                className="fade-up press group relative flex items-center gap-3 overflow-hidden rounded-[20px] bg-surface p-3.5 text-left shadow-[0_1px_3px_rgba(0,0,0,.05)] hover:-translate-y-0.5"
              >
                <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{ background: `radial-gradient(120px 60px at 12% 30%, ${PROVIDERS[p as Provider].color}22, transparent)` }} />
                <ConnLogo slug={meta.slug} domain={meta.domain} letter={PROVIDERS[p as Provider].label[0]} color={PROVIDERS[p as Provider].color} size={46} connected={!!key} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-[15.5px] font-semibold">{PROVIDERS[p as Provider].label}</span>
                    {key && <Check size={13} className="shrink-0 text-[#34c759]" strokeWidth={3} />}
                  </span>
                  <span className="block truncate text-[12px] text-label2">{key ? mask(key) : meta.note}</span>
                  {state === "fail" && <span className="block text-[11.5px] text-[#ff9500]">key saved · verify later</span>}
                </span>
                <ChevronRight size={15} className="shrink-0 text-label3 transition-transform group-hover:translate-x-0.5" />
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 px-4 md:px-7">
        <div className="pop rounded-[20px] bg-surface p-4">
          <div className="flex items-center gap-2 text-[14.5px] font-semibold"><Server size={15} /> Local server</div>
          <p className="mt-1 text-[12.5px] leading-snug text-label2">নিজের মেশিনে সার্ভার চালু থাকলে কানেক্টরগুলো সেখান দিয়েই যাবে, ব্রাউজারের ব্লক থাকবে না।</p>
          <div className="mt-2 flex items-center gap-2">
            <input
              value={settings.server.url}
              onChange={(e) => setSettings((s) => ({ ...s, server: { ...s.server, url: e.target.value } }))}
              className="min-w-0 flex-1 rounded-[12px] bg-fill px-3 py-2.5 text-[14px] outline-none"
            />
            <span className={cn("flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-semibold", online ? "bg-[#34c759]/12 text-[#1e8e3e]" : "bg-fill2 text-label2")}>
              <span className={cn("h-1.5 w-1.5 rounded-full", online ? "bg-[#34c759]" : "bg-[#c7c7cc]")} />{online ? "online" : "offline"}
            </span>
          </div>
        </div>
      </div>

      <Sheet open={!!editing} onClose={() => setEditing(null)} title={editing ? PROVIDERS[editing].label : ""}>
        {editing && (
          <div className="p-4">
            <div className="flex items-center gap-3">
              <ConnLogo slug={AI_META[editing].slug} domain={AI_META[editing].domain} letter={PROVIDERS[editing].label[0]} color={PROVIDERS[editing].color} size={50} />
              <div className="min-w-0 flex-1">
                <div className="text-[15.5px] font-semibold">{PROVIDERS[editing].label}</div>
                <div className="text-[12.5px] text-label2">{AI_META[editing].note}</div>
              </div>
            </div>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={PROVIDERS[editing].keyHint}
              className="mt-4 w-full rounded-[14px] bg-fill px-3 py-3 text-[15px] outline-none placeholder:text-label3"
            />
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="text-[11.5px] font-semibold uppercase tracking-wide text-label2">Model</span>
              <button onClick={() => refreshModels(editing)} disabled={loadingModels === editing}
                className="press flex items-center gap-1 rounded-full bg-fill px-2.5 py-1 text-[11.5px] font-semibold text-label">
                {loadingModels === editing ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} Live models
              </button>
            </div>
            <select
              value={model[editing] ?? PROVIDERS[editing].models[0]}
              onChange={(e) => {
                const m = e.target.value;
                setModel((x) => ({ ...x, [editing]: m }));
                const st = useStore.getState();
                st.bots.filter((b) => b.provider === editing).forEach((b) => st.updateBot(b.id, { model: m }));
              }}
              className="mt-1.5 w-full rounded-[14px] bg-fill px-3 py-3 text-[14.5px] outline-none"
            >
              {(live[editing]?.length ? live[editing] : PROVIDERS[editing].models).map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <p className="mt-1.5 text-[11.5px] leading-snug text-label3">মডেল বদলালে সব বট সাথে সাথে নতুন মডেলে চলবে। পুরনো মডেল বন্ধ হলে অ্যাপ নিজেই পরেরটায় চলে যাবে।</p>
            <a href={PROVIDERS[editing].keyUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-[13px] font-medium text-[#007aff]">কী কোথায় পাব ↗</a>
            {err && <div className="mt-3 rounded-[12px] bg-fill px-3 py-2 text-[12.5px] text-label">{err}</div>}
            <div className="mt-4 flex gap-2">
              <button onClick={save} disabled={!!testing} className="press flex flex-1 items-center justify-center gap-2 rounded-[14px] bg-[#007aff] py-3 text-[15px] font-semibold text-white disabled:opacity-60">
                {testing ? <Loader2 size={16} className="animate-spin" /> : <Plug size={15} />} Connect
              </button>
              {settings.keys[editing] && (
                <button onClick={() => { setSettings((s) => ({ ...s, keys: { ...s.keys, [editing]: "" } })); setDraft(""); setEditing(null); }}
                  className="press rounded-[14px] bg-[#ff3b30]/10 px-4 text-[13px] font-semibold text-[#ff3b30]">Remove</button>
              )}
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}

function mask(k: string) {
  if (k.length <= 10) return "••••••";
  return `${k.slice(0, 5)}••••${k.slice(-4)}`;
}
