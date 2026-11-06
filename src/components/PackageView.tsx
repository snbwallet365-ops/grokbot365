import { useRef, useState } from "react";
import { Check, Download, FileText, Loader2, ScanLine, Sparkles, Upload } from "lucide-react";
import { useStore, useRuntime, type Applicant, type Employer } from "../lib/store";
import { readPassport } from "../lib/ocr";
import { downloadPackage } from "../lib/visaPackage";
import { COUNTRIES } from "../lib/countries";
import { cn } from "../utils/cn";

const A: { k: keyof Applicant; label: string; ph?: string }[] = [
  { k: "fullName", label: "পূর্ণ নাম" },
  { k: "surname", label: "Surname" },
  { k: "givenNames", label: "Given names" },
  { k: "passportNo", label: "পাসপোর্ট নম্বর", ph: "A12345678" },
  { k: "nationality", label: "Nationality", ph: "BGD" },
  { k: "dob", label: "জন্মতারিখ", ph: "DD/MM/YYYY" },
  { k: "sex", label: "Sex", ph: "M / F" },
  { k: "expiry", label: "পাসপোর্টের মেয়াদ", ph: "DD/MM/YYYY" },
  { k: "issuePlace", label: "Issue place", ph: "DHAKA" },
  { k: "occupation", label: "পেশা" },
  { k: "phone", label: "মোবাইল" },
  { k: "email", label: "ইমেইল" },
  { k: "address", label: "ঠিকানা" },
];

const E: { k: keyof Employer; label: string; ph?: string }[] = [
  { k: "company", label: "কোম্পানির নাম" },
  { k: "contactPerson", label: "Contact person" },
  { k: "designation", label: "Designation" },
  { k: "address", label: "ঠিকানা" },
  { k: "phone", label: "ফোন" },
  { k: "email", label: "ইমেইল" },
  { k: "registrationNo", label: "Reg. no" },
  { k: "jobTitle", label: "পদবি" },
  { k: "salary", label: "বেতন", ph: "BDT 85,000 / month" },
  { k: "contractStart", label: "Joining date", ph: "03/2021" },
];

