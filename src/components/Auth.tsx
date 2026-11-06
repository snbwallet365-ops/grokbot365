import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Download, Loader2, Mail, ShieldCheck } from "lucide-react";
import BrandMark from "./Logo";
import { useAuth } from "../lib/auth";
import { pdfFromMarkdown, downloadUrl } from "../lib/pdf";

const TERMS_MD = `# N Space — Terms & Conditions
Last updated: 6 November 2026

## 1. What N Space is
N Space is an AI workspace for visa, recruitment and documentation work. It connects your own accounts (GitHub, Google, AI providers and others) and runs specialist agents on your behalf.

## 2. Your account
You are responsible for the accuracy of the information you enter and for keeping your device and API keys secure. One account per person. Admin tools are limited to the workspace owner.

## 3. AI output
Agent replies can be incomplete or wrong. Every visa form, legal document, fee or deadline must be verified against the official portal or authority before submission. N Space is not a law firm and does not provide legal advice.

## 4. Your data
Chats, notes and connection keys are stored only on this device unless you explicitly send them to a provider. N Space does not sell your data. API keys stay in local storage and are sent only to the provider you connected.

## 5. Acceptable use
No fraud, forged documents, impersonation, spam or attempts to bypass official systems. Misuse ends the account immediately.

## 6. Third-party services
Your use of GitHub, Google, Vercel, AI providers or any other connector is governed by their own terms and pricing.

## 7. Availability
This is software, not an embassy service. Features may change, and outages can happen. Keep your own backups of documents.

## 8. Changes
Continuing to use N Space after a terms update means you accept the updated terms.

## 9. Contact
Questions about these terms go to the workspace owner.`;

const CONFIRM_BN = "ভাই, আপনি কি AI N Space-এর ট্রামস ও কন্ডিশন ভালোভাবে পড়েছেন?";

type Stage = "choose" | "form" | "terms" | "confirm";

