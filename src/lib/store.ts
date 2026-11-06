import { create } from "zustand";
import { persist } from "zustand/middleware";
import { VISA_KNOWLEDGE, LEGAL_KNOWLEDGE, PDF_KNOWLEDGE, GROK_HARNESS_KNOWLEDGE, BASE44_KNOWLEDGE, BROWSER_AGENT_KNOWLEDGE } from "./knowledge";

export type Provider = "xai" | "openai" | "deepseek" | "mistral" | "gemini";
export type BotStatus = "idle" | "working" | "waiting" | "done" | "error";
export type Shape = "circle" | "squircle" | "triangle" | "hex" | "diamond" | "blob" | "pill" | "star";
export type ToolName = "search" | "browse" | "click" | "type" | "pdf" | "whatsapp" | "remember" | "ask_bot";

export const PROVIDERS: Record<Provider, { label: string; color: string; models: string[]; keyUrl: string; keyHint: string }> = {
  xai: { label: "xAI", color: "#111111", models: ["grok-4.7", "grok-4.6", "grok-4.5", "grok-4", "grok-build-0.1"], keyUrl: "https://console.x.ai", keyHint: "xai-…" },
  openai: { label: "OpenAI", color: "#10a37f", models: ["gpt-6.1-terra", "gpt-6.1-terra-pro", "gpt-6.1-sol", "gpt-5.1", "gpt-5", "gpt-4.1-mini", "gpt-4o-mini"], keyUrl: "https://platform.openai.com/api-keys", keyHint: "sk-…" },
  deepseek: { label: "DeepSeek", color: "#4d6bfe", models: ["deepseek-v4-pro", "deepseek-v4.1-flash", "deepseek-v4-flash", "deepseek-chat"], keyUrl: "https://platform.deepseek.com/api_keys", keyHint: "sk-…" },
  mistral: { label: "Mistral", color: "#fa520f", models: ["mistral-large-4-0", "mistral-medium-3-5", "mistral-small-2603", "mistral-large-latest"], keyUrl: "https://console.mistral.ai/api-keys", keyHint: "Mistral API key" },
  gemini: { label: "Google Gemini", color: "#1a73e8", models: ["gemini-3.8-flash", "gemini-3.7-flash", "gemini-4-argon", "gemini-2.5-flash", "gemini-2.5-pro"], keyUrl: "https://aistudio.google.com/apikey", keyHint: "AIza…" },
};

export const TOOL_INFO: Record<ToolName, { label: string; desc: string }> = {
  search: { label: "Web search", desc: "Search the web for current information" },
  browse: { label: "Browser", desc: "Open pages with live preview" },
  click: { label: "Click", desc: "Click elements (local Playwright server)" },
  type: { label: "Type", desc: "Type into inputs (local Playwright server)" },
  pdf: { label: "PDF generator", desc: "Create & download PDF documents" },
  whatsapp: { label: "WhatsApp", desc: "Send results to WhatsApp" },
  remember: { label: "Memory", desc: "Save facts into the Brain" },
  ask_bot: { label: "Ask another Bot", desc: "Delegate to a peer Bot" },
};

export interface Bot {
  id: string; name: string; title: string; shape: Shape; color: string;
  provider: Provider; model: string; agentId?: string;
  system: string; knowledge?: string; tools: ToolName[];
  status: BotStatus; preview: string; updatedAt: number; unread?: number; main?: boolean;
}

export interface Step {
  id: string; tool: string; label: string; detail?: string; note?: string;
  status: "running" | "done" | "error" | "approval" | "denied";
  screenshot?: string; url?: string; link?: string; linkLabel?: string;
}

export interface Message {
  id: string; role: "user" | "assistant" | "note";
  content: string; reasoning?: string; steps?: Step[]; time: number;
  error?: string; model?: string; from?: string; attachments?: { name: string; size: number }[];
}

export interface BrainDoc { id: string; title: string; content: string; source: string; createdAt: number; botId?: string; pinned?: boolean }
export interface CaseFile {
  id: string;
  title: string;
  kind: "visa" | "recruit" | "docs";
  country: string;
  applicant: string;
  status: "new" | "working" | "filed" | "approved" | "onhold";
  fileName?: string;
  note?: string;
  updatedAt: number;
}