export default function PackageView() {
  const profiles = useStore((s) => s.profiles);
  const setProfile = useStore((s) => s.setProfile);
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  const addCase = useStore((s) => s.addCase);
  const online = useRuntime((s) => s.serverOnline);
  const toast = useRuntime((s) => s.showToast);

  const [tab, setTab] = useState<"applicant" | "employer">("applicant");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [via, setVia] = useState<string | null>(null);
  const [visaType, setVisaType] = useState("Tourist / Visitor");
  const fileRef = useRef<HTMLInputElement>(null);

  const a = profiles.applicant;
  const e = profiles.employer;
  const country = COUNTRIES.find((c) => c.code === settings.country);

  const onFile = async (file: File) => {
    setBusy(true);
    setNote(null);
    setVia(null);
    try {
      const visionCfg = (() => {
        const order = ["gemini", "openai", "xai"] as const;
        for (const p of order) {
          const key = settings.keys[p];
          if (key) {
            const model = p === "gemini" ? "gemini-3.8-flash" : p === "openai" ? "gpt-6.1-terra" : "grok-4.7";
            return { provider: p, key, model };
          }
        }
        return undefined;
      })();
      const out = await readPassport(file, { serverUrl: settings.server.url, serverOnline: online, vision: visionCfg });
      setProfile({ applicant: { ...a, ...out.passport } as Applicant });
      setVia(out.via);
      setNote(out.note ?? (out.via === "manual" ? null : "তথ্য পড়া হয়েছে, একবার মিলিয়ে নিন"));
      if (out.passport.passportNo) {
        addCase({
          title: out.passport.fullName || out.passport.passportNo || file.name,
          kind: "visa",
          country: settings.country ?? "",
          applicant: out.passport.fullName || file.name,
          status: "new",
          fileName: file.name,
        });
        toast("কেস তৈরি হয়েছে · প্রোফাইল সেভ হয়েছে");
      }
    } catch (err: any) {
      setNote(String(err?.message ?? err).slice(0, 120));
    } finally {
      setBusy(false);
    }
  };

  const generate = () => {
    if (!a.fullName && !a.passportNo) {
      setNote("আগে নাম বা পাসপোর্ট নম্বর দিন");
      return;
    }
    downloadPackage({ applicant: a, employer: e, countryCode: settings.country, visaType });
    toast("PDF প্যাকেজ তৈরি হয়েছে");
  };

  return (
    <div className="h-full overflow-y-auto pb-16">
      <div className="px-4 pt-4 md:px-7">
        <div className="pop overflow-hidden rounded-[24px] bg-gradient-to-br from-[#0a84ff] via-[#5e5ce6] to-[#bf5af2] p-5 text-white shadow-[0_18px_44px_rgba(10,132,255,.3)]">
          <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.18em] opacity-90"><ScanLine size={13} /> Visa package</div>
          <div className="mt-2 text-[26px] font-bold leading-tight tracking-tight">পাসপোর্ট থেকে PDF প্যাকেজ</div>
          <div className="mt-1 text-[13px] text-white/85">{online ? "লোকাল OCR চালু · আনলিমিটেড" : "ভিশন মডেল বা লোকাল সার্ভার দিয়ে পড়বে"}</div>
        </div>

        <div className="mt-4 rounded-[20px] bg-surface p-3 shadow-[0_1px_2px_rgba(0,0,0,.04)]">
          <button onClick={() => fileRef.current?.click()} disabled={busy} className="press flex w-full items-center gap-3 rounded-[16px] border border-dashed border-[var(--sep)] p-3 text-left">
            <span className="flex h-11 w-11 items-center justify-center rounded-[13px] bg-[#007aff]/12 text-[#007aff]">{busy ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}</span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14.5px] font-semibold">{busy ? "পড়া হচ্ছে…" : "পাসপোর্ট আপলোড (ছবি বা PDF)"}</span>
              <span className="block truncate text-[12px] text-label2">{via ? `সোর্স: ${via}` : "MRZ থেকে নাম, নম্বর, জন্মতারিখ, মেয়াদ"}</span>
            </span>
          </button>
          <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={(ev) => { const f = ev.target.files?.[0]; if (f) onFile(f); ev.currentTarget.value = ""; }} />
          {note && <div className="mt-2 rounded-[12px] bg-fill px-3 py-2 text-[12.5px] text-label2">{note}</div>}
        </div>

        <div className="mt-4 flex gap-1 rounded-[14px] bg-fill p-1">
          {(["applicant", "employer"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={cn("press flex-1 rounded-[11px] py-2 text-[13.5px] font-semibold transition-all", tab === t ? "bg-surface shadow-[0_1px_3px_rgba(0,0,0,.08)]" : "text-label2")}>
              {t === "applicant" ? "আবেদনকারী" : "এমপ্লয়ার"}
            </button>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
          {(tab === "applicant" ? A : E).map((f) => (
            <label key={f.k} className="block">
              <span className="mb-1 block text-[11.5px] font-medium text-label2">{f.label}</span>
              <input
                value={tab === "applicant" ? (a as any)[f.k] ?? "" : (e as any)[f.k] ?? ""}
                onChange={(ev) => setProfile(tab === "applicant" ? { applicant: { ...a, [f.k]: ev.target.value } as Applicant } : { employer: { ...e, [f.k]: ev.target.value } as Employer })}
                placeholder={f.ph}
                className="w-full rounded-[12px] bg-surface px-3 py-2.5 text-[14px] outline-none placeholder:text-label3"
              />
            </label>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-[11.5px] font-medium text-label2">দেশ</span>
            <select value={settings.country ?? ""} onChange={(ev) => setSettings((s) => ({ ...s, country: ev.target.value }))} className="w-full rounded-[12px] bg-surface px-3 py-2.5 text-[14px]">
              {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[11.5px] font-medium text-label2">ভিসার ধরন</span>
            <select value={visaType} onChange={(ev) => setVisaType(ev.target.value)} className="w-full rounded-[12px] bg-surface px-3 py-2.5 text-[14px]">
              {(country?.types ?? ["Tourist / Visitor", "Business", "Work"]).map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
        </div>

        <button onClick={generate} className="press mt-4 flex w-full items-center justify-center gap-2 rounded-[15px] bg-[#007aff] py-3.5 text-[15px] font-semibold text-white shadow-[0_8px_20px_rgba(0,122,255,.28)]">
          <Download size={17} /> প্যাকেজ PDF ডাউনলোড
        </button>

        <div className="mt-3 flex items-start gap-2 rounded-[14px] bg-fill p-3 text-[12px] text-label2">
          <Sparkles size={14} className="mt-0.5 shrink-0 text-[#007aff]" />
          <span>প্যাকেজে থাকে: কভার লেটার, আবেদনকারীর সারসংক্ষেপ, এমপ্লয়ার স্পনসরশিপ লেটার, ডকুমেন্ট চেকলিস্ট, ডিক্লারেশন। প্রোফাইল সেভ থাকে, পরের আবেদনে শুধু পাসপোর্ট বদলালেই হবে।</span>
        </div>

        <div className="mt-4 flex items-center gap-2 text-[12px] text-label2">
          <Check size={13} className="text-[#34c759]" /> লোকাল সার্ভার: <code className="rounded bg-fill px-1.5 py-0.5">{settings.server.url}</code>
          <button onClick={() => setSettings((s) => ({ ...s, server: { ...s.server, url: s.server.url } }))} className="press ml-auto flex items-center gap-1 rounded-full bg-fill px-2.5 py-1"><FileText size={12} /> {online ? "online" : "offline"}</button>
        </div>
      </div>
    </div>
  );
}
