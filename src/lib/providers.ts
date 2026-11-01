import type { Provider } from "./store";

export interface ChatMsg { role: "system" | "user" | "assistant"; content: string }

const ENDPOINT: Record<Exclude<Provider, "gemini">, string> = {
  openai: "https://api.openai.com/v1/chat/completions",
  xai: "https://api.x.ai/v1/chat/completions",
  deepseek: "https://api.deepseek.com/chat/completions",
  mistral: "https://api.mistral.ai/v1/chat/completions",
};

interface Opts {
  provider: Provider; model: string; apiKey: string; messages: ChatMsg[];
  agentId?: string; temperature?: number; signal?: AbortSignal;
  proxy?: string | null;
  onToken?: (t: string) => void; onReasoning?: (t: string) => void;
}

async function doFetch(url: string, init: RequestInit, proxy?: string | null) {
  if (proxy) {
    return fetch(`${proxy.replace(/\/$/, "")}/proxy`, {
      method: "POST", signal: init.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, method: init.method, headers: init.headers, body: init.body }),
    });
  }
  return fetch(url, init);
}

async function readError(res: Response) {
  const txt = await res.text().catch(() => "");
  try {
    const j = JSON.parse(txt);
    const m = j?.error?.message || j?.message || j?.detail || j?.error || txt;
    return typeof m === "string" ? m : JSON.stringify(m);
  } catch { return txt || res.statusText; }
}

async function* sseLines(res: Response) {
  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split(/\r?\n/);
    buf = lines.pop() ?? "";
    for (const l of lines) if (l.startsWith("data:")) yield l.slice(5).trim();
  }
  if (buf.startsWith("data:")) yield buf.slice(5).trim();
}

export async function streamChat(o: Opts): Promise<string> {
  if (!o.apiKey) throw new Error(`NO_KEY:${o.provider}`);
  let full = "";
  // Merge consecutive same-role messages (required by Gemini, safer for all providers)
  o = { ...o, messages: o.messages.reduce<ChatMsg[]>((acc, m) => {
    const last = acc[acc.length - 1];
    if (last && last.role === m.role && m.role !== "system") last.content += "\n\n" + m.content; else acc.push({ ...m });
    return acc;
  }, []) };

  if (o.provider === "gemini") {
    const sys = o.messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
    const contents = o.messages.filter((m) => m.role !== "system").map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(o.model)}:streamGenerateContent?alt=sse&key=${encodeURIComponent(o.apiKey)}`;
    const res = await doFetch(url, {
      method: "POST", signal: o.signal, headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...(sys ? { systemInstruction: { parts: [{ text: sys }] } } : {}), contents, generationConfig: { temperature: o.temperature ?? 0.7 } }),
    }, o.proxy);
    if (!res.ok) throw new Error(`Gemini ${res.status}: ${await readError(res)}`);
    for await (const data of sseLines(res)) {
      try {
        const j = JSON.parse(data);
        const parts = j?.candidates?.[0]?.content?.parts ?? [];
        for (const p of parts) {
          if (p.thought && p.text) o.onReasoning?.(p.text);
          else if (p.text) { full += p.text; o.onToken?.(p.text); }
        }
      } catch { /* ignore */ }
    }
    return full;
  }

  const isAgent = o.provider === "mistral" && !!o.agentId?.trim();
  const url = isAgent ? "https://api.mistral.ai/v1/agents/completions" : ENDPOINT[o.provider];
  let messages = o.messages;
  if (isAgent) {
    // Agent has its own instructions; pass our context as a leading user note.
    const sys = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
    messages = messages.filter((m) => m.role !== "system");
    if (sys && messages[0]) messages = [{ role: "user", content: `[Context]\n${sys}\n\n[Message]\n${messages[0].content}` }, ...messages.slice(1)];
  }
  const reasoningModel = /^(o\d|gpt-5)/.test(o.model) || o.model === "deepseek-reasoner";
  const body: Record<string, unknown> = isAgent
    ? { agent_id: o.agentId!.trim(), messages, stream: true }
    : { model: o.model, messages, stream: true, ...(reasoningModel ? {} : { temperature: o.temperature ?? 0.7 }) };

  const res = await doFetch(url, {
    method: "POST", signal: o.signal,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${o.apiKey}` },
    body: JSON.stringify(body),
  }, o.proxy);
  if (!res.ok) throw new Error(`${o.provider} ${res.status}: ${await readError(res)}`);

  for await (const data of sseLines(res)) {
    if (data === "[DONE]") break;
    try {
      const j = JSON.parse(data);
      const d = j?.choices?.[0]?.delta ?? {};
      if (d.reasoning_content) o.onReasoning?.(d.reasoning_content);
      let c = d.content;
      if (Array.isArray(c)) c = c.map((x: any) => x?.text ?? "").join("");
      if (c) { full += c; o.onToken?.(c); }
    } catch { /* ignore */ }
  }
  return full;
}

/** Quick connectivity test for a key. */
export async function testKey(provider: Provider, apiKey: string, proxy?: string | null): Promise<string> {
  const model = { xai: "grok-3-mini", openai: "gpt-4o-mini", deepseek: "deepseek-chat", mistral: "mistral-small-latest", gemini: "gemini-2.5-flash" }[provider];
  const out = await streamChat({ provider, model, apiKey, proxy, messages: [{ role: "user", content: "Reply with exactly: OK" }] });
  return out.trim() || "OK";
}
