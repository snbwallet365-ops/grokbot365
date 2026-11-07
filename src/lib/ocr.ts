import { parseMrz, guessFromText, type PassportData } from "./mrz";

/**
 * Passport reader, three routes, best first:
 * 1. Local server OCR (unlimited, free, works offline)   → /ocr  and /pdftext
 * 2. Vision model on the uploaded image (needs an AI key) → JSON fields
 * 3. Manual review screen (always available)
 */
export interface ReadResult {
  text: string;
  passport: Partial<PassportData>;
  via: "local-ocr" | "local-pdf" | "vision" | "manual";
  note?: string;
}

const fileToDataUrl = (file: File) =>
  new Promise<string>((ok, bad) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result));
    r.onerror = () => bad(r.error);
    r.readAsDataURL(file);
  });

async function post(base: string, path: string, payload: unknown) {
  const res = await fetch(`${base.replace(/\/$/, "")}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`${path} ${res.status}`);
  return res.json();
}

export async function readPassport(
  file: File,
  opts: { serverUrl?: string; serverOnline?: boolean; vision?: { provider: string; key: string; model: string } },
): Promise<ReadResult> {
  const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
  const dataUrl = await fileToDataUrl(file);

  // 1 — local server (unlimited)
  if (opts.serverOnline && opts.serverUrl) {
    try {
      const out = isPdf
        ? await post(opts.serverUrl, "/pdftext", { dataUrl })
        : await post(opts.serverUrl, "/ocr", { dataUrl });
      const text: string = out.text ?? "";
      const mrz = parseMrz(text);
      if (mrz) return { text, passport: mrz, via: isPdf ? "local-pdf" : "local-ocr" };
      if (text.trim()) return { text, passport: guessFromText(text), via: isPdf ? "local-pdf" : "local-ocr", note: "MRZ পড়া যায়নি, ঘরগুলো একবার মিলিয়ে নিন" };
    } catch {
      /* fall through to vision */
    }
  }

  // 2 — browser OCR (tesseract.js, no key, no server)
  if (!isPdf) {
    try {
      const text = await browserOcr(dataUrl);
      const mrz = parseMrz(text);
      if (mrz) return { text, passport: mrz, via: "local-ocr", note: "ব্রাউজার OCR" };
      if (text.trim()) return { text, passport: guessFromText(text), via: "local-ocr", note: "ব্রাউজার OCR · ঘরগুলো মিলিয়ে নিন" };
    } catch { /* fall through to vision */ }
  }

  // 3 — vision model
  if (opts.vision?.key) {
    try {
      const prompt =
        "Read this passport page. Reply ONLY with compact JSON: " +
        '{"surname":"","givenNames":"","passportNo":"","nationality":"","dateOfBirth":"DD/MM/YYYY","sex":"M/F","expiry":"DD/MM/YYYY","issuingCountry":""}';
      const raw = await visionJson(opts.vision, prompt, dataUrl, isPdf);
      const j = JSON.parse(raw.replace(/```json|```/g, "").trim());
      return {
        text: JSON.stringify(j),
        passport: {
          surname: j.surname ?? "",
          givenNames: j.givenNames ?? "",
          fullName: [j.givenNames, j.surname].filter(Boolean).join(" "),
          passportNo: String(j.passportNo ?? "").toUpperCase(),
          nationality: j.nationality ?? "",
          dateOfBirth: j.dateOfBirth ?? "",
          sex: j.sex ?? "",
          expiry: j.expiry ?? "",
          issuingCountry: j.issuingCountry ?? "",
          confidence: "guess",
        },
        via: "vision",
      };
    } catch (e: any) {
      return { text: "", passport: {}, via: "manual", note: "ভিশন মডেল পড়তে পারেনি: " + String(e?.message ?? e).slice(0, 80) };
    }
  }

  return {
    text: "",
    passport: {},
    via: "manual",
    note: "লোকাল সার্ভার অফলাইন আর কোনো AI কী নেই — ঘরগুলো হাতে ভরে নিন, বাকিটা অ্যাপ করবে",
  };
}

/** Offline OCR in the browser — lazy loaded so it never slows the first paint. */
async function browserOcr(dataUrl: string): Promise<string> {
  const mod: any = await import("tesseract.js");
  const createWorker = mod.createWorker ?? mod.default?.createWorker;
  if (!createWorker) throw new Error("OCR engine unavailable");
  const worker = await createWorker("eng", 1, {
    workerPath: "https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/worker.min.js",
    corePath: "https://cdn.jsdelivr.net/npm/tesseract.js-core@7.0.0/",
    langPath: "https://tessdata.projectnaptha.com/4.0.0",
    logger: () => {},
  });
  try {
    const { data } = await worker.recognize(dataUrl);
    return String(data?.text ?? "");
  } finally {
    await worker.terminate?.();
  }
}

async function visionJson(v: { provider: string; key: string; model: string }, prompt: string, dataUrl: string, isPdf: boolean): Promise<string> {
  if (isPdf) {
    // PDFs go page-by-page: send as document part (Gemini) or as text via file name
    if (v.provider !== "gemini") throw new Error("PDF পড়তে লোকাল সার্ভার লাগবে");
  }
  const b64 = dataUrl.split(",")[1] ?? "";
  if (v.provider === "gemini") {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(v.model)}:generateContent?key=${encodeURIComponent(v.key)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }, { inline_data: { mime_type: isPdf ? "application/pdf" : "image/jpeg", data: b64 } }] }],
        }),
      },
    );
    if (!res.ok) throw new Error(`Gemini ${res.status}`);
    const j = await res.json();
    return j?.candidates?.[0]?.content?.parts?.map((p: any) => p.text ?? "").join("") ?? "";
  }
  const base = v.provider === "openai" ? "https://api.openai.com/v1" : v.provider === "xai" ? "https://api.x.ai/v1" : "https://api.deepseek.com";
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${v.key}` },
    body: JSON.stringify({
      model: v.model,
      messages: [{ role: "user", content: [{ type: "text", text: prompt }, { type: "image_url", image_url: { url: dataUrl } }] }],
    }),
  });
  if (!res.ok) throw new Error(`Vision ${res.status}`);
  const j = await res.json();
  return j?.choices?.[0]?.message?.content ?? "";
}
