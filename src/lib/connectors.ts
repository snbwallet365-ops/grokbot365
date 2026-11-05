/**
 * One-click connector catalog.
 * Every entry can be connected in one tap: paste a token and it verifies live,
 * or it saves and verifies on first use (CORS-blocked providers go through the local server).
 */

export type ConnCategory = "ai" | "dev" | "google" | "comms" | "data" | "pay";

export interface Connector {
  id: string;
  name: string;
  slug?: string;
  domain?: string;
  category: ConnCategory;
  color: string;
  letter: string;
  auth: "key" | "oauth";
  hint: string;
  docs: string;
  verify?: (key: string) => Promise<string>;
}

async function j(url: string, init?: RequestInit): Promise<any> {
  const r = await fetch(url, init);
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json();
}

const bearer = (key: string) => ({ Authorization: `Bearer ${key}` });

export const CATEGORIES: { id: ConnCategory | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "ai", label: "AI" },
  { id: "dev", label: "Dev" },
  { id: "google", label: "Google" },
  { id: "comms", label: "Comms" },
  { id: "data", label: "Data" },
  { id: "pay", label: "Payments" },
];

export const CONNECTORS: Connector[] = [
  {
    id: "github", name: "GitHub", slug: "github", category: "dev", color: "#1c1c1e", letter: "G", auth: "key",
    hint: "Personal access token · repo scope", docs: "https://github.com/settings/tokens/new",
    verify: async (k) => (await j("https://api.github.com/user", { headers: bearer(k) })).login,
  },
  {
    id: "vercel", name: "Vercel", slug: "vercel", category: "dev", color: "#000000", letter: "▲", auth: "key",
    hint: "Account token", docs: "https://vercel.com/account/tokens",
    verify: async (k) => (await j("https://api.vercel.com/v2/user", { headers: bearer(k) })).user?.username ?? "connected",
  },
  {
    id: "cloudflare", name: "Cloudflare", slug: "cloudflare", category: "dev", color: "#f38020", letter: "C", auth: "key",
    hint: "API token · Zone read", docs: "https://dash.cloudflare.com/profile/api-tokens",
    verify: async (k) => (await j("https://api.cloudflare.com/client/v4/user", { headers: bearer(k) })).result?.email ?? "connected",
  },
  {
    id: "supabase", name: "Supabase", slug: "supabase", category: "data", color: "#3ecf8e", letter: "S", auth: "key",
    hint: "Service role key + project URL", docs: "https://supabase.com/dashboard/project/_/settings/api",
  },
  {
    id: "firebase", name: "Firebase", slug: "firebase", category: "data", color: "#ffca28", letter: "F", auth: "key",
    hint: "Web API key", docs: "https://console.firebase.google.com",
  },
  {
    id: "mongodb", name: "MongoDB", slug: "mongodb", category: "data", color: "#13aa52", letter: "M", auth: "key",
    hint: "Atlas connection string", docs: "https://cloud.mongodb.com",
  },
  {
    id: "railway", name: "Railway", slug: "railway", category: "dev", color: "#5b21b6", letter: "R", auth: "key",
    hint: "Account token", docs: "https://railway.app/account/tokens",
  },
  {
    id: "xai", name: "xAI", slug: "x", category: "ai", color: "#111111", letter: "x", auth: "key",
    hint: "xai-… key", docs: "https://console.x.ai",
    verify: async (k) => (await j("https://api.x.ai/v1/models", { headers: bearer(k) })).data?.[0]?.id ?? "connected",
  },
  {
    id: "openai", name: "OpenAI", slug: "openai", category: "ai", color: "#10a37f", letter: "O", auth: "key",
    hint: "sk-… key", docs: "https://platform.openai.com/api-keys",
    verify: async (k) => (await j("https://api.openai.com/v1/models", { headers: bearer(k) })).data?.[0]?.id ?? "connected",
  },
  {
    id: "gemini", name: "Google Gemini", slug: "googlegemini", category: "ai", color: "#1a73e8", letter: "✦", auth: "key",
    hint: "AIza… key", docs: "https://aistudio.google.com/apikey",
    verify: async (k) => (await j(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(k)}`)).models?.[0]?.name ?? "connected",
  },
  {
    id: "deepseek", name: "DeepSeek", domain: "deepseek.com", category: "ai", color: "#4d6bfe", letter: "D", auth: "key",
    hint: "sk-… key", docs: "https://platform.deepseek.com/api_keys",
    verify: async (k) => (await j("https://api.deepseek.com/models", { headers: bearer(k) })).data?.[0]?.id ?? "connected",
  },
  {
    id: "mistral", name: "Mistral", domain: "mistral.ai", category: "ai", color: "#fa520f", letter: "M", auth: "key",
    hint: "Mistral API key", docs: "https://console.mistral.ai/api-keys",
    verify: async (k) => (await j("https://api.mistral.ai/v1/models", { headers: bearer(k) })).data?.[0]?.id ?? "connected",
  },
  {
    id: "groq", name: "Groq", domain: "groq.com", category: "ai", color: "#f55036", letter: "Q", auth: "key",
    hint: "gsk_… key", docs: "https://console.groq.com/keys",
    verify: async (k) => (await j("https://api.groq.com/openai/v1/models", { headers: bearer(k) })).data?.[0]?.id ?? "connected",
  },
  {
    id: "openrouter", name: "OpenRouter", domain: "openrouter.ai", category: "ai", color: "#6467f2", letter: "↔", auth: "key",
    hint: "sk-or-… key", docs: "https://openrouter.ai/keys",
    verify: async (k) => (await j("https://openrouter.ai/api/v1/auth/key", { headers: bearer(k) })).data?.label ?? "connected",
  },
  {
    id: "anthropic", name: "Anthropic", slug: "anthropic", category: "ai", color: "#d97757", letter: "A", auth: "key",
    hint: "sk-ant-… key", docs: "https://console.anthropic.com/settings/keys",
  },
  {
    id: "huggingface", name: "Hugging Face", slug: "huggingface", category: "ai", color: "#ffd21e", letter: "🤗", auth: "key",
    hint: "hf_… token", docs: "https://huggingface.co/settings/tokens",
    verify: async (k) => (await j("https://huggingface.co/api/whoami-v2", { headers: bearer(k) })).name ?? "connected",
  },
  {
    id: "gmail", name: "Gmail", slug: "gmail", category: "google", color: "#ea4335", letter: "✉", auth: "oauth",
    hint: "Google access token · gmail.readonly", docs: "https://developers.google.com/gmail/api",
    verify: async (k) => (await j("https://www.googleapis.com/oauth2/v3/userinfo", { headers: bearer(k) })).email ?? "connected",
  },
  {
    id: "gdrive", name: "Google Drive", slug: "googledrive", category: "google", color: "#0f9d58", letter: "▷", auth: "oauth",
    hint: "Google access token · drive scope", docs: "https://developers.google.com/drive/api",
    verify: async (k) => (await j("https://www.googleapis.com/drive/v3/about?fields=user", { headers: bearer(k) })).user?.emailAddress ?? "connected",
  },
  {
    id: "gdocs", name: "Google Docs", slug: "googledocs", category: "google", color: "#4285f4", letter: "D", auth: "oauth",
    hint: "Google access token · documents scope", docs: "https://developers.google.com/docs/api",
    verify: async (k) => (await j("https://www.googleapis.com/oauth2/v3/userinfo", { headers: bearer(k) })).email ?? "connected",
  },
  {
    id: "gsheets", name: "Google Sheets", slug: "googlesheets", category: "google", color: "#0f9d58", letter: "S", auth: "oauth",
    hint: "Google access token · spreadsheets scope", docs: "https://developers.google.com/sheets/api",
    verify: async (k) => (await j("https://www.googleapis.com/oauth2/v3/userinfo", { headers: bearer(k) })).email ?? "connected",
  },
  {
    id: "gcal", name: "Google Calendar", slug: "googlecalendar", category: "google", color: "#1a73e8", letter: "31", auth: "oauth",
    hint: "Google access token · calendar scope", docs: "https://developers.google.com/calendar/api",
    verify: async (k) => (await j("https://www.googleapis.com/calendar/v3/users/me/calendarList", { headers: bearer(k) })).items?.[0]?.summary ?? "connected",
  },
  {
    id: "slack", name: "Slack", slug: "slack", category: "comms", color: "#4a154b", letter: "#", auth: "key",
    hint: "Bot token · xoxb-…", docs: "https://api.slack.com/apps",
    verify: async (k) => (await j("https://slack.com/api/auth.test", { method: "POST", headers: bearer(k) })).team ?? "connected",
  },
  {
    id: "notion", name: "Notion", slug: "notion", category: "comms", color: "#000000", letter: "N", auth: "key",
    hint: "Internal integration secret", docs: "https://www.notion.so/my-integrations",
    verify: async (k) => (await j("https://api.notion.com/v1/users/me", { headers: { ...bearer(k), "Notion-Version": "2022-06-28" } })).name ?? "connected",
  },
  {
    id: "telegram", name: "Telegram", slug: "telegram", category: "comms", color: "#229ed9", letter: "✈", auth: "key",
    hint: "Bot token from @BotFather", docs: "https://core.telegram.org/bots",
    verify: async (k) => (await j(`https://api.telegram.org/bot${k}/getMe`)).result?.username ?? "connected",
  },
  {
    id: "whatsapp", name: "WhatsApp Cloud", slug: "whatsapp", category: "comms", color: "#25d366", letter: "W", auth: "key",
    hint: "Cloud API token + phone number id", docs: "https://developers.facebook.com/docs/whatsapp/cloud-api",
  },
  {
    id: "stripe", name: "Stripe", slug: "stripe", category: "pay", color: "#635bff", letter: "S", auth: "key",
    hint: "Secret key · sk_live_… / sk_test_…", docs: "https://dashboard.stripe.com/apikeys",
    verify: async (k) => (await j("https://api.stripe.com/v1/balance", { headers: bearer(k) })).object ?? "connected",
  },
  {
    id: "figma", name: "Figma", slug: "figma", category: "dev", color: "#a259ff", letter: "F", auth: "key",
    hint: "Personal access token", docs: "https://www.figma.com/settings",
    verify: async (k) => (await j("https://api.figma.com/v1/me", { headers: { "X-Figma-Token": k } })).handle ?? "connected",
  },
  {
    id: "browserless", name: "Browserless", domain: "browserless.io", category: "dev", color: "#00c2a8", letter: "B", auth: "key",
    hint: "Token for the browser agent", docs: "https://browserless.io",
  },
];

export const CONNECTOR_MAP: Record<string, Connector> = Object.fromEntries(CONNECTORS.map((c) => [c.id, c]));
