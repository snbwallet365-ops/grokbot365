import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// PWA: register service worker (skipped in dev and on file:// / sandboxed origins)
if ("serviceWorker" in navigator && import.meta.env.PROD && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

// Capture install prompt early so Settings → Install works
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  (window as any).__installPrompt = e;
});
