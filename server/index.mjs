#!/usr/bin/env node
/**
 * Grok Bot local server
 *  - Serves the built PWA from ./dist           → http://localhost:8787
 *  - /proxy   : streams LLM API calls (avoids browser CORS limits)
 *  - /browser : real Chromium via Playwright (goto, search, click, type, live screenshots)
 *
 * Usage:
 *   npm run build
 *   npx playwright install chromium     # first time only
 *   node server/index.mjs               # PORT=8787 HEADLESS=true by default
 */
import http from "node:http";
import { ocrImage, pdfText, ocrPdf } from "./doc.mjs";
import { readFile, stat } from "node:fs/promises";
import { extname, join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Readable } from "node:stream";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(__dirname, "../dist");
const PORT = Number(process.env.PORT || 8787);
const HEADLESS = process.env.HEADLESS !== "false";
const ALLOWED_PROXY = [/^https:\/\/api\.openai\.com\//, /^https:\/\/api\.x\.ai\//, /^https:\/\/api\.deepseek\.com\//, /^https:\/\/api\.mistral\.ai\//, /^https:\/\/generativelanguage\.googleapis\.com\//, /^https:\/\/graph\.facebook\.com\//];

const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".ico": "image/x-icon" };

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization" };
const json = (res, code, obj) => { res.writeHead(code, { ...cors, "Content-Type": "application/json" }); res.end(JSON.stringify(obj)); };
const body = (req) => new Promise((ok, bad) => { let d = ""; req.on("data", (c) => (d += c)); req.on("end", () => { try { ok(d ? JSON.parse(d) : {}); } catch (e) { bad(e); } }); });

// ---------------- Playwright ----------------
let browser, page;
async function getPage() {
  if (page && !page.isClosed()) return page;
  let pw;
  try { pw = await import("playwright"); } catch { throw new Error("Playwright not installed. Run: npm i -D playwright && npx playwright install chromium"); }
  browser = browser ?? (await pw.chromium.launch({ headless: HEADLESS }));
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 }, userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36" });
  page = await ctx.newPage();
  return page;
}
const snap = async (p) => "data:image/jpeg;base64," + (await p.screenshot({ type: "jpeg", quality: 60 })).toString("base64");
const pageText = (p) => p.evaluate(() => {
  document.querySelectorAll("script,style,noscript,svg").forEach((n) => n.remove());
  const links = [...document.querySelectorAll("a[href]")].slice(0, 40).map((a) => `- [${a.innerText.trim().slice(0, 80)}](${a.href})`).filter((l) => !l.startsWith("- []")).join("\n");
  return (document.body?.innerText || "").replace(/\n{3,}/g, "\n\n").slice(0, 12000) + "\n\nLinks:\n" + links;
});
const state = async (p) => ({ url: p.url(), title: await p.title(), text: await pageText(p), screenshot: await snap(p) });

const handlers = {
  "/browser/mouse": async ({ x, y }) => { const p = await getPage(); const v = p.viewportSize(); await p.mouse.click(Math.round(x * v.width), Math.round(y * v.height)); await p.waitForLoadState("domcontentloaded").catch(() => {}); await p.waitForTimeout(700); return state(p); },
  "/browser/keys": async ({ text, enter }) => { const p = await getPage(); if (text) await p.keyboard.type(String(text), { delay: 15 }); if (enter) { await p.keyboard.press("Enter"); await p.waitForLoadState("domcontentloaded").catch(() => {}); } await p.waitForTimeout(700); return state(p); },
  "/browser/scroll": async ({ dy = 600 }) => { const p = await getPage(); await p.mouse.wheel(0, Number(dy)); await p.waitForTimeout(400); return state(p); },
  "/browser/back": async () => { const p = await getPage(); await p.goBack({ waitUntil: "domcontentloaded" }).catch(() => {}); await p.waitForTimeout(500); return state(p); },
  "/browser/goto": async ({ url }) => { const p = await getPage(); await p.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 }); await p.waitForTimeout(800); return state(p); },
  "/browser/search": async ({ query }) => {
    const p = await getPage();
    await p.goto(`https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`, { waitUntil: "domcontentloaded", timeout: 30000 });
    const results = await p.$$eval(".result", (els) => els.slice(0, 8).map((e) => ({ title: e.querySelector(".result__a")?.textContent?.trim() || "", url: e.querySelector(".result__a")?.href || "", snippet: e.querySelector(".result__snippet")?.textContent?.trim() || "" })));
    return { url: p.url(), results, screenshot: await snap(p) };
  },
  "/browser/click": async ({ text, selector }) => {
    const p = await getPage();
    const loc = selector ? p.locator(selector).first() : p.getByText(text, { exact: false }).first();
    await loc.click({ timeout: 10000 }); await p.waitForLoadState("domcontentloaded").catch(() => {}); await p.waitForTimeout(900);
    return state(p);
  },
  "/browser/type": async ({ selector, text, submit }) => {
    const p = await getPage();
    let loc = p.locator(selector).first();
    if (!(await loc.count().catch(() => 0))) loc = p.getByPlaceholder(selector).first();
    await loc.fill(String(text), { timeout: 10000 });
    if (submit) { await loc.press("Enter"); await p.waitForLoadState("domcontentloaded").catch(() => {}); await p.waitForTimeout(1000); }
    return state(p);
  },
};

