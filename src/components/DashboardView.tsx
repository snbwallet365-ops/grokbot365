import { useMemo, useRef, useState } from "react";
import { ArrowRight, Briefcase, FileText, Globe2, Loader2, Plus, Search, Trash2, Upload } from "lucide-react";
import { useStore, type CaseFile } from "../lib/store";
import { COUNTRIES, findCountry } from "../lib/countries";
import ConnLogo from "./ConnLogo";
import { cn } from "../utils/cn";

const KINDS: { id: CaseFile["kind"]; label: string; bn: string; agent: string; color: string }[] = [
  { id: "visa", label: "Visa filing", bn: "ভিসা ফাইলিং", agent: "browser", color: "#007aff" },
  { id: "recruit", label: "Recruitment", bn: "রিক্রুটমেন্ট", agent: "visa", color: "#ff9500" },
  { id: "docs", label: "Documentation", bn: "ডকুমেন্টেশন", agent: "docs", color: "#5856d6" },
];

const STATUS: Record<CaseFile["status"], { label: string; cls: string }> = {
  new: { label: "নতুন", cls: "bg-[#0a84ff]/12 text-[#0a84ff]" },
  working: { label: "চলছে", cls: "bg-[#ff9500]/15 text-[#b26a00]" },
  filed: { label: "ফাইল হয়েছে", cls: "bg-[#5e5ce6]/15 text-[#4b48c9]" },
  approved: { label: "অনুমোদিত", cls: "bg-[#34c759]/15 text-[#1f8b3d]" },
  onhold: { label: "স্থগিত", cls: "bg-black/8 text-label2" },
};

