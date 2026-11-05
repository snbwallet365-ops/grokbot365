import { create } from "zustand";
import { persist } from "zustand/middleware";
import { VISA_KNOWLEDGE, LEGAL_KNOWLEDGE, PDF_KNOWLEDGE, GROK_HARNESS_KNOWLEDGE, BASE44_KNOWLEDGE, BROWSER_AGENT_KNOWLEDGE } from "./knowledge";

export type Provider = "xai" | "openai" | "deepseek" | "mistral" | "gemini";
export type BotStatus = "idle" | "working" | "waiting" | "done" | "error";
export type Shape = "circle" | "squircle" | "triangle" | "hex" | "diamond" | "blob" | "pill" | "star";
export type ToolName = "search" | "browse" | "click" | "type" | "pdf" | "whatsapp" | "remember" | "ask_bot";

export const PROVIDERS: Record<Provider, { label: string; color: string; models: string[]; keyUrl: string; keyHint: string }> = {
  xai: { label: "xAI", color: "#111111", models: ["grok-4", "grok-4-fast", "grok-3", "grok-3-mini", "grok-code-fast-1"], keyUrl: "https://console.x.ai", keyHint: "xai-…" },
  openai: { label: "OpenAI", color: "#10a37f", models: ["gpt-4o-mini", "gpt-4o", "gpt-4.1", "gpt-4.1-mini", "gpt-5", "gpt-5-mini", "o4-mini"], keyUrl: "https://platform.openai.com/api-keys", keyHint: "sk-…" },
  deepseek: { label: "DeepSeek", color: "#4d6bfe", models: ["deepseek-chat", "deepseek-reasoner"], keyUrl: "https://platform.deepseek.com/api_keys", keyHint: "sk-…" },
  mistral: { label: "Mistral", color: "#fa520f", models: ["mistral-large-latest", "mistral-medium-latest", "mistral-small-latest", "codestral-latest", "magistral-medium-latest"], keyUrl: "https://console.mistral.ai/api-keys", keyHint: "Mistral API key" },
  gemini: { label: "Google Gemini", color: "#1a73e8", models: ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash", "gemini-2.5-flash-lite"], keyUrl: "https://aistudio.google.com/apikey", keyHint: "AIza…" },
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
}

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
export { uid };

const DEFAULT_BOTS: Bot[] = [
  { id: "grok", name: "N Space", title: "Chief of Staff", shape: "circle", color: "#1c1c1e", provider: "xai", model: "grok-4", main: true,
    system: "You are Grok, the user's Chief of Staff bot at N Space. You coordinate other specialist bots, plan work, research, and get things done. Be proactive, smart and practical.",
    knowledge: "grok", tools: ["search", "browse", "remember", "pdf", "whatsapp", "ask_bot"], status: "idle", preview: "Ready to coordinate your team", updatedAt: Date.now() },
  { id: "browser", name: "Browser Agent", title: "Browser use · Playwright", shape: "squircle", color: "#007aff", provider: "openai", model: "gpt-4o-mini",
    system: "You are a browser-use agent. You navigate websites, read pages and complete web tasks step by step.",
    knowledge: "browser", tools: ["search", "browse", "click", "type", "remember"], status: "idle", preview: "Give me a web task", updatedAt: Date.now() - 1000 },
  { id: "visa", name: "Visa Expert", title: "Visa & refusal specialist", shape: "star", color: "#ff9500", provider: "gemini", model: "gemini-2.5-flash",
    system: "You are a senior visa consultant specialised in visa applications, refusal analysis, appeals and reapplication strategy for the US, UK, Schengen, Canada, Australia and more. Ask for the refusal letter wording, country, visa type and profile when missing. Produce clear action plans, checklists and cover letters.",
    knowledge: "visa", tools: ["search", "browse", "pdf", "remember", "whatsapp"], status: "idle", preview: "Analyse a visa refusal", updatedAt: Date.now() - 2000 },
  { id: "legal", name: "Legal Docs Expert", title: "Contracts & legal drafting", shape: "hex", color: "#5856d6", provider: "openai", model: "gpt-4o",
    system: "You are an expert legal drafter. You create complete, professional legal documents with numbered clauses, placeholders and signature blocks.",
    knowledge: "legal", tools: ["pdf", "search", "remember"], status: "idle", preview: "Draft an NDA, contract or affidavit", updatedAt: Date.now() - 3000 },
  { id: "pdf", name: "PDF Generator", title: "Documents → PDF", shape: "pill", color: "#ff3b30", provider: "deepseek", model: "deepseek-chat",
    system: "You are a PDF document expert. You write beautifully structured documents and export them as PDF.",
    knowledge: "pdf", tools: ["pdf"], status: "idle", preview: "Reports, CVs, invoices as PDF", updatedAt: Date.now() - 4000 },
  { id: "base44", name: "App Builder", title: "Base44-style app agent", shape: "diamond", color: "#34c759", provider: "openai", model: "gpt-4o",
    system: "You are an app-builder agent like Base44. You turn ideas into complete working web apps.",
    knowledge: "base44", tools: [], status: "idle", preview: "Describe an app — get it running", updatedAt: Date.now() - 5000 },
  { id: "mistral", name: "Mistral Agent", title: "Mistral Agents API", shape: "triangle", color: "#fa520f", provider: "mistral", model: "mistral-large-latest",
    system: "You are a helpful Mistral-powered agent.", tools: ["search", "browse", "remember"], status: "idle", preview: "Connect an agent_id or chat directly", updatedAt: Date.now() - 6000 },
  { id: "deepseek", name: "Researcher", title: "DeepSeek reasoning", shape: "blob", color: "#4d6bfe", provider: "deepseek", model: "deepseek-chat",
    system: "You are a meticulous research analyst. Search, read sources and produce cited, structured answers.",
    tools: ["search", "browse", "pdf", "remember"], status: "idle", preview: "Deep research with sources", updatedAt: Date.now() - 7000 },
];

const SEED_DOCS: BrainDoc[] = [
  { id: "k-lang", title: "ভাষা পছন্দ · Always reply in Bangla", content: "The user's permanent preference: every reply must be written in natural, fluent, native Bangla (বাংলা). Keep technical terms, code, URLs, visa codes and proper nouns in original form where natural.", source: "Built-in", createdAt: Date.now(), pinned: true },
  { id: "k-grok", title: "How Grok Bot works", content: GROK_HARNESS_KNOWLEDGE.trim(), source: "Built-in", createdAt: Date.now() },
  { id: "k-visa", title: "Visa refusal knowledge", content: VISA_KNOWLEDGE.trim(), source: "Built-in", createdAt: Date.now() },
  { id: "k-legal", title: "Legal drafting handbook", content: LEGAL_KNOWLEDGE.trim(), source: "Built-in", createdAt: Date.now() },
];

export const KNOWLEDGE: Record<string, string> = {
  grok: GROK_HARNESS_KNOWLEDGE, visa: VISA_KNOWLEDGE, legal: LEGAL_KNOWLEDGE, pdf: PDF_KNOWLEDGE, base44: BASE44_KNOWLEDGE, browser: BROWSER_AGENT_KNOWLEDGE,
};

interface State {
  bots: Bot[]; threads: Record<string, Message[]>; docs: BrainDoc[]; routines: Routine[]; sessions: BrowserSession[]; flows: Flow[]; settings: Settings;
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
  theme: "light", language: "bn", adaptive: true,
};

const initial = () => ({
  bots: DEFAULT_BOTS, threads: {} as Record<string, Message[]>, docs: SEED_DOCS, sessions: [] as BrowserSession[],
  routines: [
    { id: "r1", botId: "grok", name: "Morning briefing", prompt: "Give me a short morning briefing: top tech & world headlines today with sources.", everyMinutes: 1440, enabled: false },
    { id: "r2", botId: "visa", name: "Visa policy watch", prompt: "Search for the latest visa policy changes this week (US, UK, Schengen, Canada) and summarise.", everyMinutes: 10080, enabled: false },
  ] as Routine[],
  flows: [
    { id: "f1", name: "Visa research → PDF checklist", trigger: "manual", everyMinutes: 1440, output: "pdf", enabled: true, steps: [
      { id: "s1", botId: "deepseek", prompt: "Search the web for the latest official UK Standard Visitor visa requirements and fees for 2026. List the key facts with source URLs." },
      { id: "s2", botId: "visa", prompt: "Using the research below, write a complete, well-structured document checklist and approval tips for a UK visitor visa applicant from Bangladesh.\n\n{{previous}}" },
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
      addSession: (x) => set((s) => ({ sessions: [{ ...x, screenshot: x.screenshot?.startsWith("data:") ? undefined : x.screenshot, id: uid(), time: Date.now() }, ...s.sessions].slice(0, 60) })),
      clearSessions: () => set({ sessions: [] }),
      setSettings: (fn) => set((s) => ({ settings: fn(s.settings) })),
      importAll: (data) => set((s) => ({ ...s, ...data })),
      resetAll: () => set(initial()),
    }),
    {
      name: "grokbot-v2",
      version: 3,
      partialize: (s) => ({ bots: s.bots.map((b) => ({ ...b, status: b.status === "working" ? "idle" : b.status })), threads: s.threads, docs: s.docs, routines: s.routines, sessions: s.sessions, flows: s.flows, settings: s.settings }) as any,
      merge: (persisted: any, current) => {
        const p = persisted ?? {};
        const docs: BrainDoc[] = p.docs ?? current.docs;
        return {
          ...current, ...p,
          flows: p.flows ?? current.flows,
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
