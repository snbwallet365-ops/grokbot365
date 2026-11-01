import { useEffect, useState } from "react";
import { useStore, PROVIDERS, TOOL_INFO, type Bot, type Provider, type Shape, type ToolName } from "../lib/store";
import BotAvatar from "./BotAvatar";
import { Sheet, Group, Row, Toggle, Field, inputCls } from "./ui";
import { cn } from "../utils/cn";

const SHAPES: Shape[] = ["circle", "squircle", "triangle", "hex", "diamond", "blob", "pill", "star"];
const COLORS = ["#1c1c1e", "#007aff", "#34c759", "#ff9500", "#ff3b30", "#5856d6", "#af52de", "#ff2d55", "#00c7be", "#fa520f", "#4d6bfe", "#a2845e"];
const KNOW = [["", "None"], ["grok", "Grok Bot harness"], ["visa", "Visa & refusals"], ["legal", "Legal drafting"], ["pdf", "PDF documents"], ["base44", "App builder (Base44)"], ["browser", "Browser-use"]] as const;
const TEMPLATES: Partial<Bot>[] = [
  { name: "Inbox Manager", title: "Email triage", shape: "squircle", color: "#00c7be", system: "You triage email, draft replies and summarise threads.", tools: ["search", "remember", "whatsapp"] },
  { name: "Visa Rejection Analyst", title: "Refusal → approval plan", shape: "star", color: "#ff9500", provider: "gemini", model: "gemini-2.5-pro", knowledge: "visa", system: "You analyse visa refusal letters line by line and build approval-focused reapplication or appeal strategies.", tools: ["search", "browse", "pdf", "remember"] },
  { name: "Contract Reviewer", title: "Risk & clause review", shape: "hex", color: "#5856d6", knowledge: "legal", system: "You review contracts, flag risky clauses, and suggest redlines.", tools: ["pdf", "search"] },
  { name: "Web Scraper", title: "Playwright agent", shape: "squircle", color: "#007aff", knowledge: "browser", system: "You extract structured data from websites.", tools: ["browse", "search", "click", "type"] },
  { name: "Mistral Agent", title: "Agents API", shape: "triangle", color: "#fa520f", provider: "mistral", model: "mistral-large-latest", system: "You are a Mistral agent.", tools: ["search", "browse"] },
];

