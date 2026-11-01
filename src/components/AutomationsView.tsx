import { useState } from "react";
import { Plus, Play, Zap, Clock, FileDown, MessageCircle, Brain, CircleSlash, Trash2, ChevronUp, ChevronDown, Loader2, Check, AlertTriangle, ExternalLink } from "lucide-react";
import { useStore, useRuntime, uid, type Flow, type FlowOutput, type RunState } from "../lib/store";
import { runFlow } from "../lib/flows";
import BotAvatar from "./BotAvatar";
import { LargeTitle, Sheet, Group, Field, Row, Toggle, Segmented, inputCls } from "./ui";
import { cn } from "../utils/cn";

const OUT: Record<FlowOutput, { label: string; icon: typeof Zap; color: string }> = {
  none: { label: "Chat only", icon: CircleSlash, color: "#8e8e93" },
  pdf: { label: "PDF", icon: FileDown, color: "#ff3b30" },
  whatsapp: { label: "WhatsApp", icon: MessageCircle, color: "#25d366" },
  brain: { label: "Brain", icon: Brain, color: "#ff2d55" },
};
const INTERVALS = [[15, "15 min"], [60, "Hourly"], [360, "6 hours"], [1440, "Daily"], [10080, "Weekly"]] as const;
const ringFor = (s: RunState | undefined) => s === "running" ? "ring-[#007aff]" : s === "done" ? "ring-[#34c759]" : s === "error" ? "ring-[#ff3b30]" : "ring-transparent";

function Line({ active, done }: { active: boolean; done: boolean }) {
  return <div className={cn("h-[2px] w-6 shrink-0 rounded md:w-10", active ? "flow-line" : done ? "bg-[#34c759]" : "bg-sep")} />;
}

