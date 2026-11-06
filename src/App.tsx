import { useEffect, useRef, useState } from "react";
import { PanelLeft } from "lucide-react";
import { useStore, useRuntime } from "./lib/store";
import { checkServer, runBot } from "./lib/agent";
import { runFlow } from "./lib/flows";
import Sidebar, { NAV, type Section } from "./components/Sidebar";
import ChatView from "./components/ChatView";
import ComputerPanel from "./components/ComputerPanel";
import BotEditor from "./components/BotEditor";
import BrainView from "./components/BrainView";
import AutomationsView from "./components/AutomationsView";
import { BrowserView, RoutinesView, SettingsView } from "./components/Sections";
import ConnectorsView from "./components/ConnectorsView";
import DashboardView from "./components/DashboardView";
import PackageView from "./components/PackageView";
import Splash from "./components/Splash";
import AuthGate from "./components/Auth";
import CloudView from "./components/CloudView";
import { useAuth } from "./lib/auth";

const useWidth = () => {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => { const r = () => setW(window.innerWidth); window.addEventListener("resize", r); return () => window.removeEventListener("resize", r); }, []);
  return w;
};

export default function App() {
  const user = useAuth((s) => s.user);
  const [booting, setBooting] = useState(() => {
    try { return sessionStorage.getItem("ns-splash") !== "1"; } catch { return true; }
  });
  if (booting) return <Splash onDone={() => { try { sessionStorage.setItem("ns-splash", "1"); } catch {} setBooting(false); }} />;
  if (!user) return <AuthGate />;
  return <Workspace />;
}

