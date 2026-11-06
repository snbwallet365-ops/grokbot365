import type { Provider } from "./store";

/** Where each provider keeps its model catalogue + which ids are current. */
export const MODELS_API: Record<Provider, string> = {
  gemini: "https://generativelanguage.googleapis.com/v1beta/models",
  openai: "https://api.openai.com/v1/models",
  xai: "https://api.x.ai/v1/models",
  deepseek: "https://api.deepseek.com/models",
  mistral: "https://api.mistral.ai/v1/models",
};

/** Current-generation ids, newest first. Used as the default and as the rescue chain. */
export const LATEST: Record<Provider, string[]> = {
  gemini: ["gemini-3.8-flash", "gemini-3.7-flash", "gemini-4-argon", "gemini-2.5-flash"],
  openai: ["gpt-6.1-terra", "gpt-6.1-sol", "gpt-5.1", "gpt-4.1-mini", "gpt-4o-mini"],
  xai: ["grok-4.7", "grok-4.6", "grok-4.5", "grok-4"],
  deepseek: ["deepseek-v4-pro", "deepseek-v4.1-flash", "deepseek-chat"],
  mistral: ["mistral-large-4-0", "mistral-medium-3-5", "mistral-small-2603", "mistral-small-latest"],
};

const SKIP = /embed|whisper|tts|audio|image|dall|moderation|rerank|ocr|vision-preview|guard|aqa/i;

/** Real, account-specific model list straight from the provider. */
export async function listModels(provider: Provider, apiKey: string, proxy?: string | null): Promise<string[]> {
  if (!apiKey) return [];
  const base = MODELS_API[provider];
  const url = provider === "gemini" ? `${base}?key=${encodeURIComponent(apiKey)}&pageSize=200` : base;
  const proxyUrl = proxy ? `${proxy.replace(/\/$/, "")}/proxy` : null;
  const init: RequestInit = {
    method: "GET",
    headers: provider === "gemini" ? {} : { Authorization: `Bearer ${apiKey}` },
  };
  const res = await fetch(proxyUrl ?? url, proxyUrl ? {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, method: "GET", headers: init.headers }),
  } : init);
  if (!res.ok) throw new Error(`${provider} ${res.status}`);
  const json: any = await res.json();
  const rows: any[] = json?.data ?? json?.models ?? [];
  const ids: string[] = rows
    .map((m) => String(m.id ?? m.name ?? "").replace(/^models\//, ""))
    .filter((id) => !!id && !SKIP.test(id));
  // Gemini: only models that can actually generate content
  if (provider === "gemini") {
    const allowed = new Set<string>();
    for (const m of rows) {
      const methods = m.supportedGenerationMethods ?? m.supportedActions ?? [];
      if (!methods.length || methods.includes("generateContent") || methods.includes("streamGenerateContent")) {
        allowed.add(String(m.name ?? m.id ?? "").replace(/^models\//, ""));
      }
    }
    return ids.filter((id) => allowed.size === 0 || allowed.has(id));
  }
  return ids;
}

/** Best guess at the flagship id available to this account. */
export function pickBest(list: string[], provider: Provider, prefer?: string): string {
  if (prefer && list.includes(prefer)) return prefer;
  const ordered = LATEST[provider].filter((m) => list.includes(m));
  if (ordered.length) return ordered[0];
  const candidates = list.filter((id) => !/mini|small|nano|lite|flash-lite/i.test(id));
  const pool = candidates.length ? candidates : list;
  return pool[0] ?? LATEST[provider][0];
}

/** True when the error means “this model id is gone / not available”. */
export function isModelError(err: unknown): boolean {
  const m = String((err as Error)?.message ?? err ?? "");
  return /model|404|400|not found|unsupported|invalid/i.test(m) && !/quota|rate|credit|401|403|api key/i.test(m);
}
