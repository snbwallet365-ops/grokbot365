import { useState } from "react";
import { Briefcase, Building2, CalendarClock, Plus, Trash2, UserRound } from "lucide-react";
import { useStore, type Hiring, type Stage } from "../lib/store";
import { LargeTitle, Sheet, inputCls } from "./ui";
import { COUNTRIES } from "../lib/countries";
import { cn } from "../utils/cn";

const STAGES: { id: Stage; label: string; color: string }[] = [
  { id: "new", label: "New", color: "#8E8E93" },
  { id: "screening", label: "Screening", color: "#0071E3" },
  { id: "interview", label: "Interview", color: "#FF9F0A" },
  { id: "offer", label: "Offer", color: "#5E5CE6" },
  { id: "visa", label: "Visa", color: "#34C759" },
  { id: "placed", label: "Placed", color: "#1A7F37" },
  { id: "rejected", label: "Rejected", color: "#FF3B30" },
];

type Tab = keyof Hiring;
const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: "candidates", label: "Candidates", icon: UserRound },
  { id: "employers", label: "Employers", icon: Building2 },
  { id: "jobs", label: "Jobs", icon: Briefcase },
  { id: "interviews", label: "Interviews", icon: CalendarClock },
];

/** Recruitment pipeline — real records the desk fills in, nothing pre-seeded. */
export default function RecruitView() {
  const hiring = useStore((s) => s.hiring);
  const add = useStore((s) => s.addHiring);
  const update = useStore((s) => s.updateHiring);
  const remove = useStore((s) => s.removeHiring);
  const [tab, setTab] = useState<Tab>("candidates");
  const [edit, setEdit] = useState<{ kind: Tab; id: string } | null>(null);

  const counts = {
    candidates: hiring.candidates.length,
    employers: hiring.employers.length,
    jobs: hiring.jobs.length,
    interviews: hiring.interviews.length,
  } as Record<Tab, number>;

  const openRow = (kind: Tab, id: string) => setEdit({ kind, id });
  const newRow = () => { const id = add(tab); setEdit({ kind: tab, id }); };
  const current = edit ? (hiring[edit.kind] as any[]).find((r) => r.id === edit.id) : null;
  const patch = (p: any) => edit && update(edit.kind, edit.id, p);

  return (
    <div className="h-full overflow-y-auto pb-28">
      <LargeTitle title="Recruitment" sub="Candidates, employers, jobs and interviews — one pipeline" />

      <div className="px-4 md:px-7">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn("press flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-semibold transition-all",
                tab === t.id ? "bg-[#0071E3] text-white shadow-[0_6px_18px_rgba(0,113,227,.28)]" : "bg-[var(--surface)] text-label ring-1 ring-[var(--sep)]")}>
              <t.icon size={14} /> {t.label}
              <span className={cn("rounded-full px-1.5 text-[11px]", tab === t.id ? "bg-white/20" : "bg-[var(--fill)] text-label2")}>{counts[t.id]}</span>
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-2.5">
          {counts[tab] === 0 && (
            <div className="apple-card mt-8 flex flex-col items-center gap-3 px-6 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--fill)] text-label2"><Briefcase size={20} /></div>
              <div className="text-[15px] font-semibold">এখনো কিছু নেই</div>
              <div className="max-w-[280px] text-[13px] text-label2">নতুন এন্ট্রি যোগ করলে সেটা এখানে সেভ থাকবে আর ভিসা কেসে রিইউজ হবে।</div>
              <button onClick={newRow} className="press mt-1 flex items-center gap-1.5 rounded-full bg-[#0071E3] px-4 py-2 text-[13px] font-semibold text-white"><Plus size={14} /> নতুন যোগ করো</button>
            </div>
          )}

          {tab === "candidates" && hiring.candidates.map((c) => {
            const st = STAGES.find((s) => s.id === c.stage) ?? STAGES[0];
            return (
              <button key={c.id} onClick={() => openRow("candidates", c.id)} className="apple-card lift flex w-full items-center gap-3 p-3.5 text-left">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--fill)] text-[15px] font-semibold">{c.name ? c.name[0].toUpperCase() : "?"}</div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-semibold">{c.name || "নাম দাও"}</div>
                  <div className="truncate text-[12.5px] text-label2">{c.role || "রোল নেই"} · {c.country}</div>
                </div>
                <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: st.color + "1f", color: st.color }}>{st.label}</span>
              </button>
            );
          })}

          {tab === "employers" && hiring.employers.map((e) => (
            <button key={e.id} onClick={() => openRow("employers", e.id)} className="apple-card lift flex w-full items-center gap-3 p-3.5 text-left">
              <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#0071E3]/10 text-[#0071E3]"><Building2 size={18} /></div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[15px] font-semibold">{e.company || "কোম্পানির নাম"}</div>
                <div className="truncate text-[12.5px] text-label2">{e.country} · {e.contact || "কন্টাক্ট নেই"}</div>
              </div>
            </button>
          ))}

          {tab === "jobs" && hiring.jobs.map((j) => (
            <button key={j.id} onClick={() => openRow("jobs", j.id)} className="apple-card lift flex w-full items-center gap-3 p-3.5 text-left">
              <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#FF9F0A]/12 text-[#B26A00]"><Briefcase size={18} /></div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[15px] font-semibold">{j.title || "জব টাইটেল"}</div>
                <div className="truncate text-[12.5px] text-label2">{j.country} · {j.salary || "স্যালারি নেই"} · {j.slots || 1} slot</div>
              </div>
              <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", j.status === "open" ? "bg-[#34C759]/12 text-[#1a7f37]" : "bg-[var(--fill)] text-label2")}>{j.status}</span>
            </button>
          ))}

          {tab === "interviews" && hiring.interviews.map((iv) => (
            <button key={iv.id} onClick={() => openRow("interviews", iv.id)} className="apple-card lift flex w-full items-center gap-3 p-3.5 text-left">
              <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#5E5CE6]/12 text-[#5E5CE6]"><CalendarClock size={18} /></div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[15px] font-semibold">{iv.candidate || "ক্যান্ডিডেট"} ↔ {iv.employer || "এমপ্লয়ার"}</div>
                <div className="truncate text-[12.5px] text-label2">{iv.when?.replace("T", " ")} · {iv.mode || "video"} · {iv.outcome || "pending"}</div>
              </div>
            </button>
          ))}
        </div>

        {counts[tab] > 0 && (
          <button onClick={newRow} className="press fixed right-4 bottom-24 z-20 flex h-12 items-center gap-1.5 rounded-full bg-[#0071E3] px-4 text-[14px] font-semibold text-white shadow-[0_10px_30px_rgba(0,113,227,.35)] md:static md:mt-5 md:inline-flex md:shadow-none">
            <Plus size={16} /> নতুন
          </button>
        )}
      </div>

      <Sheet open={!!current} onClose={() => setEdit(null)} title={edit ? TABS.find((t) => t.id === edit.kind)?.label ?? "" : ""}>
        {current && (
          <div className="max-h-[70vh] overflow-y-auto p-4 pb-8">
            {edit!.kind === "candidates" && (
              <div className="space-y-2.5">
                <input className={inputCls} value={current.name} placeholder="পূর্ণ নাম" onChange={(e) => patch({ name: e.target.value })} />
                <input className={inputCls} value={current.passport} placeholder="পাসপোর্ট নম্বর" onChange={(e) => patch({ passport: e.target.value })} />
                <input className={inputCls} value={current.role} placeholder="রোল (যেমন: Welder)" onChange={(e) => patch({ role: e.target.value })} />
                <input className={inputCls} value={current.phone ?? ""} placeholder="মোবাইল / WhatsApp" onChange={(e) => patch({ phone: e.target.value })} />
                <select className={inputCls} value={current.country} onChange={(e) => patch({ country: e.target.value })}>
                  {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
                </select>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {STAGES.map((s) => (
                    <button key={s.id} onClick={() => patch({ stage: s.id })}
                      className={cn("press rounded-full px-3 py-1.5 text-[12px] font-semibold", current.stage === s.id ? "text-white" : "bg-[var(--fill)] text-label2")}
                      style={current.stage === s.id ? { background: s.color } : undefined}>{s.label}</button>
                  ))}
                </div>
                <textarea className={cn(inputCls, "min-h-[72px]")} value={current.note ?? ""} placeholder="নোট" onChange={(e) => patch({ note: e.target.value })} />
              </div>
            )}

            {edit!.kind === "employers" && (
              <div className="space-y-2.5">
                <input className={inputCls} value={current.company} placeholder="কোম্পানির নাম" onChange={(e) => patch({ company: e.target.value })} />
                <input className={inputCls} value={current.contact ?? ""} placeholder="কন্টাক্ট পারসন" onChange={(e) => patch({ contact: e.target.value })} />
                <input className={inputCls} value={current.email ?? ""} placeholder="ইমেইল" onChange={(e) => patch({ email: e.target.value })} />
                <input className={inputCls} value={current.phone ?? ""} placeholder="ফোন" onChange={(e) => patch({ phone: e.target.value })} />
                <input className={inputCls} value={current.sector ?? ""} placeholder="সেক্টর" onChange={(e) => patch({ sector: e.target.value })} />
                <select className={inputCls} value={current.country} onChange={(e) => patch({ country: e.target.value })}>
                  {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
                </select>
              </div>
            )}

            {edit!.kind === "jobs" && (
              <div className="space-y-2.5">
                <input className={inputCls} value={current.title} placeholder="জব টাইটেল" onChange={(e) => patch({ title: e.target.value })} />
                <input className={inputCls} value={current.employer} placeholder="এমপ্লয়ার" onChange={(e) => patch({ employer: e.target.value })} />
                <input className={inputCls} value={current.salary ?? ""} placeholder="স্যালারি" onChange={(e) => patch({ salary: e.target.value })} />
                <input className={inputCls} value={current.slots ?? ""} placeholder="কতজন" onChange={(e) => patch({ slots: e.target.value })} />
                <select className={inputCls} value={current.country} onChange={(e) => patch({ country: e.target.value })}>
                  {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
                </select>
                <div className="flex gap-1.5">
                  {(["open", "hold", "filled"] as const).map((st) => (
                    <button key={st} onClick={() => patch({ status: st })} className={cn("press rounded-full px-3 py-1.5 text-[12px] font-semibold", current.status === st ? "bg-[#0071E3] text-white" : "bg-[var(--fill)] text-label2")}>{st}</button>
                  ))}
                </div>
              </div>
            )}

            {edit!.kind === "interviews" && (
              <div className="space-y-2.5">
                <input className={inputCls} value={current.candidate} placeholder="ক্যান্ডিডেট" onChange={(e) => patch({ candidate: e.target.value })} />
                <input className={inputCls} value={current.employer} placeholder="এমপ্লয়ার" onChange={(e) => patch({ employer: e.target.value })} />
                <input className={inputCls} type="datetime-local" value={current.when} onChange={(e) => patch({ when: e.target.value })} />
                <input className={inputCls} value={current.mode ?? ""} placeholder="video / phone / in-person" onChange={(e) => patch({ mode: e.target.value })} />
                <input className={inputCls} value={current.outcome ?? ""} placeholder="ফলাফল" onChange={(e) => patch({ outcome: e.target.value })} />
              </div>
            )}

            <button onClick={() => { remove(edit!.kind, edit!.id); setEdit(null); }}
              className="press mt-4 flex w-full items-center justify-center gap-1.5 rounded-[14px] bg-[#FF3B30]/10 py-3 text-[14px] font-semibold text-[#FF3B30]">
              <Trash2 size={15} /> ডিলিট করো
            </button>
          </div>
        )}
      </Sheet>
    </div>
  );
}