function Workspace() {
  const bots = useStore((s) => s.bots);
  const theme = useStore((s) => s.settings.theme);
  const live = useRuntime((s) => s.live);
  const browser = useRuntime((s) => s.browser);
  const drawer = useRuntime((s) => s.drawer);
  const rightOpen = useRuntime((s) => s.rightOpen);
  const toast = useRuntime((s) => s.toast);
  const setRT = useRuntime((s) => s.set);
  const width = useWidth();
  const wide = width >= 768, xl = width >= 1180;

  const [section, setSection] = useState<Section>(() => {
    const s = new URLSearchParams(location.search).get("section") as Section | null;
    return s && (s === "bots" || NAV.some((n) => n.id === s)) ? s : "dashboard";
  });
  const [activeId, setActiveId] = useState<string | null>(() => useStore.getState().bots[0]?.id ?? null);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("ns-collapsed") === "1");
  const [editor, setEditor] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const autoTurn = useRef<string | null>(null);

  useEffect(() => { localStorage.setItem("ns-collapsed", collapsed ? "1" : "0"); }, [collapsed]);
  useEffect(() => { if (!activeId || !bots.find((b) => b.id === activeId)) setActiveId(bots[0]?.id ?? null); }, [bots, activeId]);
  useEffect(() => { if (xl && localStorage.getItem("ns-right") !== "0") setRT({ rightOpen: true }); }, []);
  // any section change on a phone closes the drawer, so the page is never covered
  useEffect(() => { if (!wide) setRT({ drawer: false }); }, [section, wide]);
  useEffect(() => { if (xl) localStorage.setItem("ns-right", rightOpen ? "1" : "0"); }, [rightOpen, xl]);

  // Theme
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#060608" : "#eef1f8");
  }, [theme]);

  // Auto-open the computer panel when the active bot starts using the browser (once per turn)
  useEffect(() => {
    const turn = activeId ? live[activeId] : null;
    if (browser && turn && browser.botId === activeId && autoTurn.current !== turn && wide) {
      autoTurn.current = turn; setRT({ rightOpen: true, rightTab: "computer" });
    }
  }, [browser?.url, browser?.botId, activeId, live, wide]);

  // Local server health
  useEffect(() => { checkServer(); const t = setInterval(checkServer, 15000); return () => clearInterval(t); }, []);

  // Real-time schedulers: routines + automation flows
  useEffect(() => {
    const tick = () => {
      const { routines, updateRoutine, bots, flows } = useStore.getState();
      const now = Date.now(); const R = useRuntime.getState();
      for (const r of routines) {
        if (!r.enabled || !bots.find((b) => b.id === r.botId) || R.live[r.botId]) continue;
        if (now >= (r.lastRun ?? 0) + r.everyMinutes * 60000) { updateRoutine(r.id, { lastRun: now }); runBot(r.botId, r.prompt, { routine: r.name }); }
      }
      for (const f of flows) {
        if (f.trigger !== "schedule" || !f.enabled || R.flowRuns[f.id]?.running) continue;
        if (now >= (f.lastRun ?? 0) + f.everyMinutes * 60000) runFlow(f.id);
      }
    };
    const t = setInterval(tick, 20000); tick();
    return () => clearInterval(t);
  }, []);

  // Keyboard shortcuts (desktop app feel)
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key === "b") { e.preventDefault(); setCollapsed((c) => !c); }
      if (e.key === "." ) { e.preventDefault(); setRT({ rightOpen: !useRuntime.getState().rightOpen }); }
      if (e.key === "j") { e.preventDefault(); useStore.getState().setSettings((s) => ({ ...s, theme: s.theme === "dark" ? "light" : "dark" })); }
    };
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  }, []);

  const selectBot = (id: string) => { setActiveId(id); setSection("bots"); };
  const openKeys = () => { setSection("connections"); setRT({ drawer: false }); };
  const showRight = section === "bots" && !!activeId && rightOpen;

  const sidebar = (mobile = false) => (
    <Sidebar section={section} setSection={setSection} activeId={activeId} onSelectBot={selectBot} onNewBot={() => setEditor({ open: true, id: null })}
      collapsed={collapsed} setCollapsed={setCollapsed} mobile={mobile} />
  );

  const content = () => {
    switch (section) {
      case "browser": return <BrowserView onOpenBot={selectBot} />;
      case "brain": return <BrainView />;
      case "automations": return <AutomationsView />;
      case "routines": return <RoutinesView />;
      case "dashboard": return <DashboardView onOpenBot={(id) => selectBot(id)} />;
      case "package": return <PackageView />;
      case "connections": return <ConnectorsView />;
      case "cloud": return <CloudView onConnections={() => setSection("connections")} onSettings={() => setSection("settings")} />;
      case "settings": return <SettingsView />;
      default: return activeId ? <ChatView key={activeId} botId={activeId} onEdit={() => setEditor({ open: true, id: activeId })} onOpenKeys={openKeys} /> : null;
    }
  };

  return (
    <div className="app-bg relative flex h-dvh w-full overflow-hidden md:gap-2.5 md:p-2.5">
      {/* Ambient liquid blobs */}
      <div className="blob top-[-10%] left-[-5%] h-[45vh] w-[45vh] bg-[#7aa8ff]" />
      <div className="blob right-[-8%] bottom-[-12%] h-[50vh] w-[50vh] bg-[#ff9ec7]" style={{ animationDelay: "-8s" }} />
      <div className="blob top-[30%] left-[45%] h-[35vh] w-[35vh] bg-[#8ef0cf]" style={{ animationDelay: "-15s" }} />

      {wide && sidebar()}

      {!wide && <MobileDrawer open={drawer} onClose={() => setRT({ drawer: false })}>{sidebar(true)}</MobileDrawer>}

      <main key={section === "bots" ? "bots" : section} className="lg-card fade-in relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden md:rounded-[26px]">
        {!wide && section !== "bots" && (
          <div className="pb-safe flex shrink-0 items-center gap-2 border-b border-[var(--sep)] px-3 py-2">
            <button
              onClick={() => setRT({ drawer: true })}
              aria-label="Menu"
              className="press flex h-9 items-center gap-1.5 rounded-full bg-fill px-3 text-[13.5px] font-semibold"
            >
              <PanelLeft size={16} />
              {NAV.find((n) => n.id === section)?.label ?? "Menu"}
            </button>
            <span className="ml-auto text-[11.5px] text-label2">{useStore.getState().settings.country}</span>
          </div>
        )}
        {content()}
      </main>

      {showRight && activeId && (xl ? (
        <div className="slide-right relative z-10 h-full w-[400px] shrink-0 2xl:w-[460px]">
          <ComputerPanel botId={activeId} onClose={() => setRT({ rightOpen: false })} />
        </div>
      ) : (
        <div className="fixed inset-0 z-[56]">
          <div className="fade-in absolute inset-0 bg-black/25 backdrop-blur-[2px]" onClick={() => setRT({ rightOpen: false })} />
          <div className="slide-right absolute inset-y-0 right-0 w-full max-w-[440px] md:inset-y-2.5 md:right-2.5">
            <ComputerPanel botId={activeId} onClose={() => setRT({ rightOpen: false })} />
          </div>
        </div>
      ))}

      <BotEditor botId={editor.id} open={editor.open} onClose={() => setEditor({ open: false, id: null })} onCreated={selectBot} />

      {toast && <div className="toast-in lg-pill fixed top-[calc(env(safe-area-inset-top)+14px)] left-1/2 z-[80] rounded-full px-4 py-2.5 text-[14px] font-semibold">{toast}</div>}
    </div>
  );
}


/** Sidebar drawer with a real open/close animation (spring in, soft slide out). */
function MobileDrawer({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);
  useEffect(() => {
    if (open) { setMounted(true); setClosing(false); return; }
    if (!mounted) return;
    setClosing(true);
    const t = setTimeout(() => { setMounted(false); setClosing(false); }, 240);
    return () => clearTimeout(t);
  }, [open, mounted]);
  if (!mounted) return null;
  return (
    <div className="fixed inset-0 z-[55]">
      <div className={closing ? "scrim-out absolute inset-0 bg-black/30 backdrop-blur-[2px]" : "scrim-in absolute inset-0 bg-black/30 backdrop-blur-[2px]"} onClick={onClose} />
      <div className={closing ? "drawer-out absolute inset-y-0 left-0" : "drawer-in absolute inset-y-0 left-0"}>{children}</div>
    </div>
  );
}