export default function AuthGate() {
  const { signIn, googleClientId, setGoogleClientId } = useAuth();
  const [stage, setStage] = useState<Stage>("choose");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("Bangladesh");
  const [agency, setAgency] = useState("");
  const [roleTitle, setRoleTitle] = useState("Visa Consultant");
  const [password, setPassword] = useState("");
  const [clientId, setClientId] = useState(googleClientId);
  const [askClient, setAskClient] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const scriptRef = useRef(false);

  // typewriter for the Bangla confirmation
  useEffect(() => {
    if (stage !== "confirm") return;
    setTyped("");
    let i = 0;
    const t = setInterval(() => {
      i += 1;
      setTyped(CONFIRM_BN.slice(0, i));
      if (i >= CONFIRM_BN.length) clearInterval(t);
    }, 38);
    return () => clearInterval(t);
  }, [stage]);

  const google = async () => {
    setNote(null);
    if (!clientId.trim()) { setAskClient(true); return; }
    setBusy(true);
    try {
      if (!scriptRef.current) {
        await new Promise<void>((res, rej) => {
          const s = document.createElement("script");
          s.src = "https://accounts.google.com/gsi/client";
          s.async = true; s.defer = true;
          s.onload = () => res(); s.onerror = () => rej(new Error("google unavailable"));
          document.head.appendChild(s);
        });
        scriptRef.current = true;
      }
      const g = (window as any).google?.accounts?.id;
      if (!g) throw new Error("google unavailable");
      g.initialize({
        client_id: clientId.trim(),
        callback: (res: { credential: string }) => {
          try {
            const payload = JSON.parse(decodeURIComponent(escape(atob(res.credential.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")))));
            setGoogleClientId(clientId);
            signIn({ name: payload.name || payload.email, email: payload.email, picture: payload.picture, provider: "google", role: "user", acceptedTerms: true, createdAt: Date.now() });
          } catch {
            setNote("Google থেকে তথ্য পড়া যায়নি, আবার চেষ্টা করুন");
          }
        },
      });
      g.prompt();
      setNote("Google অ্যাকাউন্ট বেছে নিন");
      setTimeout(() => setBusy(false), 1200);
    } catch {
      setBusy(false);
      setNote("Google শুরু হয়নি · Client ID ঠিক আছে কিনা দেখুন");
    }
  };

  const finish = () => {
    signIn({
      name: name.trim() || email.split("@")[0] || "N Space user",
      email: email.trim() || `user@nspace.local`,
      phone: phone.trim(),
      country,
      agency: agency.trim(),
      roleTitle,
      provider: "email",
      role: "user",
      acceptedTerms: true,
      createdAt: Date.now(),
    });
  };

  const termsPdf = useMemo(() => () => {
    const { url, filename } = pdfFromMarkdown("N Space — Terms & Conditions", TERMS_MD);
    downloadUrl(url, filename);
  }, []);

  return (
    <div className="splash-bg fixed inset-0 z-[150] overflow-y-auto">
      <div className="splash-blob splash-blob-a" />
      <div className="splash-blob splash-blob-b" />

      <div className="relative mx-auto flex min-h-full w-full max-w-[440px] flex-col justify-center px-5 py-10">
        {stage === "choose" && (
          <div className="pop">
            <div className="flex flex-col items-center text-center">
              <BrandMark size={78} />
              <div className="mt-5 text-[27px] font-bold tracking-tight">N Space</div>
              <div className="mt-1.5 max-w-[30ch] text-[14px] leading-snug text-label2">
                আপনার ভিসা, রিক্রুটমেন্ট ও ডকুমেন্টেশনের AI টিম — এক জায়গায়
              </div>
            </div>

            <div className="mt-9 space-y-2.5">
              <button onClick={google} className="press flex w-full items-center justify-center gap-2.5 rounded-[16px] bg-white py-3.5 text-[15px] font-semibold text-[#1c1c1e] shadow-[0_2px_12px_rgba(0,0,0,.10)]">
                <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
                  <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.5 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.2 17.6 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-2.8-.4-4.1H24v8.4h12.5c-.3 2.1-1.6 5.2-4.6 7.3l7.6 5.9c4.4-4.1 6.6-10.1 6.6-17.5z" />
                  <path fill="#FBBC05" d="M10.4 28.7A14.6 14.6 0 0 1 9.6 24c0-1.6.3-3.2.8-4.7l-7.8-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.8-6.1z" />
                  <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.5-5.8l-7.6-5.9c-2 1.4-4.7 2.4-7.9 2.4-6.4 0-11.7-3.7-13.6-8.9l-7.8 6.1C6.5 42.6 14.6 48 24 48z" />
                </svg>
                Google দিয়ে চালিয়ে যান
              </button>
              <button onClick={() => setStage("form")} className="press flex w-full items-center justify-center gap-2 rounded-[16px] bg-[#1c1c1e] py-3.5 text-[15px] font-semibold text-white">
                <Mail size={16} /> Sign up / Sign in
              </button>
            </div>

            {askClient && (
              <div className="pop mt-3 rounded-[16px] bg-surface p-3">
                <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-label2">Google Client ID</div>
                <input value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="…apps.googleusercontent.com" className="w-full rounded-[12px] bg-fill px-3 py-2.5 text-[13.5px] outline-none" />
                <button onClick={google} className="press mt-2 w-full rounded-[12px] bg-[#007aff] py-2.5 text-[14px] font-semibold text-white">সেভ করে চালিয়ে যান</button>
              </div>
            )}
            {note && <div className="mt-3 text-center text-[12.5px] font-medium text-[#007aff]">{note}</div>}

            <div className="mt-6 flex items-center justify-center gap-1.5 text-[11.5px] text-label3">
              <ShieldCheck size={12} /> আপনার ডেটা এই ডিভাইসেই থাকে
            </div>
          </div>
        )}

        {stage === "form" && (
          <div className="pop">
            <button onClick={() => setStage("choose")} className="press mb-6 flex items-center gap-1 text-[14px] font-medium text-label2"><ArrowLeft size={15} /> ফিরে যান</button>
            <div className="text-[24px] font-bold tracking-tight">আপনার অ্যাকাউন্ট</div>
            <div className="mt-1 text-[13.5px] text-label2">ভিসা ও রিক্রুটমেন্ট কাজের জন্য দরকারি তথ্য</div>
            <div className="mt-5 space-y-2.5">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="পূর্ণ নাম *" className="w-full rounded-[14px] bg-surface px-3.5 py-3.5 text-[15px] outline-none placeholder:text-label3" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" inputMode="email" placeholder="ইমেইল *" className="w-full rounded-[14px] bg-surface px-3.5 py-3.5 text-[15px] outline-none placeholder:text-label3" />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" inputMode="tel" placeholder="মোবাইল / WhatsApp * (+880…)" className="w-full rounded-[14px] bg-surface px-3.5 py-3.5 text-[15px] outline-none placeholder:text-label3" />
              <div className="grid grid-cols-2 gap-2.5">
                <select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full rounded-[14px] bg-surface px-3 py-3.5 text-[15px] outline-none">
                  {["Bangladesh","United Arab Emirates","Saudi Arabia","Qatar","Kuwait","Oman","Bahrain","Malaysia","Singapore","United Kingdom","Italy","Romania","Poland","Serbia","Moldova","Other"].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} className="w-full rounded-[14px] bg-surface px-3 py-3.5 text-[15px] outline-none">
                  {["Visa Consultant","Agency Owner","Recruitment Officer","Documentation Officer","Student","Other"].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <input value={agency} onChange={(e) => setAgency(e.target.value)} placeholder="এজেন্সি / কোম্পানির নাম (ঐচ্ছিক)" className="w-full rounded-[14px] bg-surface px-3.5 py-3.5 text-[15px] outline-none placeholder:text-label3" />
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর) *" className="w-full rounded-[14px] bg-surface px-3.5 py-3.5 text-[15px] outline-none placeholder:text-label3" />
            </div>
            <button
              onClick={() => setStage("terms")}
              disabled={!name.trim() || !email.includes("@") || phone.replace(/\D/g, "").length < 8 || password.length < 6}
              className="press mt-4 flex w-full items-center justify-center gap-1.5 rounded-[15px] bg-[#007aff] py-3.5 text-[15px] font-semibold text-white disabled:opacity-50"
            >
              চালিয়ে যান <ArrowRight size={16} />
            </button>
          </div>
        )}

        {stage === "terms" && (
          <div className="pop">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-[22px] font-bold tracking-tight">Terms & Conditions</div>
              <button onClick={termsPdf} className="press flex items-center gap-1 rounded-full bg-surface px-3 py-1.5 text-[12px] font-semibold text-[#007aff]">
                <Download size={12} /> PDF
              </button>
            </div>
            <div className="h-[46vh] overflow-y-auto rounded-[18px] bg-surface p-4 text-[13.5px] leading-relaxed text-label">
              {TERMS_MD.split("\n\n").map((block, i) => {
                if (block.startsWith("# ")) return <div key={i} className="mb-2 text-[16px] font-bold">{block.slice(2)}</div>;
                if (block.startsWith("## ")) return <div key={i} className="mt-3 mb-1 text-[14px] font-semibold">{block.slice(3)}</div>;
                return <p key={i} className="mb-2 text-label2">{block}</p>;
              })}
            </div>
            <button onClick={() => setStage("confirm")} className="press mt-4 flex w-full items-center justify-center gap-1.5 rounded-[15px] bg-[#007aff] py-3.5 text-[15px] font-semibold text-white">
              আমি শর্তাবলি পড়েছি
            </button>
          </div>
        )}

        {stage === "confirm" && (
          <div className="pop flex flex-col items-center text-center">
            <BrandMark size={64} />
            <div className="mt-7 min-h-[104px] px-2 text-[19px] font-semibold leading-relaxed tracking-tight">
              {typed}
              <span className="ml-0.5 inline-block h-[19px] w-[2px] translate-y-[3px] animate-pulse bg-[#007aff]" />
            </div>
            {typed.length >= CONFIRM_BN.length && (
              <div className="mt-6 flex w-full gap-2 pop">
                <button onClick={() => setStage("terms")} className="press flex-1 rounded-[14px] bg-surface py-3 text-[14.5px] font-semibold text-label">আবার পড়ব</button>
                <button onClick={finish} className="press flex flex-1 items-center justify-center gap-1.5 rounded-[14px] bg-[#007aff] py-3 text-[14.5px] font-semibold text-white">
                  <Check size={15} /> হ্যাঁ, পড়েছি
                </button>
              </div>
            )}
            {busy && <Loader2 className="mt-4 animate-spin text-label2" size={18} />}
          </div>
        )}
      </div>
    </div>
  );
}
