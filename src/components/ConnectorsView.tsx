import { useMemo, useState } from "react";
import { Check, ChevronRight, ExternalLink, Loader2, Plug, Search, Trash2, X } from "lucide-react";
import { useStore, useRuntime } from "../lib/store";
import { CATEGORIES, CONNECTORS, type ConnCategory, type Connector } from "../lib/connectors";
import { Sheet } from "./ui";
import { cn } from "../utils/cn";

export interface ConnState { key: string; account?: string; status: "connected" | "saved"; at: number }

type ConnMap = Record<string, ConnState>;

function useConnectors() {
  const connectors = (useStore((s) => (s.settings as any).connectors ?? {}) as ConnMap) ?? {};
  const setSettings = useStore((s) => s.setSettings);
  const set = (id: string, v: ConnState | null) =>
    setSettings((s) => {
      const next = { ...((s as any).connectors ?? {}) } as ConnMap;
      if (v) next[id] = v;
      else delete next[id];
      return { ...s, connectors: next } as any;
    });
  return { connectors, set };
}

export default function ConnectorsView() {
  const { connectors, set } = useConnectors();
  const toast = useRuntime((s) => s.showToast);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<ConnCategory | "all">("all");
  const [active, setActive] = useState<Connector | null>(null);
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return CONNECTORS.filter((c) => (cat === "all" || c.category === cat) && (!t || c.name.toLowerCase().includes(t) || c.hint.toLowerCase().includes(t)));
  }, [q, cat]);

  const connectedCount = Object.keys(connectors).length;

  const open = (c: Connector) => {
    setActive(c); setKey(connectors[c.id]?.key ?? ""); setNote(null);
  };

  const connect = async () => {
    if (!active) return;
    const value = key.trim();
    if (!value) { setNote("অনুগ্রহ করে কী বা টোকেন দিন"); return; }
    setBusy(true); setNote(null);
    try {
      let account: string | undefined;
      if (active.verify) {
        account = await active.verify(value);
        set(active.id, { key: value, account, status: "connected", at: Date.now() });
        setNote(`সংযুক্ত · ${account}`);
      } else {
        set(active.id, { key: value, status: "saved", at: Date.now() });
        setNote("সেভ হয়েছে · প্রথম ব্যবহারে যাচাই হবে");
      }
      toast(`${active.name} connected`);
      setTimeout(() => setActive(null), 700);
    } catch (e: any) {
      const m = String(e?.message ?? e);
      if (m === "Failed to fetch" || m.includes("Failed to fetch")) {
        set(active.id, { key: value, status: "saved", at: Date.now() });
        setNote("সেভ হয়েছে · ব্রাউজার ব্লক করেছে, লোকাল সার্ভার দিয়ে যাচাই হবে");
      } else {
        setNote(`যাচাই হয়নি (${m.slice(0, 40)}) · তবু সেভ করেছি`);
        set(active.id, { key: value, status: "saved", at: Date.now() });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto pb-12">
      <div className="sticky top-0 z-10 bg-[var(--surface)]/85 px-4 pt-4 pb-3 backdrop-blur-xl md:px-7">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-[26px] font-bold tracking-tight">Connections</div>
            <div className="text-[13px] text-label2">{connectedCount} of {CONNECTORS.length} connected · one tap, keys stay on this device</div>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-[14px] bg-fill px-3">
          <Search size={16} className="text-label3" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search connectors" className="w-full bg-transparent py-2.5 text-[15px] outline-none placeholder:text-label3" />
        </div>
        <div className="mt-2 flex gap-1.5 overflow-x-auto no-scrollbar">
          {CATEGORIES.map((c) => (
            <button key={c.id} onClick={() => setCat(c.id)} className={cn("press shrink-0 rounded-full px-3 py-1.5 text-[13px] font-medium", cat === c.id ? "bg-[#007aff] text-white" : "bg-fill text-label")}>{c.label}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2.5 px-4 md:grid-cols-2 md:px-7 xl:grid-cols-3">
        {list.map((c, i) => {
          const st = connectors[c.id];
          return (
            <button
              key={c.id}
              onClick={() => open(c)}
              style={{ animationDelay: `${Math.min(i * 25, 250)}ms` }}
              className="fade-up press flex items-center gap-3 rounded-[18px] bg-surface p-3 text-left shadow-[0_1px_2px_rgba(0,0,0,.04)] hover:-translate-y-0.5"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] text-[16px] font-bold text-white" style={{ background: c.color }}>{c.letter}</span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="truncate text-[15.5px] font-semibold">{c.name}</span>
                  {st?.status === "connected" && <Check size={13} className="shrink-0 text-[#34c759]" strokeWidth={3} />}
                </span>
                <span className="block truncate text-[12.5px] text-label2">{st ? (st.account ? st.account : "Saved · verify on first use") : c.hint}</span>
              </span>
              {st ? (
                <span className="rounded-full bg-[#34c759]/12 px-2 py-1 text-[11.5px] font-semibold text-[#1e8e3e]">On</span>
              ) : (
                <span className="rounded-full bg-[#007aff]/10 px-2.5 py-1 text-[11.5px] font-semibold text-[#007aff]">Add</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="px-4 pt-5 md:px-7">
        <div className="rounded-[18px] bg-surface p-4">
          <div className="flex items-center gap-2 text-[14px] font-semibold"><Plug size={15} /> Local server</div>
          <p className="mt-1 text-[12.5px] leading-snug text-label2">
            আপনার নেটওয়ার্কের যেকোনো মেশিনে N Space server চালু থাকলে এখানে URL দিন, কানেক্টরগুলো তখন সরাসরি সেখান দিয়ে যাবে।
          </p>
          <ServerRow />
        </div>
      </div>

      <Sheet open={!!active} onClose={() => setActive(null)} title={active?.name ?? ""}>
        {active && (
          <div className="p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-[14px] text-[18px] font-bold text-white" style={{ background: active.color }}>{active.letter}</span>
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-semibold">{active.name}</div>
                <div className="text-[12.5px] text-label2">{active.hint}</div>
              </div>
            </div>
            <input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Paste token or API key"
              className="mt-4 w-full rounded-[14px] bg-fill px-3 py-3 text-[15px] outline-none placeholder:text-label3"
            />
            <a href={active.docs} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-[13px] font-medium text-[#007aff]">
              কী কোথায় পাব <ExternalLink size={12} />
            </a>
            {note && <div className="mt-3 rounded-[12px] bg-fill px-3 py-2 text-[13px] text-label">{note}</div>}
            <div className="mt-4 flex gap-2">
              <button onClick={connect} disabled={busy} className="press flex flex-1 items-center justify-center gap-2 rounded-[14px] bg-[#007aff] py-3 text-[15px] font-semibold text-white disabled:opacity-60">
                {busy ? <Loader2 size={16} className="animate-spin" /> : <ChevronRight size={16} />} Connect
              </button>
              {connectors[active.id] && (
                <button onClick={() => { set(active.id, null); setActive(null); }} className="press flex items-center justify-center rounded-[14px] bg-[#ff3b30]/10 px-4 text-[#ff3b30]">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}

function ServerRow() {
  const url = useStore((s) => s.settings.server.url);
  const setSettings = useStore((s) => s.setSettings);
  const online = useRuntime((s) => s.serverOnline);
  return (
    <div className="mt-2 flex items-center gap-2">
      <input value={url} onChange={(e) => setSettings((s) => ({ ...s, server: { ...s.server, url: e.target.value } }))} className="min-w-0 flex-1 rounded-[12px] bg-fill px-3 py-2.5 text-[14px] outline-none" />
      <span className={cn("flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-semibold", online ? "bg-[#34c759]/12 text-[#1e8e3e]" : "bg-fill2 text-label2")}>
        <span className={cn("h-1.5 w-1.5 rounded-full", online ? "bg-[#34c759]" : "bg-[#c7c7cc]")} />{online ? "online" : "offline"}
      </span>
    </div>
  );
}
