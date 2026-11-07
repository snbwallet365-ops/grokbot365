import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Briefcase, FileStack, FileText, Globe2, Plus, Search, Trash2, Upload, Sparkles, ShieldCheck, Users2 } from "lucide-react";
import { useStore, useRuntime, type CaseFile } from "../lib/store";
import { COUNTRIES } from "../lib/countries";
import { CONNECTORS } from "../lib/connectors";
import BrandMark from "./Logo";
import { cn } from "../utils/cn";

/** Animated counter — Apple trust-section style (ease-out, no layout shift). */
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [n, setN] = useState(0);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    const start = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / 1100);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(to * eased));
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [to]);
  return <span>{n}{suffix}</span>;
}

const SLIDES = [
  { kicker: "VisaHOBe · Global mobility OS", l1: "Global hiring.", l2: "Visas included.", sub: "One desk for recruitment, visa processing, documentation and payroll. Your agents read the passport, build the file and keep every deadline." },
  { kicker: "Built for consultancies", l1: "Every case.", l2: "One pipeline.", sub: "Employers, candidates, interviews and embassy submissions stay in a single timeline, so nothing waits in an inbox." },
  { kicker: "Apple-grade privacy", l1: "Your data.", l2: "Your device.", sub: "Keys and documents stay on this device unless you send them to a provider. Local server runs unlimited, offline." },
  { kicker: "19 destinations", l1: "From Dhaka.", l2: "To anywhere.", sub: "Country rules, employer costs, payroll and pathways — checked against the official portal before you file." },
];

const KINDS = [
  { id: "visa", label: "Visa", icon: Globe2, color: "#0071e3" },
  { id: "recruit", label: "Recruitment", icon: Users2, color: "#34c759" },
  { id: "docs", label: "Documentation", icon: FileText, color: "#ff9f0a" },
];

const AGENTS = [
  { id: "browser", name: "Visa Filing", desc: "Country rules, forms, portal submissions", glyph: "globe" },
  { id: "visa", name: "Global Recruitment", desc: "Employers, candidates, contracts, payroll", glyph: "users" },
  { id: "docs", name: "Documentation", desc: "Passport reading, attestation, PDF packs", glyph: "doc" },
];

const MODULES = [
  { title: "Visa processing", desc: "Country-specific rules, live checklists and portal-ready packs.", tone: "#0071e3" },
  { title: "Recruitment", desc: "Employer demand, candidate matching and interview pipelines.", tone: "#34c759" },
  { title: "Documentation", desc: "Passport OCR, attestation and translation, one PDF package.", tone: "#ff9f0a" },
  { title: "Compliance", desc: "Expiry watch, missing-document gates and audit trail.", tone: "#bf5af2" },
];