export interface Routine { id: string; botId: string; name: string; prompt: string; everyMinutes: number; enabled: boolean; lastRun?: number }
export interface BrowserSession { id: string; botId: string; url: string; title: string; screenshot?: string; time: number }
export type FlowOutput = "none" | "pdf" | "whatsapp" | "brain";
export interface FlowStep { id: string; botId: string; prompt: string }
export interface Flow { id: string; name: string; trigger: "manual" | "schedule"; everyMinutes: number; steps: FlowStep[]; output: FlowOutput; enabled: boolean; lastRun?: number }

export interface Settings {
  keys: Record<Provider, string>;
  whatsapp: { phone: string; token: string; phoneNumberId: string; connected: boolean };
  server: { url: string; useProxy: boolean };
  approvals: boolean; notifications: boolean; maxSteps: number; temperature: number;
  userName: string;
  theme: "light" | "dark"; language: "bn" | "en" | "auto"; adaptive: boolean;
  connectors?: Record<string, { key: string; account?: string; status: "connected" | "saved"; at: number }>;
  country?: string;
}

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
export { uid };

const DEFAULT_BOTS: Bot[] = [
  { id: "grok", name: "N Space", title: "Main agent · Visa & recruitment desk", shape: "circle", color: "#0a84ff", provider: "gemini", model: "gemini-3.8-flash", main: true,
    system: "You are N Space, the user's main agent for a visa and global recruitment consultancy. You run the desk: understand the case, ask only for missing facts, then hand the work to the right agent (Visa Filing, Global Recruitment, Documentation) with a clear brief. Answer in native Bangla by default. Be practical: give steps, documents, fees, timelines and the next action. When a country is selected, follow that country's rules first and name the official portal.",
    knowledge: "grok", tools: ["search", "browse", "remember", "pdf", "whatsapp", "ask_bot"], status: "idle", preview: "কেস দিয়ে শুরু করুন", updatedAt: Date.now() },
  { id: "browser", name: "Visa Filing", title: "Applications, portals & forms", shape: "squircle", color: "#007aff", provider: "gemini", model: "gemini-3.8-flash",
    system: "You are the Visa Filing agent. You take a completed applicant file and drive the actual application: choose the correct visa category, open the official portal, fill every field, list required uploads, prepare the appointment and payment steps, then track the submission. For each step output: action, exact field values, and what evidence backs the answer. Flag anything that must be confirmed on the official portal. Reply in Bangla.",
    knowledge: "visa", tools: ["search", "browse", "click", "type", "pdf", "remember", "whatsapp"], status: "idle", preview: "পাসপোর্ট থেকে আবেদন শুরু করুন", updatedAt: Date.now() - 1000 },
  { id: "visa", name: "Global Recruitment", title: "Employers, vacancies & candidates", shape: "star", color: "#ff9500", provider: "gemini", model: "gemini-3.8-flash",
    system: "You are the Global Recruitment agent for an overseas manpower agency. You collect employer demand (country, trade, salary, contract length, quota), match it to candidate profiles, produce shortlists with fit scores, prepare CVs in employer format, draft employment offers and contracts, and track every candidate stage from sourcing to visa. Reply in Bangla with short tables or numbered steps.",
    knowledge: "recruit", tools: ["search", "pdf", "remember", "whatsapp", "ask_bot"], status: "idle", preview: "চাহিদা বা প্রার্থী দিন", updatedAt: Date.now() - 2000 },
  { id: "docs", name: "Documentation", title: "Passport, attestation & PDF packs", shape: "hex", color: "#5856d6", provider: "gemini", model: "gemini-3.8-flash",
    system: "You are the Documentation agent. You read passport and supporting documents, extract fields accurately, check validity and consistency, list what is missing, prepare translations, affidavits, cover letters and attestation/MOFA steps, then build one complete PDF pack per applicant. Every extracted field must name its source. Never invent a document number. Reply in Bangla.",
    knowledge: "docs", tools: ["pdf", "search", "remember", "whatsapp"], status: "idle", preview: "ফাইল দিন, প্যাকেট নিন", updatedAt: Date.now() - 3000 },
];

