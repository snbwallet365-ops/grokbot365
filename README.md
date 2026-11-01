# N Space · Grok Bot — Multi-agent AI teammates (PWA)

**v3:** iOS liquid-glass UI (light / dark, ⌘J), everything in the left sidebar (drawer on mobile, no tab bar), right-side **Computer panel** (live screen, click/scroll/type takeover, Activity timeline of every agent step, Files), visual **Automations** (multi-bot flows → PDF / WhatsApp / Brain), Brain with pinned "always remember" memories, replies in native **Bangla** by default with smart answer length.
Shortcuts: ⌘B sidebar · ⌘. computer panel · ⌘J theme.

A white, iOS-first, real-time multi-agent app that runs on iPhone, iPad, Android, Windows and macOS (installable PWA).

## Agents (all real API calls, streaming)
| Bot | Default provider | Specialty |
|---|---|---|
| Grok — Chief of Staff | xAI (grok-4) | Coordinates other bots (`ask_bot`), research, memory |
| Browser Agent | OpenAI | Browser-use with live preview overlay (Playwright) |
| Visa Expert | Gemini | Built-in refusal knowledge (214(b), V4.2, Schengen codes, R179(b)…), appeals, cover letters |
| Legal Docs Expert | OpenAI | NDAs, contracts, affidavits, sponsorship letters → PDF |
| PDF Generator | DeepSeek | Any document → downloadable PDF |
| App Builder | OpenAI | Base44-style single-file apps with live "Run app" preview |
| Mistral Agent | Mistral | Chat Completions or **Agents API** (`agent_id`) |
| Researcher | DeepSeek | Cited research with web search |

Every bot can switch to xAI, OpenAI, DeepSeek, Mistral or Gemini at any time.

## Sections
Bots · Browser (live sessions + history) · Brain (mycelium knowledge network) · Routines (real scheduler) · Connections (API keys, WhatsApp one-tap, local server) · Settings (approvals, notifications, PWA install, backup).

## Run
```bash
npm install
npm run dev                 # development
npm run build               # production build → dist/
```

### Local server (recommended: real Chromium browser + API proxy + serves the app)
```bash
npm run build
npx playwright install chromium          # Linux: add --with-deps
node server/index.mjs                    # → http://localhost:8787
HEADLESS=false node server/index.mjs     # watch the browser
```
Without the server, browsing falls back to a cloud page reader (r.jina.ai) + screenshot service (thum.io); click/type need the server.

## Keys
Add keys in **Connections**. They're stored only in this device's localStorage and sent directly to the provider (or via your local server if "Route API calls through local server" is on).
