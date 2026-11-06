/**
 * Runs on the user's own machine together with the app:
 * /ocr       image → text      (tesseract, if installed: brew install tesseract / choco install tesseract)
 * /pdftext   pdf   → text      (pdftotext from poppler, if installed)
 * Both are unlimited and free because everything stays local.
 */
import { execFile } from "node:child_process";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const run = (cmd, args) =>
  new Promise<string>((ok, bad) => {
    execFile(cmd, args, { maxBuffer: 24 * 1024 * 1024, timeout: 120000 }, (err, stdout, stderr) => {
      if (err) bad(new Error(String(stderr || err.message).slice(0, 200)));
      else ok(stdout);
    });
  });

export async function ocrImage(dataUrl) {
  const b64 = String(dataUrl).split(",")[1] ?? "";
  const dir = await mkdtemp(join(tmpdir(), "ns-ocr-"));
  const file = join(dir, "page.png");
  try {
    await writeFile(file, Buffer.from(b64, "base64"));
    // --psm 6 treats the page as one uniform block: good for passports and forms
    return await run("tesseract", [file, "stdout", "-l", "eng", "--psm", "6"]);
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

export async function pdfText(dataUrl) {
  const b64 = String(dataUrl).split(",")[1] ?? "";
  const dir = await mkdtemp(join(tmpdir(), "ns-pdf-"));
  const file = join(dir, "doc.pdf");
  try {
    await writeFile(file, Buffer.from(b64, "base64"));
    return await run("pdftotext", ["-layout", file, "-"]);
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

export async function ocrPdf(dataUrl) {
  // Scan-only PDFs: rasterise first page to png, then OCR it
  const b64 = String(dataUrl).split(",")[1] ?? "";
  const dir = await mkdtemp(join(tmpdir(), "ns-sc-"));
  const file = join(dir, "doc.pdf");
  try {
    await writeFile(file, Buffer.from(b64, "base64"));
    await run("pdftoppm", ["-r", "300", "-png", "-f", "1", "-l", "1", file, join(dir, "p")]);
    const { readdir } = await import("node:fs/promises");
    const png = (await readdir(dir)).find((f) => f.endsWith(".png"));
    if (!png) throw new Error("pdf → image failed");
    return await run("tesseract", [join(dir, png), "stdout", "-l", "eng", "--psm", "6"]);
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}