export default function BotEditor({ botId, open, onClose, onCreated }: { botId: string | null; open: boolean; onClose: () => void; onCreated?: (id: string) => void }) {
  const existing = useStore((s) => s.bots.find((b) => b.id === botId));
  const { addBot, updateBot, removeBot, clearThread } = useStore.getState();
  const [d, setD] = useState<Partial<Bot>>({});

  useEffect(() => {
    if (open) setD(existing ? { ...existing } : { name: "", title: "", shape: "blob", color: "#007aff", provider: "openai", model: "gpt-4o-mini", system: "You are a helpful AI teammate. Be concise and practical.", tools: ["search", "browse", "remember"], knowledge: "" });
  }, [open, botId]);

  const up = (p: Partial<Bot>) => setD((x) => ({ ...x, ...p }));
  const save = () => {
    if (!d.name?.trim()) return;
    const clean = { ...d, name: d.name.trim(), title: d.title?.trim() || "Teammate" };
    if (existing) updateBot(existing.id, clean);
    else { const id = addBot(clean); onCreated?.(id); }
    onClose();
  };
  const tools = (d.tools ?? []) as ToolName[];
  const prov = (d.provider ?? "openai") as Provider;

  return (
    <Sheet open={open} onClose={onClose} title={existing ? "Edit Bot" : "New Bot"} size="lg"
      right={<button disabled={!d.name?.trim()} onClick={save} className="text-[17px] font-semibold text-[#007aff] disabled:text-label3">{existing ? "Done" : "Create"}</button>}>
      <div className="px-4 pb-10 md:px-6">
        <div className="flex flex-col items-center pt-2 pb-5">
          <BotAvatar shape={d.shape ?? "blob"} color={d.color ?? "#007aff"} status="idle" size={88} />
          <div className="no-scrollbar mt-4 flex max-w-full gap-1.5 overflow-x-auto px-2">
            {SHAPES.map((s) => (
              <button key={s} onClick={() => up({ shape: s })} className={cn("press shrink-0 rounded-xl p-1.5", d.shape === s ? "bg-surface shadow-sm ring-2 ring-[#007aff]" : "")}>
                <BotAvatar shape={s} color={d.color ?? "#007aff"} status="idle" size={30} ring={false} />
              </button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {COLORS.map((c) => <button key={c} onClick={() => up({ color: c })} className={cn("press h-7 w-7 rounded-full", d.color === c && "ring-2 ring-[#007aff] ring-offset-2 ring-offset-grouped")} style={{ background: c }} />)}
          </div>
        </div>

        {!existing && (
          <div className="mb-6">
            <div className="mb-1.5 px-4 text-[13px] uppercase text-label2">Templates</div>
            <div className="no-scrollbar flex gap-2 overflow-x-auto px-1">
              {TEMPLATES.map((t) => (
                <button key={t.name} onClick={() => up({ ...t })} className="press flex shrink-0 items-center gap-2 rounded-full bg-surface py-1.5 pr-3.5 pl-1.5 text-[14px] shadow-sm">
                  <BotAvatar shape={t.shape!} color={t.color!} status="idle" size={24} ring={false} />{t.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <Group>
          <Field label="Name"><input value={d.name ?? ""} onChange={(e) => up({ name: e.target.value })} placeholder="e.g. Visa Expert" className={inputCls} /></Field>
          <Field label="Job"><input value={d.title ?? ""} onChange={(e) => up({ title: e.target.value })} placeholder="What does this Bot own?" className={inputCls} /></Field>
        </Group>

        <Group header="AI Provider" footer={prov === "mistral" ? "Optional: paste a Mistral Agent ID (ag_…) to use the Agents API with your pre-configured agent, model & tools." : undefined}>
          <div className="grid grid-cols-2 gap-1.5 p-2 sm:grid-cols-5">
            {(Object.keys(PROVIDERS) as Provider[]).map((p) => (
              <button key={p} onClick={() => up({ provider: p, model: PROVIDERS[p].models[0] })} className={cn("press rounded-xl px-2 py-2.5 text-[13px] font-semibold", prov === p ? "bg-[#007aff] text-white" : "bg-grouped text-label")}>{PROVIDERS[p].label.replace(" · xAI", "")}</button>
            ))}
          </div>
          <Field label="Model">
            <div className="flex items-center gap-2">
              <select value={PROVIDERS[prov].models.includes(d.model ?? "") ? d.model : "__custom"} onChange={(e) => e.target.value !== "__custom" && up({ model: e.target.value })} className="w-full bg-transparent text-[16px] text-[#007aff] outline-none">
                {PROVIDERS[prov].models.map((m) => <option key={m} value={m}>{m}</option>)}
                <option value="__custom">Custom…</option>
              </select>
            </div>
          </Field>
          <Field label="Custom ID"><input value={d.model ?? ""} onChange={(e) => up({ model: e.target.value })} placeholder="model id" className={inputCls} /></Field>
          {prov === "mistral" && <Field label="Agent ID"><input value={d.agentId ?? ""} onChange={(e) => up({ agentId: e.target.value })} placeholder="ag_… (optional)" className={inputCls} /></Field>}
        </Group>

        <Group header="Knowledge & instructions">
          <Field label="Knowledge">
            <select value={d.knowledge ?? ""} onChange={(e) => up({ knowledge: e.target.value })} className="w-full bg-transparent text-[16px] text-[#007aff] outline-none">
              {KNOW.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
          <div className="px-4 py-2">
            <textarea value={d.system ?? ""} onChange={(e) => up({ system: e.target.value })} rows={5} placeholder="System instructions" className="w-full resize-y bg-transparent text-[15px] leading-relaxed outline-none placeholder:text-label3" />
          </div>
        </Group>

        <Group header="Tools" footer="Click and type need the local Playwright server. Sensitive actions ask for approval.">
          {(Object.keys(TOOL_INFO) as ToolName[]).map((t) => (
            <Row key={t} title={TOOL_INFO[t].label} subtitle={TOOL_INFO[t].desc}
              right={<Toggle on={tools.includes(t)} onChange={(v) => up({ tools: v ? [...tools, t] : tools.filter((x) => x !== t) })} />} />
          ))}
        </Group>

        {existing && (
          <Group>
            <Row title="Set as main Bot" right={<Toggle on={!!d.main} onChange={(v) => up({ main: v })} />} />
            <Row title="Clear conversation" onClick={() => { if (confirm("Clear all messages?")) { clearThread(existing.id); onClose(); } }} danger />
            <Row title="Delete Bot" onClick={() => { if (confirm(`Delete ${existing.name}?`)) { removeBot(existing.id); onClose(); } }} danger />
          </Group>
        )}
      </div>
    </Sheet>
  );
}