// ---------------- Server ----------------
http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (req.method === "OPTIONS") { res.writeHead(204, cors); return res.end(); }
  try {
    if (url.pathname === "/health") return json(res, 200, { ok: true, playwright: !!page, headless: HEADLESS });

    // ---------- passport / document reading (local, unlimited) ----------
    if (url.pathname === "/ocr" && req.method === "POST") {
      try { const { dataUrl } = await body(req); return json(res, 200, { text: await ocrImage(dataUrl) }); }
      catch (e) { return json(res, 501, { error: `OCR unavailable: ${String(e.message).slice(0, 140)}. Install tesseract.` }); }
    }
    if (url.pathname === "/pdftext" && req.method === "POST") {
      try {
        const { dataUrl } = await body(req);
        let text = "";
        try { text = await pdfText(dataUrl); } catch { text = ""; }
        if (!text.trim()) text = await ocrPdf(dataUrl); // scanned PDF
        return json(res, 200, { text });
      } catch (e) { return json(res, 501, { error: `PDF read unavailable: ${String(e.message).slice(0, 140)}. Install poppler (pdftotext/pdftoppm).` }); }
    }

    if (url.pathname === "/proxy" && req.method === "POST") {
      const { url: target, method = "POST", headers = {}, body: b } = await body(req);
      if (!ALLOWED_PROXY.some((r) => r.test(target))) return json(res, 400, { error: "Target not allowed" });
      const up = await fetch(target, { method, headers, body: b });
      res.writeHead(up.status, { ...cors, "Content-Type": up.headers.get("content-type") || "text/plain", "Cache-Control": "no-cache" });
      if (!up.body) return res.end();
      Readable.fromWeb(up.body).pipe(res);
      return;
    }

    if (url.pathname === "/browser/screenshot") {
      if (!page || page.isClosed()) return json(res, 200, {});
      return json(res, 200, { url: page.url(), title: await page.title().catch(() => ""), screenshot: await snap(page) });
    }
    if (handlers[url.pathname] && req.method === "POST") return json(res, 200, await handlers[url.pathname](await body(req)));

    // static
    let file = join(DIST, decodeURIComponent(url.pathname));
    if (!file.startsWith(DIST)) return json(res, 403, { error: "forbidden" });
    try { if ((await stat(file)).isDirectory()) file = join(file, "index.html"); } catch { file = join(DIST, "index.html"); }
    const data = await readFile(file);
    res.writeHead(200, { "Content-Type": MIME[extname(file)] || "application/octet-stream" });
    res.end(data);
  } catch (e) {
    const msg = String(e?.message || e);
    console.error(msg);
    if (/browserType\.launch|Target page, context or browser has been closed/.test(msg)) { browser = undefined; page = undefined; }
    const hint = /shared libraries|libnspr|Executable doesn't exist/.test(msg) ? " — run: npx playwright install --with-deps chromium" : "";
    json(res, 500, { error: msg.split("\n")[0].slice(0, 300) + hint });
  }
}).listen(PORT, () => {
  console.log(`\n  Grok Bot local server  →  http://localhost:${PORT}\n  Playwright browser: ${HEADLESS ? "headless" : "visible"} (set HEADLESS=false to watch)\n`);
});

process.on("SIGINT", async () => { await browser?.close().catch(() => {}); process.exit(0); });