export default function DashboardView({ onOpenBot }: { onOpenBot: (id: string) => void }) {
  const cases = useStore((s) => s.cases);
  const addCase = useStore((s) => s.addCase);
  const updateCase = useStore((s) => s.updateCase);
  const removeCase = useStore((s) => s.removeCase);
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | CaseFile["kind"]>("all");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const country = findCountry(settings.country) ?? COUNTRIES[2];

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return cases
      .filter((c) => (filter === "all" ? true : c.kind === filter))
      .filter((c) => !term || `${c.title} ${c.applicant} ${c.country} ${c.fileName ?? ""}`.toLowerCase().includes(term))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [cases, filter, q]);

  const counts = useMemo(
    () => ({
      total: cases.length,
      visa: cases.filter((c) => c.kind === "visa").length,
      recruit: cases.filter((c) => c.kind === "recruit").length,
      docs: cases.filter((c) => c.kind === "docs").length,
      approved: cases.filter((c) => c.status === "approved").length,
    }),
    [cases],
  );

  function startFromFile(file: File) {
    const base = file.name.replace(/\.[a-z0-9]+$/i, "").replace(/[_-]+/g, " ").slice(0, 60) || "New case";
    addCase({ title: base, kind: "visa", country: country.code, applicant: base, status: "new", fileName: file.name });
    setUploading(false);
    onOpenBot("browser");
  }

  return (
    <div className="h-full overflow-y-auto pb-16">
      <div className="px-4 pt-2 md:px-7">
        {/* hero */}
        <div className="pop relative overflow-hidden rounded-[26px] bg-gradient-to-br from-[#0a84ff] via-[#3d7bff] to-[#5e5ce6] p-5 text-white shadow-[0_18px_46px_rgba(10,132,255,.30)]">
          <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-white/85">
            <Globe2 size={13} /> {country.flag} {country.name} · {country.portal}
          </div>
          <div className="mt-1.5 text-[27px] font-bold leading-tight tracking-tight">ড্যাশবোর্ড</div>
          <div className="mt-1 text-[13.5px] text-white/85">{counts.total} কেস · {counts.approved} অনুমোদিত · {COUNTRIES.length} দেশ</div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {KINDS.map((k) => (
              <button key={k.id} onClick={() => onOpenBot(k.agent)} className="press rounded-[16px] bg-white/15 px-2.5 py-2.5 text-left backdrop-blur-sm">
                <div className="text-[19px] font-bold leading-none">{k.id === "visa" ? counts.visa : k.id === "recruit" ? counts.recruit : counts.docs}</div>
                <div className="mt-1 text-[11px] text-white/85">{k.bn}</div>
              </button>
            ))}
          </div>
        </div>

        {/* start from a file */}
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
          <button
            onClick={() => fileRef.current?.click()}
            className="press flex items-center gap-3 rounded-[20px] bg-surface p-4 text-left shadow-[0_1px_2px_rgba(0,0,0,.05)]"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#007aff]/12 text-[#007aff]">
              {uploading ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold">ফাইল দিয়ে শুরু করুন</span>
              <span className="block truncate text-[12.5px] text-label2">পাসপোর্ট, CV বা ডকুমেন্ট আপলোড করুন</span>
            </span>
            <ArrowRight size={17} className="text-label3" />
          </button>

          <button onClick={() => onOpenBot("grok")} className="press flex items-center gap-3 rounded-[20px] bg-surface p-4 text-left shadow-[0_1px_2px_rgba(0,0,0,.05)]">
            <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#34c759]/12 text-[#1f8b3d]"><Plus size={20} /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold">নতুন কেস</span>
              <span className="block truncate text-[12.5px] text-label2">এজেন্টকে বলুন কী করতে হবে</span>
            </span>
            <ArrowRight size={17} className="text-label3" />
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          hidden
          accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) { setUploading(true); setTimeout(() => startFromFile(f), 350); } }}
        />

        {/* country strip */}
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between px-1">
            <span className="text-[12.5px] font-semibold uppercase tracking-wide text-label2">দেশ</span>
            <span className="text-[12px] text-label3">{country.days} দিন · {country.types.join(" · ")}</span>
          </div>
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
            {COUNTRIES.map((c) => (
              <button
                key={c.code}
                onClick={() => setSettings((s) => ({ ...s, country: c.code }))}
                className={cn("press flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium",
                  settings.country === c.code ? "bg-[#007aff] text-white shadow-[0_6px_16px_rgba(0,122,255,.3)]" : "bg-surface text-label")}
              >
                <span>{c.flag}</span>{c.name}
              </button>
            ))}
          </div>
        </div>

        {/* cases */}
        <div className="mt-5 flex items-center gap-2">
          <div className="flex flex-1 items-center gap-1.5 rounded-full bg-surface px-3 py-2">
            <Search size={15} className="text-label3" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="কেস, প্রার্থী বা ফাইল খুঁজুন" className="w-full bg-transparent text-[14px] outline-none placeholder:text-label3" />
          </div>
          <div className="flex gap-1 rounded-full bg-surface p-1">
            {(["all", "visa", "recruit", "docs"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={cn("press rounded-full px-2.5 py-1 text-[12px] font-semibold", filter === f ? "bg-[#007aff] text-white" : "text-label2")}>
                {f === "all" ? "সব" : f === "visa" ? "ভিসা" : f === "recruit" ? "রিক্রুট" : "ডকস"}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 space-y-2">
          {list.length === 0 && (
            <div className="rounded-[20px] bg-surface p-6 text-center">
              <FileText size={26} className="mx-auto text-label3" />
              <div className="mt-2 text-[15px] font-semibold">এখনো কোনো কেস নেই</div>
              <div className="mt-1 text-[13px] text-label2">উপরের “ফাইল দিয়ে শুরু করুন” চাপুন বা এজেন্টকে লিখুন।</div>
            </div>
          )}
          {list.map((c) => {
            const meta = KINDS.find((k) => k.id === c.kind)!;
            const cc = findCountry(c.country);
            return (
              <div key={c.id} className="fade-up flex items-center gap-3 rounded-[20px] bg-surface p-3.5 shadow-[0_1px_2px_rgba(0,0,0,.05)]">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] text-white" style={{ background: meta.color }}>
                  {c.kind === "visa" ? <Globe2 size={18} /> : c.kind === "recruit" ? <Briefcase size={18} /> : <FileText size={18} />}
                </span>
                <button onClick={() => onOpenBot(meta.agent)} className="min-w-0 flex-1 text-left">
                  <div className="truncate text-[15px] font-semibold">{c.title}</div>
                  <div className="truncate text-[12.5px] text-label2">{cc?.flag} {cc?.name ?? c.country} · {meta.bn}{c.fileName ? ` · ${c.fileName}` : ""}</div>
                </button>
                <select
                  value={c.status}
                  onChange={(e) => updateCase(c.id, { status: e.target.value as CaseFile["status"] })}
                  className={cn("shrink-0 rounded-full px-2 py-1 text-[11.5px] font-semibold outline-none", STATUS[c.status].cls)}
                >
                  {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <button onClick={() => removeCase(c.id)} className="press shrink-0 rounded-full p-1.5 text-label3 hover:text-[#ff3b30]"><Trash2 size={15} /></button>
              </div>
            );
          })}
        </div>

        {/* agents */}
        <div className="mt-6 grid gap-2.5 sm:grid-cols-3">
          {KINDS.map((k) => (
            <button key={k.id} onClick={() => onOpenBot(k.agent)} className="press flex items-center gap-3 rounded-[20px] bg-surface p-3.5 text-left shadow-[0_1px_2px_rgba(0,0,0,.05)]">
              <ConnLogo letter={k.label[0]} color={k.color} size={38} />
              <span className="min-w-0">
                <span className="block truncate text-[14.5px] font-semibold">{k.label}</span>
                <span className="block truncate text-[12px] text-label2">{k.bn}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
