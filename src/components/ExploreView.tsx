import { useMemo, useState } from "react";
import { Check, ChevronRight, Clock, Globe2, Plane, Search, Wallet } from "lucide-react";
import { COUNTRIES, findCountry } from "../lib/countries";
import { useStore, useRuntime } from "../lib/store";
import { Sheet, LargeTitle, inputCls } from "./ui";
import { cn } from "../utils/cn";

/** Country explorer — searchable, real desk data per destination. */
export default function ExploreView() {
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  const toast = useRuntime((s) => s.showToast);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return COUNTRIES;
    return COUNTRIES.filter((c) =>
      [c.name, c.bn, c.code, ...(c.types ?? []), ...(c.roles ?? [])].join(" ").toLowerCase().includes(t),
    );
  }, [q]);

  const active = open ? findCountry(open) : null;
  const chosen = settings.country;

  return (
    <div className="h-full overflow-y-auto pb-24">
      <LargeTitle title="Country explorer" sub={`${COUNTRIES.length} destinations · fees, employer cost, payroll and pathways`} />
      <div className="px-4 md:px-7">
        <div className="relative">
          <Search size={16} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-label3" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="দেশ, ভিসা টাইপ বা জব রোল খুঁজুন" className={cn(inputCls, "pl-10")} />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((c, i) => (
            <button
              key={c.code}
              onClick={() => setOpen(c.code)}
              style={{ animationDelay: `${Math.min(i, 12) * 28}ms` }}
              className={cn(
                "apple-card reveal lift group flex w-full flex-col gap-3 p-4 text-left",
                chosen === c.code && "ring-2 ring-[#0071E3]/30",
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-[26px] leading-none">{c.flag}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[16px] font-semibold tracking-[-0.01em]">{c.name}</div>
                  <div className="truncate text-[12.5px] text-label2">{c.bn} · {c.days} দিন</div>
                </div>
                {chosen === c.code ? (
                  <span className="flex h-6 items-center gap-1 rounded-full bg-[#34C759]/12 px-2 text-[11px] font-semibold text-[#1a7f37]"><Check size={11} />active</span>
                ) : (
                  <ChevronRight size={16} className="text-label3 transition-transform group-hover:translate-x-0.5" />
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(c.types ?? []).slice(0, 3).map((t) => (
                  <span key={t} className="rounded-full bg-[var(--fill)] px-2 py-0.5 text-[11px] text-label2">{t}</span>
                ))}
              </div>
              <div className="flex items-center gap-3 text-[11.5px] text-label3">
                <span className="inline-flex items-center gap-1"><Wallet size={11} />{c.fee?.split("·")[0]}</span>
                <span className="inline-flex items-center gap-1"><Clock size={11} />{c.days}d</span>
              </div>
            </button>
          ))}
        </div>
        {list.length === 0 && (
          <div className="mt-16 text-center text-[14px] text-label2">"{q}" — কোনো দেশ পাওয়া যায়নি</div>
        )}
      </div>

      <Sheet open={!!active} onClose={() => setOpen(null)} title={active ? `${active.flag} ${active.name}` : ""}>
        {active && (
          <div className="max-h-[72vh] overflow-y-auto p-4 pb-8">
            <div className="text-[13px] text-label2">{active.bn} · প্রসেসিং {active.days} দিন · পোর্টাল {active.portal}</div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {[
                { k: "সরকারি ফি", v: active.fee ?? "—" },
                { k: "এমপ্লয়ার খরচ", v: active.employer ?? "—" },
                { k: "পে-রোল", v: active.payroll ?? "—" },
                { k: "পারমিট", v: active.permit ?? "—" },
              ].map((x) => (
                <div key={x.k} className="apple-card p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-label3">{x.k}</div>
                  <div className="mt-1 text-[13px] leading-snug">{x.v}</div>
                </div>
              ))}
            </div>

            <Section title="ভিসা টাইপ" items={active.types ?? []} />
            <Section title="দরকারি ডকুমেন্ট" items={active.needs ?? []} />
            <Section title="পাথওয়ে" items={active.pathways ?? []} icon={<Plane size={12} />} />
            <Section title="চাহিদার রোল" items={active.roles ?? []} icon={<Globe2 size={12} />} />

            <button
              onClick={() => {
                setSettings((s) => ({ ...s, country: active.code }));
                toast(`${active.name} desk-এ সেট হয়েছে`);
                setOpen(null);
              }}
              className="press mt-5 flex w-full items-center justify-center gap-2 rounded-[14px] bg-[#0071E3] py-3.5 text-[15px] font-semibold text-white"
            >
              <Check size={16} /> এই দেশে কাজ শুরু করো
            </button>
          </div>
        )}
      </Sheet>
    </div>
  );
}

function Section({ title, items, icon }: { title: string; items: string[]; icon?: React.ReactNode }) {
  if (!items.length) return null;
  return (
    <div className="mt-5">
      <div className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-label3">{icon}{title}</div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((t) => (
          <span key={t} className="rounded-full bg-[var(--fill)] px-2.5 py-1 text-[12px] text-label">{t}</span>
        ))}
      </div>
    </div>
  );
}
