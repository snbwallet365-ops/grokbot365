import { useStore, useRuntime, KNOWLEDGE, TOOL_INFO, PROVIDERS, uid, type Bot, type Step, type ToolName } from "./store";
import { streamChat, type ChatMsg } from "./providers";
import { makePdf, downloadUrl } from "./pdf";
import { countryBlock } from "./countries";
import { localAnswer } from "./localAnswer";

const S = () => useStore.getState();
const R = () => useRuntime.getState();

// ---------------- Local server ----------------
export async function checkServer(): Promise<boolean> {
  const url = S().settings.server.url;
  const local = /localhost|127\.0\.0\.1/.test(url);
  const runningLocally = /localhost|127\.0\.0\.1/.test(location.hostname);
  if (local && !runningLocally) {
    // never probe a device-local server from production: it only spams the console
    R().set({ serverOnline: false });
    return false;
  }
  try {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 1500);
    const r = await fetch(`${url.replace(/\/$/, "")}/health`, { signal: ctl.signal });
    clearTimeout(t);
    const ok = r.ok;
    R().set({ serverOnline: ok });
    return ok;
  } catch { R().set({ serverOnline: false }); return false; }
}
const server = () => S().settings.server.url.replace(/\/$/, "");
async function srv(path: string, body?: unknown) {
  const r = await fetch(server() + path, { method: body ? "POST" : "GET", headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json();
  if (!r.ok || j.error) throw new Error(j.error || r.statusText);
  return j;
}

// ---------------- Browser tools ----------------
const normUrl = (u: string) => (/^https?:\/\//i.test(u) ? u : "https://" + u.replace(/^\/+/, ""));
const shot = (u: string) => `https://image.thum.io/get/width/1280/crop/860/noanimate/${u}`;

function liveBrowser(bot: Bot, url: string, label: string, loading = true, screenshot?: string, title?: string) {
  R().set({ browser: { botId: bot.id, botName: bot.name, url, label, loading, screenshot: screenshot ?? R().browser?.screenshot, title } });
}

async function withLivePolling<T>(bot: Bot, url: string, label: string, fn: () => Promise<T>): Promise<T> {
  let stop = false;
  const poll = async () => {
    while (!stop) {
      try { const j = await srv("/browser/screenshot"); if (!stop && j.screenshot) liveBrowser(bot, j.url || url, label, true, j.screenshot, j.title); } catch { /* */ }
      await new Promise((r) => setTimeout(r, 650));
    }
  };
  poll();
  try { return await fn(); } finally { stop = true; }
}

async function browse(bot: Bot, rawUrl: string) {
  const url = normUrl(rawUrl);
  liveBrowser(bot, url, `Opening ${new URL(url).hostname}`, true);
  if (R().serverOnline) {
    const j = await withLivePolling(bot, url, "Loading page", () => srv("/browser/goto", { url }));
    liveBrowser(bot, j.url, "Reading page", false, j.screenshot, j.title);
    S().addSession({ botId: bot.id, url: j.url, title: j.title, screenshot: j.screenshot });
    return { text: `URL: ${j.url}\nTitle: ${j.title}\n\n${String(j.text).slice(0, 7000)}`, screenshot: j.screenshot as string, url: j.url as string, title: j.title as string };
  }
  const img = shot(url);
  liveBrowser(bot, url, "Loading page", true, img);
  const r = await fetch(`https://r.jina.ai/${url}`, { headers: { Accept: "text/plain" } });
  if (!r.ok) throw new Error(`Could not open page (${r.status})`);
  const text = await r.text();
  const title = text.match(/^Title:\s*(.*)$/m)?.[1] ?? new URL(url).hostname;
  liveBrowser(bot, url, "Reading page", false, img, title);
  S().addSession({ botId: bot.id, url, title, screenshot: img });
  return { text: text.slice(0, 7000), screenshot: img, url, title };
}

async function search(bot: Bot, query: string) {
  const ddg = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
  liveBrowser(bot, ddg, `Searching “${query}”`, true);
  if (R().serverOnline) {
    const j = await withLivePolling(bot, ddg, "Searching", () => srv("/browser/search", { query }));
    liveBrowser(bot, j.url, "Search results", false, j.screenshot, `${query} - Search`);
    const list = (j.results as { title: string; url: string; snippet: string }[]).map((x, i) => `${i + 1}. ${x.title}\n   ${x.url}\n   ${x.snippet}`).join("\n");
    return { text: list || "No results", screenshot: j.screenshot as string, url: j.url as string };
  }
  try {
    const target = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const r = await fetch(`https://r.jina.ai/${target}`, { headers: { Accept: "text/plain" } });
    if (r.ok) {
      const t = await r.text();
      if (t.length > 400 && !/captcha|anomaly/i.test(t)) {
        const img = shot(`https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`);
        liveBrowser(bot, ddg, "Search results", false, img, query);
        return { text: t.slice(0, 6000), screenshot: img, url: ddg };
      }
    }
  } catch { /* fallback */ }
  const w = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*&srlimit=8`).then((r) => r.json());
  const items = (w?.query?.search ?? []).map((x: any, i: number) => `${i + 1}. ${x.title}\n   https://en.wikipedia.org/wiki/${encodeURIComponent(x.title.replace(/ /g, "_"))}\n   ${String(x.snippet).replace(/<[^>]+>/g, "")}`).join("\n");
  const wurl = `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(query)}`;
  liveBrowser(bot, wurl, "Search results", false, shot(wurl), query);
  return { text: items || "No results found.", screenshot: shot(wurl), url: wurl };
}

// ---------------- Approvals ----------------
function requestApproval(stepId: string): Promise<boolean> {
  return new Promise((resolve) => R().set({ approvals: { ...R().approvals, [stepId]: resolve } }));
}

// ---------------- Brain retrieval ----------------
function retrieve(query: string, botId: string, n = 3) {
  const words = query.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
  if (!words.length) return [];
  return S().docs
    .filter((d) => !d.pinned)
    .filter((d) => d.source !== "Built-in" || !KNOWLEDGE[S().bots.find((b) => b.id === botId)?.knowledge ?? ""]?.includes(d.content.slice(0, 40)))
    .map((d) => { const hay = (d.title + " " + d.content).toLowerCase(); return { d, score: words.reduce((s, w) => s + (hay.includes(w) ? 1 : 0), 0) + (d.botId === botId ? 1 : 0) }; })
    .filter((x) => x.score >= Math.min(2, words.length)).sort((a, b) => b.score - a.score).slice(0, n).map((x) => x.d);
}

// ---------------- Prompt ----------------
const TOOL_SPECS: Record<ToolName, string> = {
  search: `search {"query": string} — web search, returns result titles, URLs and snippets`,
  browse: `browse {"url": string} — open a web page in the browser and read its text`,
  click: `click {"text": string} — click a link/button by visible text on the current page`,
  type: `type {"selector": string, "text": string, "submit": boolean} — type into an input (CSS selector or placeholder text)`,
  pdf: `pdf {"title": string, "markdown": string} — generate and download a PDF from full markdown content`,
  whatsapp: `whatsapp {"text": string, "phone"?: string} — send a message to the user's WhatsApp`,
  remember: `remember {"title": string, "content": string} — save an important fact to long-term memory (Brain)`,
  ask_bot: `ask_bot {"bot": string, "message": string} — delegate a sub-task to another bot by name and get its answer`,
};

function buildSystem(bot: Bot, query: string) {
  const s = S();
  const parts = [bot.system];
  if (bot.knowledge && KNOWLEDGE[bot.knowledge]) parts.push(KNOWLEDGE[bot.knowledge]);
  const cBlock = countryBlock(S().settings.country);
  if (cBlock) parts.push(cBlock);
  const mem = retrieve(query, bot.id);
  if (mem.length) parts.push("## Relevant memory from the Brain\n" + mem.map((d) => `### ${d.title}\n${d.content.slice(0, 1800)}`).join("\n\n"));
  if (bot.tools.length) {
    const peers = s.bots.filter((b) => b.id !== bot.id).map((b) => `${b.name} (${b.title})`).join(", ");
    parts.push(`## Tools
To use a tool, reply with ONE tool call block and nothing after it:
<tool>{"name":"TOOL_NAME","args":{...}}</tool>
You may write one short sentence before the block saying what you're doing. Available tools:
${bot.tools.map((t) => "- " + TOOL_SPECS[t]).join("\n")}
${bot.tools.includes("ask_bot") ? `Peer bots: ${peers}` : ""}
After each call you receive "TOOL_RESULT". Use as many steps as needed, then give your final answer in Markdown WITHOUT a tool block. Never fabricate tool results.`);
  }
  const pinned = s.docs.filter((d) => d.pinned);
  if (pinned.length) parts.push("## Always-remember memory (permanent user preferences & facts)\n" + pinned.map((d) => `- ${d.title}: ${d.content.slice(0, 600)}`).join("\n"));
  const lang = s.settings.language;
  if (lang === "bn") parts.push(`## LANGUAGE — mandatory, permanent preference
Always write your ENTIRE reply in natural, fluent, native Bangla (বাংলা, Bengali script) exactly as an educated native Bangladeshi speaker writes — warm, clear, never machine-translated. Keep code, URLs, file names, legal/visa codes (e.g. 214(b), V4.2(a), R179(b)), product names and widely used technical terms in their original form. Tool-call JSON stays in English. For documents that must be submitted in English (embassy cover letters, contracts for foreign parties) write the document in English and add a short Bangla explanation; otherwise documents and PDFs are in Bangla.`);
  else if (lang === "en") parts.push("## LANGUAGE\nAlways reply in English.");
  else parts.push("## LANGUAGE\nReply in the same language the user writes in.");
  if (s.settings.adaptive) parts.push(`## ANSWER DEPTH
Match the depth to the question. Short or simple question → short, direct answer (1–4 sentences). Long, detailed, multi-part or expert question → a long, thorough, well-structured answer: headings, numbered steps, examples, tables/checklists, and cover every part of the question. Never pad, never skip important detail.`);
  parts.push(`Current date/time: ${new Date().toString()}. User name: ${s.settings.userName}. Company/workspace: N Space. Format answers in clean Markdown.`);
  return parts.join("\n\n");
}

function parseTool(text: string): { name: ToolName; args: any; before: string } | null {
  const m = text.match(/<tool>\s*([\s\S]*?)\s*<\/tool>/) ?? text.match(/<tool>\s*(\{[\s\S]*\})\s*$/);
  if (!m) return null;
  try {
    const j = JSON.parse(m[1].replace(/^```(json)?|```$/g, ""));
    if (!j.name || !(j.name in TOOL_INFO)) return null;
    return { name: j.name, args: j.args ?? {}, before: text.slice(0, m.index).trim() };
  } catch { return null; }
}

export const visibleText = (t: string) => t.split("<tool>")[0];

function notify(title: string, body: string) {
  if (!S().settings.notifications || typeof Notification === "undefined" || Notification.permission !== "granted") return;
  if (!document.hidden) return;
  try { new Notification(title, { body: body.slice(0, 140), icon: "/icon-512.png" }); } catch { /* */ }
}

// ---------------- Main loop ----------------
export async function runBot(botId: string, userText: string, opt: { routine?: string; attachments?: { name: string; size: number; text: string }[]; activeBotId?: string } = {}) {
  const s = S();
  const bot0 = s.bots.find((b) => b.id === botId);
  if (!bot0 || R().live[botId]) return "";

  const attachText = (opt.attachments ?? []).map((a) => `\n\n[Attached file: ${a.name}]\n${a.text.slice(0, 20000)}`).join("");
  if (opt.routine) s.pushMsg(botId, { id: uid(), role: "note", content: `Routine ran · ${opt.routine}`, time: Date.now() });
  const history = (S().threads[botId] ?? []).filter((m) => m.role !== "note" && (m.content || m.role === "user")).slice(-30);
  s.pushMsg(botId, { id: uid(), role: "user", content: userText, time: Date.now(), attachments: opt.attachments?.map(({ name, size }) => ({ name, size })) });
  if (!opt.routine && /\b(remember|don't forget|always reply)\b|মনে রাখ|সবসময়/i.test(userText)) s.addDoc({ title: userText.replace(/\s+/g, " ").slice(0, 56), content: userText, source: "Auto-memory", botId, pinned: true });

  const mid = uid();
  s.pushMsg(botId, { id: mid, role: "assistant", content: "", steps: [], time: Date.now(), model: `${bot0.provider}/${bot0.agentId ? "agent" : bot0.model}` });
  const ctl = new AbortController();
  R().set({ live: { ...R().live, [botId]: mid }, controllers: { ...R().controllers, [botId]: ctl } });
  s.updateBot(botId, { status: "working", preview: opt.routine ? `Running routine: ${opt.routine}` : "Working…", updatedAt: Date.now() });

  const patch = (fn: (m: any) => any) => S().patchMsg(botId, mid, fn);
  const addStep = (st: Step) => patch((m) => ({ ...m, steps: [...(m.steps ?? []), st] }));
  const setStep = (id: string, p: Partial<Step>) => patch((m) => ({ ...m, steps: (m.steps ?? []).map((x: Step) => (x.id === id ? { ...x, ...p } : x)) }));

  const bot = S().bots.find((b) => b.id === botId)!;

  // No cloud key for this provider: answer from the built-in desk knowledge instead of failing.
  if (!String(S().settings.keys[bot.provider] ?? "").trim() && !bot.agentId) {
    const answer = localAnswer(bot, userText, S().settings.country);
    let shown = "";
    addStep({ id: uid(), tool: "local", label: "Built-in desk engine", detail: "no API key needed", status: "done" });
    for (const chunk of answer.match(/[\s\S]{1,28}/g) ?? []) {
      if (ctl.signal.aborted) break;
      shown += chunk;
      patch((m) => ({ ...m, content: shown, model: "built-in" }));
      await new Promise((r) => setTimeout(r, 12));
    }
    patch((m) => ({ ...m, content: shown, model: "built-in" }));
    S().updateBot(botId, { status: "done", preview: shown.replace(/[*_#]/g, "").slice(0, 70), updatedAt: Date.now() });
    R().showToast?.("বিল্ট-ইন ইঞ্জিনে উত্তর দেওয়া হয়েছে");
    const live = { ...R().live }; delete live[botId];
    R().set({ live, controllers: { ...R().controllers, [botId]: ctl } });
    return shown;
  }
  const msgs: ChatMsg[] = [
    { role: "system", content: buildSystem(bot, userText) },
    ...history.map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: visibleText(m.content) || "(no content)" }) as ChatMsg),
    { role: "user", content: userText + attachText },
  ];

  const startedAt = Date.now();
  let finalText = "";
  try {
    const maxSteps = Math.max(1, S().settings.maxSteps);
    for (let step = 0; step < maxSteps + 1; step++) {
      let buf = "", pending = "", reasoning = "";
      let timer: number | null = null;
      const flush = () => { timer = null; const t = buf; patch((m) => ({ ...m, content: t, reasoning: reasoning || m.reasoning })); };
      const key = S().settings.keys[bot.provider];
      const proxy = S().settings.server.useProxy && R().serverOnline ? S().settings.server.url : null;
      const out = await streamChat({
        provider: bot.provider, model: bot.model, apiKey: key, agentId: bot.provider === "mistral" ? bot.agentId : undefined,
        messages: msgs, temperature: S().settings.temperature, signal: ctl.signal, proxy,
        onToken: (t) => { buf += t; pending += t; if (!timer) timer = window.setTimeout(flush, 40); },
        onReasoning: (t) => { reasoning += t; if (!timer) timer = window.setTimeout(flush, 60); },
        onModelSwitch: (m) => { S().updateBot(bot.id, { model: m }); R().showToast?.(`${PROVIDERS[bot.provider].label}: model switched to ${m}`); },
      });
      if (timer) clearTimeout(timer);
      buf = out;
      const call = step < maxSteps ? parseTool(out) : null;
      if (!call || !bot.tools.includes(call.name)) { finalText = visibleText(out).trim() || out.trim(); patch((m) => ({ ...m, content: finalText, reasoning: reasoning || m.reasoning })); break; }

      // Tool call
      patch((m) => ({ ...m, content: "" }));
      msgs.push({ role: "assistant", content: out });
      const sid = uid();
      const a = call.args;
      const label = {
        search: `Searched “${a.query}”`, browse: `Opened ${String(a.url ?? "").replace(/^https?:\/\//, "").slice(0, 60)}`, click: `Clicked “${a.text}”`, type: `Typed into ${a.selector}`,
        pdf: `Generated PDF · ${a.title}`, whatsapp: "Sent to WhatsApp", remember: `Saved to Brain · ${a.title}`, ask_bot: `Asked ${a.bot}`,
      }[call.name];
      addStep({ id: sid, tool: call.name, label, note: call.before || undefined, status: "running" });
      let result = "";
      try {
        if ((call.name === "click" || call.name === "type") && S().settings.approvals) {
          setStep(sid, { status: "approval", detail: call.name === "type" ? `“${a.text}”` : undefined });
          s.updateBot(botId, { status: "waiting", preview: `Needs approval: ${label}` });
          const ok = await requestApproval(sid);
          s.updateBot(botId, { status: "working", preview: "Working…" });
          if (!ok) { setStep(sid, { status: "denied" }); msgs.push({ role: "user", content: `TOOL_RESULT ${call.name}: The user DENIED this action. Do not retry it; continue or explain.` }); continue; }
          setStep(sid, { status: "running" });
        }
        switch (call.name) {
          case "search": { const r = await search(bot, String(a.query ?? userText)); result = r.text; setStep(sid, { status: "done", screenshot: r.screenshot, url: r.url, detail: "Results read" }); break; }
          case "browse": { const r = await browse(bot, String(a.url)); result = r.text; setStep(sid, { status: "done", screenshot: r.screenshot, url: r.url, detail: r.title }); break; }
          case "click": case "type": {
            if (!R().serverOnline) throw new Error("Interactive browsing needs the local Playwright server (node server/index.mjs).");
            const cur = R().browser?.url ?? "";
            const j = await withLivePolling(bot, cur, call.name === "click" ? `Clicking “${a.text}”` : "Typing", () => srv(`/browser/${call.name}`, a));
            liveBrowser(bot, j.url, "Done", false, j.screenshot, j.title);
            result = `URL: ${j.url}\nTitle: ${j.title}\n\n${String(j.text).slice(0, 5000)}`;
            setStep(sid, { status: "done", screenshot: j.screenshot, url: j.url, detail: j.title }); break;
          }
          case "pdf": {
            const r = makePdf(String(a.title || "Document"), String(a.markdown || finalText || ""));
            downloadUrl(r.url, r.filename);
            result = `PDF "${r.filename}" generated (${Math.round(r.blob.size / 1024)} KB) and downloaded for the user.`;
            setStep(sid, { status: "done", detail: r.filename, link: r.url, linkLabel: "Download PDF" }); break;
          }
          case "whatsapp": {
            const w = S().settings.whatsapp; const text = String(a.text ?? ""); const phone = String(a.phone || w.phone || "").replace(/\D/g, "");
            if (w.token && w.phoneNumberId && phone) {
              if (S().settings.approvals) {
                setStep(sid, { status: "approval", detail: `To +${phone}: ${text.slice(0, 80)}…` });
                s.updateBot(botId, { status: "waiting", preview: "Needs approval: WhatsApp message" });
                const ok = await requestApproval(sid);
                s.updateBot(botId, { status: "working" });
                if (!ok) { setStep(sid, { status: "denied" }); msgs.push({ role: "user", content: "TOOL_RESULT whatsapp: user denied sending." }); continue; }
              }
              const r = await fetch(`https://graph.facebook.com/v21.0/${w.phoneNumberId}/messages`, { method: "POST", headers: { Authorization: `Bearer ${w.token}`, "Content-Type": "application/json" }, body: JSON.stringify({ messaging_product: "whatsapp", to: phone, type: "text", text: { body: text.slice(0, 4000) } }) });
              const j = await r.json(); if (!r.ok) throw new Error(j?.error?.message || "WhatsApp API error");
              result = "Message sent via WhatsApp Cloud API."; setStep(sid, { status: "done", detail: `+${phone}` });
            } else {
              const link = `https://wa.me/${phone}?text=${encodeURIComponent(text.slice(0, 3500))}`;
              result = "A one-tap WhatsApp link was prepared for the user to send."; setStep(sid, { status: "done", detail: phone ? `+${phone}` : "Choose contact", link, linkLabel: "Open WhatsApp" });
            }
            break;
          }
          case "remember": { S().addDoc({ title: String(a.title || "Memory"), content: String(a.content || ""), source: bot.name, botId }); result = "Saved to Brain."; setStep(sid, { status: "done" }); break; }
          case "ask_bot": {
            const peer = S().bots.find((b) => b.name.toLowerCase() === String(a.bot).toLowerCase()) ?? S().bots.find((b) => b.name.toLowerCase().includes(String(a.bot).toLowerCase()));
            if (!peer) throw new Error(`No bot named ${a.bot}`);
            S().pushMsg(peer.id, { id: uid(), role: "note", content: `${bot.name} asked: ${a.message}`, time: Date.now(), from: bot.name });
            S().updateBot(peer.id, { status: "working", preview: `Helping ${bot.name}…` });
            const ans = await streamChat({ provider: peer.provider, model: peer.model, agentId: peer.agentId, apiKey: S().settings.keys[peer.provider], signal: ctl.signal, proxy: S().settings.server.useProxy && R().serverOnline ? S().settings.server.url : null,
              messages: [{ role: "system", content: peer.system + "\n\n" + (KNOWLEDGE[peer.knowledge ?? ""] ?? "") + `\nYou are answering a request from peer bot ${bot.name}. Be concise.` }, { role: "user", content: String(a.message) }] });
            S().pushMsg(peer.id, { id: uid(), role: "assistant", content: ans, time: Date.now(), model: `${peer.provider}/${peer.model}` });
            S().updateBot(peer.id, { status: "done", preview: ans.slice(0, 70), updatedAt: Date.now() });
            result = ans; setStep(sid, { status: "done", detail: `${peer.name} replied` }); break;
          }
        }
      } catch (e: any) {
        if (ctl.signal.aborted) throw e;
        result = `ERROR: ${e?.message ?? e}`;
        setStep(sid, { status: "error", detail: String(e?.message ?? e).slice(0, 120) });
      }
      msgs.push({ role: "user", content: `TOOL_RESULT ${call.name}:\n${result.slice(0, 9000)}` });
    }
    const secs = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
    patch((m) => ({ ...m, content: finalText || m.content, time: Date.now(), reasoning: m.reasoning, model: `${m.model} · ${secs}s` }));
    const isActive = useRuntime.getState() && (window as any).__activeBot === botId && !document.hidden;
    S().updateBot(botId, { status: "done", preview: finalText.replace(/[#*`>|]/g, "").replace(/\s+/g, " ").slice(0, 90) || "Done", updatedAt: Date.now(), unread: isActive ? 0 : (S().bots.find((b) => b.id === botId)?.unread ?? 0) + 1 });
    notify(`${bot.name} finished`, finalText);
  } catch (e: any) {
    const aborted = ctl.signal.aborted;
    let err = String(e?.message ?? e);
    if (err === "Failed to fetch" || e?.name === "TypeError") err = `NETWORK:${bot.provider}`;
    patch((m) => ({ ...m, error: aborted ? undefined : err, content: m.content || (aborted ? "_Stopped._" : "") }));
    S().updateBot(botId, { status: aborted ? "idle" : "error", preview: aborted ? "Stopped" : err.startsWith("NO_KEY") ? "Add an API key to start" : "Something went wrong", updatedAt: Date.now() });
  } finally {
    const live = { ...R().live }; delete live[botId];
    const ctls = { ...R().controllers }; delete ctls[botId];
    R().set({ live, controllers: ctls });
    const b = R().browser; if (b && b.botId === botId) R().set({ browser: { ...b, loading: false, label: "Session ended" } });
  }
  return finalText;
}

export function stopBot(botId: string) { R().controllers[botId]?.abort(); }

/** Open a URL directly in the live browser (no LLM). */
export async function quickBrowse(url: string, botId?: string) {
  const bot = S().bots.find((b) => b.id === (botId ?? "browser")) ?? S().bots[0];
  R().set({ browserMin: false });
  try { await browse(bot, url); } catch (e: any) { R().showToast(e?.message ?? "Could not open page"); }
  const b = R().browser; if (b) R().set({ browser: { ...b, loading: false, label: "Opened by you" } });
}

export function resolveApproval(stepId: string, ok: boolean) {
  const fn = R().approvals[stepId];
  if (fn) { fn(ok); const a = { ...R().approvals }; delete a[stepId]; R().set({ approvals: a }); }
}

/** Human takeover of the real Playwright computer (local server). x/y are 0..1 relative coords. */
export async function takeover(action: "mouse" | "keys" | "scroll" | "back", args: Record<string, unknown> = {}) {
  if (!R().serverOnline) { R().showToast("Start the local server to control the computer"); return; }
  const b = R().browser;
  if (b) R().set({ browser: { ...b, loading: true, label: "You're in control" } });
  try {
    const j = await srv(`/browser/${action}`, args);
    const cur = R().browser;
    R().set({ browser: { botId: cur?.botId ?? "browser", botName: cur?.botName ?? "You", url: j.url, title: j.title, screenshot: j.screenshot, label: "You're in control", loading: false } });
  } catch (e: any) { R().showToast(e?.message ?? "Action failed"); const c = R().browser; if (c) R().set({ browser: { ...c, loading: false } }); }
}