const SEED_DOCS: BrainDoc[] = [
  { id: "k-lang", title: "ভাষা পছন্দ · Always reply in Bangla", content: "The user's permanent preference: every reply must be written in natural, fluent, native Bangla (বাংলা). Keep technical terms, code, URLs, visa codes and proper nouns in original form where natural.", source: "Built-in", createdAt: Date.now(), pinned: true },
  { id: "k-grok", title: "How Grok Bot works", content: GROK_HARNESS_KNOWLEDGE.trim(), source: "Built-in", createdAt: Date.now() },
  { id: "k-visa", title: "Visa refusal knowledge", content: VISA_KNOWLEDGE.trim(), source: "Built-in", createdAt: Date.now() },
  { id: "k-legal", title: "Legal drafting handbook", content: LEGAL_KNOWLEDGE.trim(), source: "Built-in", createdAt: Date.now() },
];

export const RECRUIT_KNOWLEDGE = `Global recruitment desk rules:
- A case needs: employer, country, trade, salary, duty hours, contract length, accommodation, food, quota and licence number.
- Shortlist with fit score 0-100 based on trade match, experience years, language, age band and passport validity.
- Standard documents: passport, photo, CV in employer format, experience certificate, skill certificate, medical, police clearance, employer demand letter, power of attorney, agency licence.
- Compliance: never promise a visa; state that selection depends on employer and embassy; record every fee disclosure.
- Track stages: sourced → screened → interview → selected → medical → visa filed → visa approved → flying.`;

export const DOCS_KNOWLEDGE = `Documentation desk rules:
- Extract passport fields exactly: surname, given names, number, nationality, date of birth, sex, place of birth, issue date, expiry date, MRZ lines.
- Validate: passport validity at least 6 months beyond travel, name spelling identical across documents, photo meets biometric spec, MRZ readable.
- Standard pack order: application form, passport bio page, photo, bank statement, employment or business proof, invitation/offer, insurance, accommodation, itinerary, cover letter, checklist.
- Attestation chain for Bangladesh: notary → ministry of foreign affairs → destination embassy. Say clearly which step is pending.
- Output one PDF per applicant, named NAME_COUNTRY_TYPE_DATE.`;

export const KNOWLEDGE: Record<string, string> = {
  grok: GROK_HARNESS_KNOWLEDGE, visa: VISA_KNOWLEDGE, legal: LEGAL_KNOWLEDGE, pdf: PDF_KNOWLEDGE, base44: BASE44_KNOWLEDGE, browser: BROWSER_AGENT_KNOWLEDGE,
  recruit: RECRUIT_KNOWLEDGE, docs: DOCS_KNOWLEDGE,
};

interface State {
  bots: Bot[]; threads: Record<string, Message[]>; docs: BrainDoc[]; routines: Routine[]; sessions: BrowserSession[]; flows: Flow[]; settings: Settings; cases: CaseFile[];
  addCase: (c: Omit<CaseFile, "id" | "updatedAt">) => string; updateCase: (id: string, p: Partial<CaseFile>) => void; removeCase: (id: string) => void;
  addBot: (b: Partial<Bot>) => string; updateBot: (id: string, p: Partial<Bot>) => void; removeBot: (id: string) => void;
  pushMsg: (botId: string, m: Message) => void; patchMsg: (botId: string, id: string, fn: (m: Message) => Message) => void; clearThread: (botId: string) => void;
  addDoc: (d: Omit<BrainDoc, "id" | "createdAt">) => void; updateDoc: (id: string, p: Partial<BrainDoc>) => void; removeDoc: (id: string) => void;
  addRoutine: (r: Omit<Routine, "id">) => void; updateRoutine: (id: string, p: Partial<Routine>) => void; removeRoutine: (id: string) => void;
  addFlow: (f: Omit<Flow, "id">) => string; updateFlow: (id: string, p: Partial<Flow>) => void; removeFlow: (id: string) => void;
  addSession: (s: Omit<BrowserSession, "id" | "time">) => void; clearSessions: () => void;
  setSettings: (fn: (s: Settings) => Settings) => void;
  importAll: (data: Partial<State>) => void; resetAll: () => void;
}