function Node({ children, label, state, color }: { children: React.ReactNode; label: string; state?: RunState; color?: string }) {
  return (
    <div className="flex w-[74px] shrink-0 flex-col items-center gap-1.5">
      <div className={cn("relative flex h-14 w-14 items-center justify-center rounded-[18px] bg-surface shadow-[0_4px_14px_rgba(0,0,0,.08)] ring-[2.5px] transition-all", ringFor(state))} style={color ? { background: color, color: "white" } : undefined}>
        {children}
        {state === "running" && <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#007aff] text-white"><Loader2 size={11} className="animate-spin" /></span>}
        {state === "done" && <span className="pop absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#34c759] text-white"><Check size={11} strokeWidth={3} /></span>}
        {state === "error" && <span className="pop absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#ff3b30] text-white"><AlertTriangle size={10} /></span>}
      </div>
      <span className="w-full truncate text-center text-[11.5px] font-medium text-label2">{label}</span>
    </div>
  );
}

export default function AutomationsView() {
  const flows = useStore((s) => s.flows);
  const bots = useStore((s) => s.bots);
  const runs = useRuntime((s) => s.flowRuns);
  const { addFlow, updateFlow, removeFlow } = useStore.getState();
  const [edit, setEdit] = useState<Flow | null>(null);
  const [openOut, setOpenOut] = useState<string | null>(null);

  const blank = (): Flow => ({ id: "", name: "", trigger: "manual", everyMinutes: 1440, output: "none", enabled: true, steps: [{ id: uid(), botId: bots[0]?.id ?? "", prompt: "" }] });
  const save = () => {
    if (!edit || !edit.name.trim() || !edit.steps.length || edit.steps.some((s) => !s.prompt.trim() || !s.botId)) return;
    if (edit.id) updateFlow(edit.id, edit); else { const { id: _id, ...rest } = edit; addFlow({ ...rest, lastRun: edit.trigger === "schedule" ? Date.now() : undefined }); }
    setEdit(null);
  };
  const setStep = (i: number, p: Partial<Flow["steps"][number]>) => edit && setEdit({ ...edit, steps: edit.steps.map((s, j) => (j === i ? { ...s, ...p } : s)) });
  const move = (i: number, d: number) => { if (!edit) return; const s = [...edit.steps]; const j = i + d; if (j < 0 || j >= s.length) return; [s[i], s[j]] = [s[j], s[i]]; setEdit({ ...edit, steps: s }); };

  return (
    <div className="h-full overflow-y-auto pb-10">
      <LargeTitle title="Automations" sub="Chain Bots into real-time flows — each step's output feeds the next."
        right={<button onClick={() => setEdit(blank())} className="press mb-1.5 flex h-9 items-center gap-1.5 rounded-full bg-[#007aff] px-3.5 text-[14px] font-semibold text-white shadow-[0_6px_18px_rgba(0,122,255,.35)]"><Plus size={17} strokeWidth={2.5} /> New flow</button>} />

      <div className="grid gap-4 px-4 md:px-7 xl:grid-cols-2">
        {flows.map((f, fi) => {
          const run = runs[f.id]; const O = OUT[f.output];
          return (
            <div key={f.id} style={{ animationDelay: `${fi * 50}ms` }} className="fade-up lg-card rounded-[24px] p-4">
              <div className="mb-3 flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[17px] font-semibold">{f.name}</div>
                  <div className="text-[12.5px] text-label2">{f.trigger === "schedule" ? `Every ${INTERVALS.find((x) => x[0] === f.everyMinutes)?.[1] ?? f.everyMinutes + "m"}` : "Manual"} · {f.steps.length} step{f.steps.length > 1 ? "s" : ""}{f.lastRun ? ` · last run ${new Date(f.lastRun).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}` : ""}</div>
                </div>
                {f.trigger === "schedule" && <Toggle on={f.enabled} onChange={(v) => updateFlow(f.id, { enabled: v, lastRun: v ? Date.now() : f.lastRun })} />}
                <button onClick={() => setEdit(JSON.parse(JSON.stringify(f)))} className="press rounded-full bg-fill px-3 py-1.5 text-[13px] font-semibold">Edit</button>
                <button disabled={run?.running} onClick={() => runFlow(f.id)} className="press flex h-9 w-9 items-center justify-center rounded-full bg-[#007aff] text-white shadow-[0_4px_14px_rgba(0,122,255,.35)] disabled:opacity-60">
                  {run?.running ? <Loader2 size={16} className="animate-spin" /> : <Play size={15} fill="currentColor" />}
                </button>
              </div>

              <div className="no-scrollbar -mx-1 flex items-start overflow-x-auto px-1 pt-1 pb-1">
                <Node label={f.trigger === "schedule" ? "Schedule" : "Manual"} state={run ? "done" : undefined} color="#af52de">{f.trigger === "schedule" ? <Clock size={22} /> : <Zap size={22} />}</Node>
                {f.steps.map((s, i) => {
                  const b = bots.find((x) => x.id === s.botId); const st = run?.status[i];
                  return (
                    <div key={s.id} className="flex items-start">
                      <div className="mt-7"><Line active={st === "running"} done={st === "done" || st === "error"} /></div>
                      <Node label={b?.name ?? "Missing bot"} state={st}>{b ? <BotAvatar shape={b.shape} color={b.color} status={st === "running" ? "working" : st === "done" ? "done" : st === "error" ? "error" : "idle"} size={36} ring={false} /> : <AlertTriangle size={20} className="text-[#ff3b30]" />}</Node>
                    </div>
                  );
                })}
                <div className="mt-7"><Line active={run?.output === "running"} done={run?.output === "done"} /></div>
                <Node label={O.label} state={run?.output === "idle" ? undefined : run?.output} color={O.color}><O.icon size={22} /></Node>
              </div>

              {run && (
                <div className="mt-3 rounded-[16px] bg-fill p-3 text-[13px]">
                  <div className="flex items-center gap-2">
                    <span className={cn("font-semibold", run.error ? "text-[#ff3b30]" : run.running ? "shimmer-text" : "text-[#34c759]")}>{run.error ? run.error : run.running ? `Running step ${run.active + 1} of ${f.steps.length}…` : "Completed"}</span>
                    <div className="flex-1" />
                    {run.link && <a href={run.link} target="_blank" rel="noreferrer" className="press flex items-center gap-1 rounded-full bg-[#007aff] px-3 py-1 text-[12.5px] font-semibold text-white"><ExternalLink size={12} />{run.linkLabel}</a>}
                    {run.outputs.length > 0 && <button onClick={() => setOpenOut(openOut === f.id ? null : f.id)} className="text-[12.5px] font-semibold text-[#007aff]">{openOut === f.id ? "Hide" : "Output"}</button>}
                  </div>
                  {openOut === f.id && run.outputs.length > 0 && <div className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap text-[12.5px] leading-relaxed text-label2">{run.outputs[run.outputs.length - 1]}</div>}
                </div>
              )}
            </div>
          );
        })}
        {flows.length === 0 && <div className="col-span-full rounded-[24px] bg-surface py-14 text-center text-[15px] text-label2">No flows yet — create your first automation.</div>}
      </div>

      <Sheet open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? "Edit flow" : "New flow"} size="lg" right={<button onClick={save} className="text-[17px] font-semibold text-[#007aff]">Save</button>}>
        {edit && (
          <div className="px-4 pb-10 md:px-6">
            <Group>
              <Field label="Name"><input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} placeholder="e.g. Research → Visa checklist → PDF" className={inputCls} /></Field>
            </Group>
            <Group header="Trigger">
              <div className="p-3"><Segmented value={edit.trigger} onChange={(v) => setEdit({ ...edit, trigger: v })} options={[{ value: "manual", label: "▶︎ Manual" }, { value: "schedule", label: "⏱ Schedule" }]} /></div>
              {edit.trigger === "schedule" && <Field label="Every"><select value={edit.everyMinutes} onChange={(e) => setEdit({ ...edit, everyMinutes: Number(e.target.value) })} className="w-full bg-transparent text-[16px] text-[#007aff] outline-none">{INTERVALS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>}
            </Group>

            <div className="mb-1.5 px-4 text-[13px] uppercase text-label2">Steps · use {"{{previous}}"} to insert the last output</div>
            {edit.steps.map((s, i) => {
              const b = bots.find((x) => x.id === s.botId);
              return (
                <div key={s.id} className="pop mb-3 rounded-[16px] bg-surface p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#007aff] text-[12px] font-bold text-white">{i + 1}</span>
                    {b && <BotAvatar shape={b.shape} color={b.color} status="idle" size={24} ring={false} />}
                    <select value={s.botId} onChange={(e) => setStep(i, { botId: e.target.value })} className="flex-1 bg-transparent text-[15px] font-semibold text-[#007aff] outline-none">{bots.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
                    <button onClick={() => move(i, -1)} className="text-label2"><ChevronUp size={18} /></button>
                    <button onClick={() => move(i, 1)} className="text-label2"><ChevronDown size={18} /></button>
                    {edit.steps.length > 1 && <button onClick={() => setEdit({ ...edit, steps: edit.steps.filter((_, j) => j !== i) })} className="text-[#ff3b30]"><Trash2 size={16} /></button>}
                  </div>
                  <textarea value={s.prompt} onChange={(e) => setStep(i, { prompt: e.target.value })} rows={3} placeholder={i === 0 ? "What should this Bot do?" : "What to do with the previous output? {{previous}}"} className="w-full resize-y rounded-[12px] bg-fill px-3 py-2 text-[15px] outline-none placeholder:text-label3" />
                </div>
              );
            })}
            <button onClick={() => setEdit({ ...edit, steps: [...edit.steps, { id: uid(), botId: bots[0]?.id ?? "", prompt: "{{previous}}" }] })} className="press mb-7 flex w-full items-center justify-center gap-1.5 rounded-[14px] border-2 border-dashed border-sep py-3 text-[15px] font-semibold text-[#007aff]"><Plus size={17} /> Add step</button>

            <Group header="Output">
              <div className="grid grid-cols-4 gap-2 p-3">
                {(Object.keys(OUT) as FlowOutput[]).map((o) => { const O = OUT[o]; return (
                  <button key={o} onClick={() => setEdit({ ...edit, output: o })} className={cn("press flex flex-col items-center gap-1.5 rounded-[14px] py-3 text-[12.5px] font-semibold", edit.output === o ? "bg-[#007aff]/12 text-[#007aff] ring-2 ring-[#007aff]" : "bg-fill")}>
                    <span className="flex h-9 w-9 items-center justify-center rounded-[11px] text-white" style={{ background: O.color }}><O.icon size={18} /></span>{O.label}
                  </button>
                ); })}
              </div>
            </Group>
            {edit.id && <Group><Row title="Delete flow" danger onClick={() => { if (confirm("Delete this flow?")) { removeFlow(edit.id); setEdit(null); } }} /></Group>}
          </div>
        )}
      </Sheet>
    </div>
  );
}
