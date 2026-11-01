import { useStore, useRuntime, type FlowRun, type RunState } from "./store";
import { runBot } from "./agent";
import { makePdf, downloadUrl } from "./pdf";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Run a multi-bot automation flow: each step's output feeds the next, then the output action fires. */
export async function runFlow(id: string) {
  const S = useStore.getState, R = useRuntime.getState;
  const flow = S().flows.find((f) => f.id === id);
  if (!flow || !flow.steps.length || R().flowRuns[id]?.running) return;
  const set = (p: Partial<FlowRun>) => R().set({ flowRuns: { ...R().flowRuns, [id]: { ...(R().flowRuns[id] as FlowRun), ...p } } });
  R().set({ flowRuns: { ...R().flowRuns, [id]: { running: true, active: 0, status: flow.steps.map(() => "idle" as RunState), outputs: [], output: "idle" } } });
  S().updateFlow(id, { lastRun: Date.now() });

  let prev = "";
  for (let i = 0; i < flow.steps.length; i++) {
    const st = flow.steps[i];
    if (!S().bots.find((b) => b.id === st.botId)) { mark(i, "error"); set({ running: false, error: `Step ${i + 1}: bot no longer exists` }); return; }
    for (let w = 0; R().live[st.botId] && w < 600; w++) await sleep(500);
    mark(i, "running"); set({ active: i });
    const prompt = st.prompt.includes("{{previous}}") ? st.prompt.split("{{previous}}").join(prev) : i > 0 && prev ? `${st.prompt}\n\n---\nInput from previous step:\n${prev}` : st.prompt;
    const out = await runBot(st.botId, prompt, { routine: `Automation · ${flow.name} · step ${i + 1}` });
    if (!out) { mark(i, "error"); set({ running: false, error: "Step failed — open the bot's chat to see why (API key?)" }); return; }
    mark(i, "done"); set({ outputs: [...(R().flowRuns[id]?.outputs ?? []), out] });
    prev = out;
  }

  set({ output: "running" });
  try {
    if (flow.output === "pdf") {
      const r = makePdf(flow.name, prev); downloadUrl(r.url, r.filename);
      set({ link: r.url, linkLabel: "Download PDF" });
    } else if (flow.output === "brain") {
      S().addDoc({ title: `${flow.name} · ${new Date().toLocaleDateString()}`, content: prev, source: "Automation" });
    } else if (flow.output === "whatsapp") {
      const w = S().settings.whatsapp; const phone = w.phone.replace(/\D/g, "");
      if (w.token && w.phoneNumberId && phone) {
        const r = await fetch(`https://graph.facebook.com/v21.0/${w.phoneNumberId}/messages`, { method: "POST", headers: { Authorization: `Bearer ${w.token}`, "Content-Type": "application/json" }, body: JSON.stringify({ messaging_product: "whatsapp", to: phone, type: "text", text: { body: `${flow.name}\n\n${prev}`.slice(0, 4000) } }) });
        if (!r.ok) throw new Error("WhatsApp API error");
      } else set({ link: `https://wa.me/${phone}?text=${encodeURIComponent(`${flow.name}\n\n${prev}`.slice(0, 3500))}`, linkLabel: "Send on WhatsApp" });
    }
    set({ output: "done", running: false, finishedAt: Date.now() });
    R().showToast(`✓ ${flow.name} finished`);
  } catch (e: any) {
    set({ output: "error", running: false, error: e?.message ?? "Output failed" });
  }

  function mark(i: number, st: RunState) {
    const cur = R().flowRuns[id]; if (!cur) return;
    const status = [...cur.status]; status[i] = st; set({ status });
  }
}