const DEFAULT_SETTINGS: Settings = {
  keys: { xai: "", openai: "", deepseek: "", mistral: "", gemini: "" },
  whatsapp: { phone: "", token: "", phoneNumberId: "", connected: false },
  server: { url: "http://localhost:8787", useProxy: false },
  connectors: {},
  approvals: true, notifications: false, maxSteps: 6, temperature: 0.7, userName: "You",
  theme: "light", language: "bn", adaptive: true, country: "RS",
};

const initial = () => ({
  bots: DEFAULT_BOTS, threads: {} as Record<string, Message[]>, docs: SEED_DOCS, sessions: [] as BrowserSession[], cases: [] as CaseFile[],
  routines: [
    { id: "r1", botId: "grok", name: "Morning briefing", prompt: "Give me a short morning briefing: top tech & world headlines today with sources.", everyMinutes: 1440, enabled: false },
    { id: "r2", botId: "visa", name: "Visa policy watch", prompt: "Search for the latest visa policy changes this week for our active countries and summarise.", everyMinutes: 10080, enabled: false },
  ] as Routine[],
  flows: [
    { id: "f1", name: "Visa research → PDF checklist", trigger: "manual", everyMinutes: 1440, output: "pdf", enabled: true, steps: [
      { id: "s1", botId: "grok", prompt: "Search the web for the latest official visa requirements and fees for our active country. List the key facts with source URLs." },
      { id: "s2", botId: "docs", prompt: "Using the research below, write a complete document checklist and the PDF pack order for this applicant.\n\n{{previous}}" },
    ] },
    { id: "f2", name: "Daily AI news → Brain", trigger: "schedule", everyMinutes: 1440, output: "brain", enabled: false, steps: [
      { id: "s1", botId: "grok", prompt: "Search today's most important AI agent news and summarise the top 5 items with links." },
    ] },
  ] as Flow[],
  settings: DEFAULT_SETTINGS,
});