export default function DashboardView({ onOpenBot }: { onOpenBot: (id: string) => void }) {
  const cases = useStore((s) => s.cases);
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  const addCase = useStore((s) => s.addCase);
  const updateCase = useStore((s) => s.updateCase);
  const removeCase = useStore((s) => s.removeCase);
  const toast = useRuntime((s) => s.showToast);
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<CaseFile["kind"] | "all">("all");
  const fileRef = useRef<HTMLInputElement>(null);
  const docs = useStore((s) => s.docs.length);
  const threads = useStore((s) => s.threads);

  const [slide, setSlide] = useState(0);
  const [par, setPar] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setSlide((i) => (i + 1) % SLIDES.length), 5600);
    return () => clearInterval(t);
  }, []);
  const s0 = SLIDES[slide];
  const country = COUNTRIES.find((c) => c.code === settings.country) ?? COUNTRIES[0];
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return cases.filter((c) =>
      (kind === "all" || c.kind === kind) &&
      (!t || `${c.title} ${c.applicant} ${c.country} ${c.status}`.toLowerCase().includes(t)),
    );
  }, [cases, q, kind]);

  const connected = Object.values(settings.connectors ?? {}).filter((c) => c.status === "connected").length;
  const messages = Object.values(threads).reduce((n, t) => n + t.length, 0);

  const openWithFile = async (file: File) => {
    const base = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
    const id = addCase({ title: base || "New case", kind: "visa", country: country.code, applicant: base || "Applicant", status: "new", fileName: file.name });
    toast(`কেস তৈরি হয়েছে · ${base || file.name}`);
    onOpenBot("browser");
    return id;
  };

  const stats = [
    { label: "Countries", value: COUNTRIES.length, suffix: "" },
    { label: "Connectors", value: CONNECTORS.length, suffix: "" },
    { label: "Cases", value: cases.length, suffix: "" },
    { label: "Knowledge", value: docs, suffix: "" },
  ];

  return (
    <div className="h-full overflow-y-auto" onScroll={(e) => setPar(Math.min(90, e.currentTarget.scrollTop * 0.16))}>
      <div className="pb-28">

        {/* ---------- Hero ---------- */}
        <section className="relative overflow-hidden px-5 pt-8 pb-4 md:px-10 md:pt-14">
          <div aria-hidden className="pointer-events-none absolute -top-24 -right-16 h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(0,113,227,.22),transparent_62%)] blur-2xl" style={{ transform: `translate3d(0,${par * -0.6}px,0)` }} />
          <div aria-hidden className="pointer-events-none absolute top-24 -left-20 h-[280px] w-[280px] rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(191,90,242,.18),transparent_62%)] blur-2xl" style={{ transform: `translate3d(0,${par * -0.35}px,0)` }} />
          <div className="relative mx-auto max-w-[980px]">
            <div className="reveal flex items-center gap-2.5">
              <BrandMark size={30} />
              <span key={`k${slide}`} className="eyebrow slide-in">{s0.kicker}</span>
            </div>
            <div key={slide} className="slide-in">
              <h1 className="display-1 mt-5 text-[var(--label)]">
                {s0.l1}<br />
                <span className="bg-gradient-to-r from-[#0071e3] via-[#5e5ce6] to-[#bf5af2] bg-clip-text text-transparent">{s0.l2}</span>
              </h1>
              <p className="mt-5 max-w-[640px] text-[17px] leading-relaxed text-[var(--label2)] md:text-[19px]">{s0.sub}</p>
            </div>
            <div className="mt-6 flex items-center gap-1.5">
              {SLIDES.map((_, i) => (
                <button key={i} aria-label={`Slide ${i + 1}`} onClick={() => setSlide(i)}
                  className={cn("h-1.5 rounded-full transition-all duration-500", i === slide ? "w-7 bg-[#0071e3]" : "w-1.5 bg-[var(--sep)]")} />
              ))}
            </div>
            <div className="reveal reveal-3 mt-6 flex flex-wrap items-center gap-3">
              <button onClick={() => fileRef.current?.click()} className="press flex items-center gap-2 rounded-full bg-[#0071e3] px-5 py-3 text-[15px] font-semibold text-white shadow-[0_10px_28px_rgba(0,113,227,.32)]">
                <Upload size={17} /> Start from a passport
              </button>
              <button onClick={() => onOpenBot("grok")} className="press flex items-center gap-2 rounded-full border border-[var(--sep)] bg-white/70 px-5 py-3 text-[15px] font-semibold backdrop-blur">
                <Sparkles size={16} className="text-[#0071e3]" /> Ask the main agent
              </button>
              <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) openWithFile(f); e.currentTarget.value = ""; }} />
            </div>

            {/* trust strip */}
            <div className="reveal reveal-4 mt-9 grid grid-cols-2 gap-3 md:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label} className="apple-card px-4 py-3.5">
                  <div className="text-[26px] font-semibold tracking-tight md:text-[30px]"><Counter to={s.value} suffix={s.suffix} /></div>
                  <div className="mt-0.5 text-[12px] text-[var(--label2)]">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- Agents ---------- */}
        <section className="px-5 pt-6 md:px-10">
          <div className="mx-auto max-w-[980px]">
            <div className="flex items-end justify-between">
              <h2 className="title-3">Your AI desk</h2>
              <button onClick={() => onOpenBot("grok")} className="press flex items-center gap-1 text-[14px] font-medium text-[#0071e3]">
                Open all <ArrowRight size={15} />
              </button>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {AGENTS.map((a, i) => (
                <button key={a.id} onClick={() => onOpenBot(a.id)}
                  className={cn("apple-card reveal group px-5 py-5 text-left", i === 0 && "reveal-1", i === 1 && "reveal-2", i === 2 && "reveal-3")}>
                  <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-gradient-to-br from-[#0071e3] to-[#5e5ce6] text-white shadow-[0_8px_20px_rgba(0,113,227,.28)]">
                    {a.glyph === "globe" ? <Globe2 size={20} /> : a.glyph === "users" ? <Users2 size={20} /> : <FileText size={20} />}
                  </div>
                  <div className="mt-4 text-[17px] font-semibold tracking-tight">{a.name}</div>
                  <div className="mt-1 text-[13.5px] leading-snug text-[var(--label2)]">{a.desc}</div>
                  <div className="mt-3 flex items-center gap-1 text-[13px] font-medium text-[#0071e3] opacity-0 transition-opacity group-hover:opacity-100">
                    Open <ArrowRight size={14} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- Country ---------- */}
        <section className="px-5 pt-8 md:px-10">
          <div className="mx-auto max-w-[980px]">
            <h2 className="title-3">Destination</h2>
            <p className="mt-1 text-[14px] text-[var(--label2)]">Rules, portal and checklist switch with the country you pick.</p>
            <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
              {COUNTRIES.map((c) => (
                <button key={c.code} onClick={() => { setSettings((s) => ({ ...s, country: c.code })); toast(`${c.bn} নির্বাচিত`); }}
                  className={cn("press flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-[13.5px] font-medium transition-all",
                    c.code === country.code ? "border-transparent bg-[#0071e3] text-white shadow-[0_6px_18px_rgba(0,113,227,.3)]" : "border-[var(--sep)] bg-white/70 text-[var(--label)] backdrop-blur")}>
                  <span>{c.flag}</span>{c.bn}
                </button>
              ))}
            </div>
            <div className="apple-card mt-4 grid gap-4 p-5 sm:grid-cols-3">
              <div>
                <div className="eyebrow">Portal</div>
                <div className="mt-1 text-[15px] font-semibold">{country.portal}</div>
                <div className="text-[13px] text-[var(--label2)]">{country.days} days typical</div>
              </div>
              <div>
                <div className="eyebrow">Visa types</div>
                <div className="mt-1 text-[13.5px] leading-relaxed text-[var(--label2)]">{country.types.join(" · ")}</div>
              </div>
              <div>
                <div className="eyebrow">Required</div>
                <div className="mt-1 text-[13.5px] leading-relaxed text-[var(--label2)]">{country.needs.slice(0, 4).join(", ")}</div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- Modules ---------- */}
        <section className="px-5 pt-9 md:px-10">
          <div className="mx-auto max-w-[980px]">
            <h2 className="title-3">Everything connected</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {MODULES.map((m) => (
                <div key={m.title} className="apple-card px-5 py-5">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: m.tone }} />
                    <div className="text-[16px] font-semibold tracking-tight">{m.title}</div>
                  </div>
                  <p className="mt-2 text-[13.5px] leading-snug text-[var(--label2)]">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- Cases ---------- */}
        <section className="px-5 pt-9 md:px-10">
          <div className="mx-auto max-w-[980px]">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <h2 className="title-3">Cases</h2>
              <div className="flex items-center gap-1.5">
                <div className="relative">
                  <Search size={14} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[var(--label3)]" />
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search"
                    className="w-40 rounded-full border border-[var(--sep)] bg-white/70 py-2 pr-3 pl-8 text-[13.5px] outline-none backdrop-blur placeholder:text-[var(--label3)]" />
                </div>
                <button onClick={() => fileRef.current?.click()} className="press flex h-9 w-9 items-center justify-center rounded-full bg-[#0071e3] text-white"><Plus size={17} /></button>
              </div>
            </div>

            <div className="mt-3 flex gap-2">
              <button onClick={() => setKind("all")} className={cn("press rounded-full px-3 py-1.5 text-[13px] font-medium", kind === "all" ? "bg-[var(--label)] text-white" : "bg-white/70 text-[var(--label2)] backdrop-blur")}>All</button>
              {KINDS.map((k) => (
                <button key={k.id} onClick={() => setKind(k.id as CaseFile["kind"])}
                  className={cn("press flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium", kind === k.id ? "bg-[var(--label)] text-white" : "bg-white/70 text-[var(--label2)] backdrop-blur")}>
                  <k.icon size={13} />{k.label}
                </button>
              ))}
            </div>

            {list.length === 0 ? (
              <div className="apple-card mt-3 flex flex-col items-center justify-center px-6 py-12 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[var(--fill)]"><FileStack size={24} className="text-[var(--label2)]" /></div>
                <div className="mt-4 text-[17px] font-semibold">No cases yet</div>
                <p className="mt-1 max-w-[300px] text-[13.5px] text-[var(--label2)]">Drop a passport or a form and the desk creates the case, reads the document and starts the file.</p>
                <button onClick={() => fileRef.current?.click()} className="press mt-4 rounded-full bg-[#0071e3] px-4 py-2.5 text-[14px] font-semibold text-white">Start from a file</button>
              </div>
            ) : (
              <div className="mt-3 space-y-2.5">
                {list.map((c) => {
                  const k = KINDS.find((x) => x.id === c.kind) ?? KINDS[0];
                  const flag = COUNTRIES.find((x) => x.code === c.country)?.flag ?? "🌍";
                  return (
                    <div key={c.id} className="apple-card flex items-center gap-3 px-4 py-3.5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] text-white" style={{ background: k.color }}>
                        <k.icon size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[15px] font-semibold">{c.title}</div>
                        <div className="truncate text-[12.5px] text-[var(--label2)]">{flag} {c.country} · {c.fileName ?? "manual"} · {new Date(c.updatedAt).toLocaleDateString("en-GB")}</div>
                      </div>
                      <select value={c.status} onChange={(e) => updateCase(c.id, { status: e.target.value as CaseFile["status"] })}
                        className="shrink-0 rounded-full bg-[var(--fill)] px-2.5 py-1.5 text-[12.5px] font-medium outline-none">
                        <option value="new">New</option>
                        <option value="working">Working</option>
                        <option value="filed">Filed</option>
                        <option value="approved">Approved</option>
                        <option value="onhold">On hold</option>
                      </select>
                      <button onClick={() => removeCase(c.id)} className="press shrink-0 text-[var(--label3)] hover:text-[#ff3b30]"><Trash2 size={16} /></button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ---------- Live system ---------- */}
        <section className="px-5 pt-9 md:px-10">
          <div className="mx-auto max-w-[980px]">
            <div className="apple-card flex flex-wrap items-center gap-4 px-5 py-4">
              <ShieldCheck size={20} className="text-[#34c759]" />
              <div className="min-w-0 flex-1">
                <div className="text-[14.5px] font-semibold">{connected} connectors live · {messages} messages logged</div>
                <div className="text-[12.5px] text-[var(--label2)]">Keys stay on this device. Nothing is shared without your approval.</div>
              </div>
              <button onClick={() => onOpenBot("grok")} className="press flex items-center gap-1 rounded-full bg-[var(--fill)] px-3.5 py-2 text-[13px] font-semibold">
                <Briefcase size={14} /> Open desk
              </button>
            </div>
          </div>
        </section>

        <div className="h-6" />
      </div>
    </div>
  );
}
