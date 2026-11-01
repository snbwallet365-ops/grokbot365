import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Search, Upload, Trash2, FileDown, Brain } from "lucide-react";
import { useStore, type BrainDoc } from "../lib/store";
import { pdfFromMarkdown } from "../lib/pdf";
import { LargeTitle, Sheet, Group, Field, Row, Toggle, inputCls } from "./ui";
import { Pin } from "lucide-react";

const PALETTE = ["#007aff", "#34c759", "#ff9500", "#af52de", "#ff2d55", "#5856d6", "#00c7be", "#fa520f"];

/** Animated mycelium network: a central mushroom with hyphae growing to every memory. */
function Mycelium({ docs, onPick }: { docs: BrainDoc[]; onPick: (d: BrainDoc) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<{ x: number; y: number; r: number; c: string; d: BrainDoc }[]>([]);

  useEffect(() => {
    const cv = ref.current!; const ctx = cv.getContext("2d")!;
    let raf = 0; let t0 = performance.now();
    const seeds = docs.map((d, i) => {
      let h = 0; for (const ch of d.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
      return { a: (i / Math.max(docs.length, 1)) * Math.PI * 2 + (h % 100) / 160, dist: 0.55 + ((h >> 5) % 40) / 100, wob: ((h >> 9) % 100) / 100, c: PALETTE[h % PALETTE.length], d };
    });
    const draw = (now: number) => {
      const dpr = window.devicePixelRatio || 1;
      const W = cv.clientWidth, H = cv.clientHeight;
      if (cv.width !== W * dpr) { cv.width = W * dpr; cv.height = H * dpr; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const t = (now - t0) / 1000;
      const labelC = getComputedStyle(document.documentElement).getPropertyValue("--label").trim() || "#3c3c43";
      const cx = W / 2, cy = H * 0.56, R = Math.min(W, H) * 0.42;
      const grow = Math.min(1, t / 1.6);

      const nodes: typeof nodesRef.current = [];
      seeds.forEach((s, i) => {
        const a = s.a + Math.sin(t * 0.25 + i) * 0.04;
        const x = cx + Math.cos(a) * R * s.dist * 1.25;
        const y = cy + Math.sin(a) * R * s.dist * 0.75;
        // hypha path
        const mx = (cx + x) / 2 + Math.sin(t * 0.6 + s.wob * 6) * 22, my = (cy + y) / 2 + Math.cos(t * 0.5 + s.wob * 6) * 18;
        ctx.strokeStyle = s.c + "55"; ctx.lineWidth = 1.4; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(cx, cy + 6);
        const gx = cx + (x - cx) * grow, gy = cy + (y - cy) * grow;
        ctx.quadraticCurveTo(cx + (mx - cx) * grow, cy + (my - cy) * grow, gx, gy); ctx.stroke();
        // branches
        for (let b = 0; b < 2; b++) {
          const bt = 0.45 + b * 0.25; const bx = cx + (mx - cx) * bt * 1.2, by = cy + (my - cy) * bt * 1.2;
          ctx.strokeStyle = s.c + "22"; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + Math.cos(a + 1.2 + b) * 26 * grow, by + Math.sin(a + 1.2 + b) * 18 * grow); ctx.stroke();
        }
        // pulse travelling
        const p = (t * 0.35 + s.wob) % 1;
        const px = (1 - p) * (1 - p) * cx + 2 * (1 - p) * p * mx + p * p * x, py = (1 - p) * (1 - p) * (cy + 6) + 2 * (1 - p) * p * my + p * p * y;
        ctx.fillStyle = s.c; ctx.globalAlpha = 0.85 * grow; ctx.beginPath(); ctx.arc(px, py, 2.4, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
        const r = 7 + Math.min(10, s.d.content.length / 700);
        if (grow > 0.95) {
          ctx.fillStyle = s.c + "22"; ctx.beginPath(); ctx.arc(x, y, r + 6 + Math.sin(t * 2 + i) * 2, 0, 7); ctx.fill();
          ctx.fillStyle = s.c; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
          ctx.fillStyle = labelC; ctx.font = "600 11px -apple-system, sans-serif"; ctx.textAlign = "center";
          ctx.fillText(s.d.title.length > 22 ? s.d.title.slice(0, 21) + "…" : s.d.title, x, y + r + 15);
        }
        nodes.push({ x, y, r: r + 6, c: s.c, d: s.d });
      });
      nodesRef.current = nodes;

      // mushroom
      const bob = Math.sin(t * 1.4) * 2;
      ctx.fillStyle = "#f5efe6"; ctx.strokeStyle = "#e3d9c9"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx - 9, cy + 8); ctx.quadraticCurveTo(cx - 11, cy - 14 + bob, cx - 7, cy - 22 + bob); ctx.lineTo(cx + 7, cy - 22 + bob); ctx.quadraticCurveTo(cx + 11, cy - 14 + bob, cx + 9, cy + 8); ctx.closePath(); ctx.fill(); ctx.stroke();
      const g = ctx.createLinearGradient(cx, cy - 58, cx, cy - 18); g.addColorStop(0, "#ff5a4e"); g.addColorStop(1, "#e0352b");
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, cy - 22 + bob, 34, 30, 0, Math.PI, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#fff";
      [[-16, -34, 5], [4, -44, 6], [18, -30, 4.5], [-4, -28, 3.5]].forEach(([dx, dy, r]) => { ctx.beginPath(); ctx.arc(cx + dx, cy + dy + bob, r, 0, 7); ctx.fill(); });
      ctx.fillStyle = "#111"; ctx.beginPath(); ctx.ellipse(cx - 4, cy - 8 + bob, 1.8, 2.6 * (Math.sin(t * 2.5) > 0.97 ? 0.15 : 1), 0, 0, 7); ctx.ellipse(cx + 4, cy - 8 + bob, 1.8, 2.6 * (Math.sin(t * 2.5) > 0.97 ? 0.15 : 1), 0, 0, 7); ctx.fill();
      ctx.fillStyle = labelC; ctx.globalAlpha = .6; ctx.font = "600 11px -apple-system, sans-serif"; ctx.textAlign = "center"; ctx.fillText(`${docs.length} memories`, cx, cy + 26); ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [docs]);

  const click = (e: React.MouseEvent) => {
    const rect = ref.current!.getBoundingClientRect(); const x = e.clientX - rect.left, y = e.clientY - rect.top;
    const n = nodesRef.current.find((n) => Math.hypot(n.x - x, n.y - y) < n.r + 4);
    if (n) onPick(n.d);
  };
  return <canvas ref={ref} onClick={click} className="h-[280px] w-full cursor-pointer md:h-[340px]" />;
}

export default function BrainView() {
  const docs = useStore((s) => s.docs);
  const { addDoc, updateDoc, removeDoc } = useStore.getState();
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<Partial<BrainDoc> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const list = useMemo(() => docs.filter((d) => (d.title + d.content + d.source).toLowerCase().includes(q.toLowerCase())), [docs, q]);

  const save = () => {
    if (!edit?.title?.trim()) return;
    if (edit.id) updateDoc(edit.id, { title: edit.title, content: edit.content ?? "", pinned: !!edit.pinned });
    else addDoc({ title: edit.title, content: edit.content ?? "", source: "You", pinned: !!edit.pinned });
    setEdit(null);
  };
  const importFiles = async (fl: FileList | null) => {
    if (!fl) return;
    for (const f of Array.from(fl)) addDoc({ title: f.name.replace(/\.[^.]+$/, ""), content: (await f.text()).slice(0, 60000), source: "Imported file" });
  };

  return (
    <div className="h-full overflow-y-auto pb-10">
      <LargeTitle title="Brain" sub="Long-term memory shared by all Bots — relevant memories are recalled automatically."
        right={<div className="mb-1.5 flex gap-1">
          <button onClick={() => fileRef.current?.click()} title="Import" className="press flex h-9 w-9 items-center justify-center rounded-full text-[#007aff] hover:bg-fill"><Upload size={20} /></button>
          <button onClick={() => setEdit({ title: "", content: "" })} title="Add memory" className="press flex h-9 w-9 items-center justify-center rounded-full text-[#007aff] hover:bg-fill"><Plus size={24} /></button>
        </div>} />
      <input ref={fileRef} type="file" multiple accept=".txt,.md,.csv,.json,.html,text/*" hidden onChange={(e) => { importFiles(e.target.files); e.target.value = ""; }} />

      <div className="mx-4 mb-5 overflow-hidden rounded-[22px] bg-gradient-to-b from-surface to-grouped shadow-[0_1px_2px_rgba(0,0,0,.04)] md:mx-7">
        <Mycelium docs={list.slice(0, 18)} onPick={(d) => setEdit(d)} />
      </div>

      <div className="mx-4 mb-4 md:mx-7">
        <div className="flex h-9 items-center gap-1.5 rounded-[10px] bg-fill px-2 text-label2">
          <Search size={16} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search memories" className="w-full bg-transparent text-[16px] text-label outline-none placeholder:text-label2" />
        </div>
      </div>

      <div className="grid gap-3 px-4 sm:grid-cols-2 xl:grid-cols-3 md:px-7">
        {list.map((d, i) => (
          <button key={d.id} onClick={() => setEdit(d)} style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }} className="fade-up press rounded-[18px] bg-surface p-4 text-left shadow-[0_1px_2px_rgba(0,0,0,.04)] hover:shadow-md">
            <div className="mb-1.5 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg text-white" style={{ background: PALETTE[i % PALETTE.length] }}><Brain size={14} /></span>
              <span className="truncate text-[15.5px] font-semibold">{d.title}</span>{d.pinned && <Pin size={13} className="shrink-0 text-[#ff9500]" />}
            </div>
            <div className="line-clamp-3 text-[13.5px] leading-snug text-label2">{d.content.replace(/[#*`]/g, "")}</div>
            <div className="mt-2.5 text-[12px] text-label3">{d.source} · {new Date(d.createdAt).toLocaleDateString()} · {Math.ceil(d.content.length / 5)} words</div>
          </button>
        ))}
        {list.length === 0 && <div className="col-span-full py-10 text-center text-[15px] text-label2">No memories yet. Bots save facts here with the “remember” tool.</div>}
      </div>

      <Sheet open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? "Memory" : "New memory"} size="lg"
        right={<button onClick={save} disabled={!edit?.title?.trim()} className="text-[17px] font-semibold text-[#007aff] disabled:text-label3">Save</button>}>
        <div className="px-4 pb-8 md:px-7">
          <Group>
            <Field label="Title"><input value={edit?.title ?? ""} onChange={(e) => setEdit({ ...edit, title: e.target.value })} placeholder="e.g. My passport details" className={inputCls} /></Field>
            <Row title="Always remember" subtitle="Pinned memories are given to every Bot on every message" right={<Toggle on={!!edit?.pinned} onChange={(v) => setEdit({ ...edit, pinned: v })} />} />
          </Group>
          <Group header="Content" footer="Markdown supported. Bots retrieve memories that match the conversation.">
            <textarea value={edit?.content ?? ""} onChange={(e) => setEdit({ ...edit, content: e.target.value })} rows={14} className="block w-full resize-y bg-transparent px-4 py-3 font-mono text-[13.5px] leading-relaxed outline-none" placeholder="Facts, preferences, documents…" />
          </Group>
          {edit?.id && (
            <div className="flex gap-2">
              <button onClick={() => pdfFromMarkdown(edit.title ?? "Memory", edit.content ?? "")} className="press flex flex-1 items-center justify-center gap-2 rounded-xl bg-surface py-3 text-[15px] font-semibold text-[#007aff]"><FileDown size={17} /> Export PDF</button>
              <button onClick={() => { if (confirm("Delete this memory?")) { removeDoc(edit.id!); setEdit(null); } }} className="press flex flex-1 items-center justify-center gap-2 rounded-xl bg-surface py-3 text-[15px] font-semibold text-[#ff3b30]"><Trash2 size={17} /> Delete</button>
            </div>
          )}
        </div>
      </Sheet>
    </div>
  );
}