export const useStore = create<State>()(
  persist(
    (set) => ({
      ...initial(),
      addBot: (b) => {
        const id = uid();
        set((s) => ({ bots: [{ id, name: "New Bot", title: "Teammate", shape: "blob", color: "#007aff", provider: "openai", model: "gpt-4o-mini", system: "You are a helpful AI teammate.", tools: ["search", "browse", "remember"], status: "idle", preview: "Ready when you are", updatedAt: Date.now(), ...b } as Bot, ...s.bots] }));
        return id;
      },
      updateBot: (id, p) => set((s) => ({ bots: s.bots.map((b) => (b.id === id ? { ...b, ...p } : b)) })),
      removeBot: (id) => set((s) => { const t = { ...s.threads }; delete t[id]; return { bots: s.bots.filter((b) => b.id !== id), threads: t, routines: s.routines.filter((r) => r.botId !== id) }; }),
      pushMsg: (botId, m) => set((s) => ({ threads: { ...s.threads, [botId]: [...(s.threads[botId] ?? []), m] } })),
      patchMsg: (botId, id, fn) => set((s) => ({ threads: { ...s.threads, [botId]: (s.threads[botId] ?? []).map((m) => (m.id === id ? fn(m) : m)) } })),
      clearThread: (botId) => set((s) => ({ threads: { ...s.threads, [botId]: [] } })),
      addDoc: (d) => set((s) => ({ docs: [{ ...d, id: uid(), createdAt: Date.now() }, ...s.docs] })),
      updateDoc: (id, p) => set((s) => ({ docs: s.docs.map((d) => (d.id === id ? { ...d, ...p } : d)) })),
      removeDoc: (id) => set((s) => ({ docs: s.docs.filter((d) => d.id !== id) })),
      addRoutine: (r) => set((s) => ({ routines: [...s.routines, { ...r, id: uid() }] })),
      updateRoutine: (id, p) => set((s) => ({ routines: s.routines.map((r) => (r.id === id ? { ...r, ...p } : r)) })),
      removeRoutine: (id) => set((s) => ({ routines: s.routines.filter((r) => r.id !== id) })),
      addFlow: (f) => { const id = uid(); set((s) => ({ flows: [...s.flows, { ...f, id }] })); return id; },
      updateFlow: (id, p) => set((s) => ({ flows: s.flows.map((f) => (f.id === id ? { ...f, ...p } : f)) })),
      removeFlow: (id) => set((s) => ({ flows: s.flows.filter((f) => f.id !== id) })),
      addCase: (c) => { const id = uid(); set((s) => ({ cases: [{ ...c, id, updatedAt: Date.now() }, ...s.cases].slice(0, 300) })); return id; },
      updateCase: (id, p) => set((s) => ({ cases: s.cases.map((c) => (c.id === id ? { ...c, ...p, updatedAt: Date.now() } : c)) })),
      removeCase: (id) => set((s) => ({ cases: s.cases.filter((c) => c.id !== id) })),
      addSession: (x) => set((s) => ({ sessions: [{ ...x, screenshot: x.screenshot?.startsWith("data:") ? undefined : x.screenshot, id: uid(), time: Date.now() }, ...s.sessions].slice(0, 60) })),
      clearSessions: () => set({ sessions: [] }),
      setSettings: (fn) => set((s) => ({ settings: fn(s.settings) })),
      importAll: (data) => set((s) => ({ ...s, ...data })),
      resetAll: () => set(initial()),
    }),
    {
      name: "grokbot-v2",
      version: 3,
      partialize: (s) => ({ cases: s.cases, bots: s.bots.map((b) => ({ ...b, status: b.status === "working" ? "idle" : b.status })), threads: s.threads, docs: s.docs, routines: s.routines, sessions: s.sessions, flows: s.flows, settings: s.settings }) as any,
      merge: (persisted: any, current) => {
        const p = persisted ?? {};
        const docs: BrainDoc[] = p.docs ?? current.docs;
        return {
          ...current, ...p,
          flows: p.flows ?? current.flows,
          cases: p.cases ?? current.cases,
          docs: docs.some((d) => d.id === "k-lang") ? docs : [SEED_DOCS[0], ...docs],
          settings: { ...DEFAULT_SETTINGS, ...(p.settings ?? {}), connectors: { ...(p.settings?.connectors ?? {}) }, keys: { ...DEFAULT_SETTINGS.keys, ...(p.settings?.keys ?? {}) }, whatsapp: { ...DEFAULT_SETTINGS.whatsapp, ...(p.settings?.whatsapp ?? {}) }, server: { ...DEFAULT_SETTINGS.server, ...(p.settings?.server ?? {}) } },
        };
      },
      migrate: (s: any) => s,
    },
  ),
);

// ---------- Runtime (non-persisted) ----------
export interface LiveBrowser { botId: string; botName: string; url: string; title?: string; screenshot?: string; label: string; loading: boolean }
export type RunState = "idle" | "running" | "done" | "error";
export interface FlowRun { running: boolean; active: number; status: RunState[]; outputs: string[]; output: RunState; link?: string; linkLabel?: string; error?: string; finishedAt?: number }
export type RightTab = "computer" | "activity" | "files";
interface Runtime {
  live: Record<string, string | null>;
  controllers: Record<string, AbortController>;
  browser: LiveBrowser | null; browserMin: boolean;
  approvals: Record<string, (ok: boolean) => void>;
  serverOnline: boolean;
  toast: string | null;
  drawer: boolean; rightOpen: boolean; rightTab: RightTab;
  flowRuns: Record<string, FlowRun>;
  set: (p: Partial<Runtime>) => void;
  showToast: (t: string) => void;
}
export const useRuntime = create<Runtime>()((set) => ({
  live: {}, controllers: {}, browser: null, browserMin: false, approvals: {}, serverOnline: false, toast: null,
  drawer: false, rightOpen: false, rightTab: "computer", flowRuns: {},
  set: (p) => set(p),
  showToast: (t) => { set({ toast: t }); setTimeout(() => set((s) => (s.toast === t ? { toast: null } : s)), 2600); },
}));
