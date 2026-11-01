import { jsPDF } from "jspdf";

const clean = (s: string) =>
  s.replace(/\*\*(.+?)\*\*/g, "$1").replace(/__(.+?)__/g, "$1").replace(/\*(.+?)\*/g, "$1").replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
    // jsPDF core fonts are Latin-1 only; replace common unicode
    .replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/[–—]/g, "-").replace(/•/g, "-").replace(/…/g, "...").replace(/→/g, "->").replace(/≥/g, ">=").replace(/≤/g, "<=").replace(/€/g, "EUR ").replace(/✓|✅/g, "[x]")
    .replace(/[^\x00-\xFF]/g, "");

export function makePdf(title: string, markdown: string): { blob: Blob; url: string; filename: string } {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 56;
  const maxW = W - M * 2;
  let y = M;

  const ensure = (h: number) => { if (y + h > H - M) { doc.addPage(); y = M; } };

  // Header
  doc.setFillColor(0, 122, 255); doc.rect(0, 0, W, 6, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(22); doc.setTextColor(17, 17, 17);
  for (const l of doc.splitTextToSize(clean(title), maxW)) { ensure(28); doc.text(l, M, y + 16); y += 28; }
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(140, 140, 145);
  doc.text(`Generated ${new Date().toLocaleString()} · Grok Bot`, M, y + 6); y += 22;
  doc.setDrawColor(229, 229, 234); doc.line(M, y, W - M, y); y += 18;

  const lines = markdown.replace(/\r/g, "").split("\n");
  let inCode = false;
  let skippedTitle = false;

  for (let raw of lines) {
    if (raw.trim().startsWith("```")) { inCode = !inCode; y += 4; continue; }
    if (inCode) {
      doc.setFont("courier", "normal"); doc.setFontSize(9); doc.setTextColor(60, 60, 67);
      for (const l of doc.splitTextToSize(clean(raw) || " ", maxW - 16)) { ensure(13); doc.setFillColor(242, 242, 247); doc.rect(M, y - 9, maxW, 13, "F"); doc.text(l, M + 8, y); y += 13; }
      continue;
    }
    const line = raw.trimEnd();
    if (!line.trim()) { y += 7; continue; }
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      if (level === 1 && !skippedTitle && clean(h[2]).toLowerCase() === clean(title).toLowerCase()) { skippedTitle = true; continue; }
      const size = [0, 18, 15, 12.5, 11.5][level];
      y += level <= 2 ? 10 : 6;
      doc.setFont("helvetica", "bold"); doc.setFontSize(size); doc.setTextColor(level === 2 ? 0 : 17, level === 2 ? 122 : 17, level === 2 ? 255 : 17);
      for (const l of doc.splitTextToSize(clean(h[2]), maxW)) { ensure(size + 8); doc.text(l, M, y + size * 0.4); y += size + 6; }
      y += 2; continue;
    }
    if (/^(-{3,}|\*{3,})$/.test(line.trim())) { ensure(14); doc.setDrawColor(229, 229, 234); doc.line(M, y, W - M, y); y += 14; continue; }
    if (/^\|/.test(line.trim())) {
      if (/^\|?\s*:?-{2,}/.test(line.trim().replace(/^\|/, ""))) continue;
      const cells = line.trim().replace(/^\||\|$/g, "").split("|").map((c) => clean(c.trim()));
      const cw = maxW / cells.length;
      doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(40, 40, 45);
      const wrapped = cells.map((c) => doc.splitTextToSize(c, cw - 8));
      const rh = Math.max(...wrapped.map((w) => w.length)) * 12 + 8;
      ensure(rh);
      doc.setDrawColor(229, 229, 234);
      wrapped.forEach((w, i) => { doc.rect(M + i * cw, y - 10, cw, rh); doc.text(w, M + i * cw + 4, y + 2); });
      y += rh; continue;
    }
    const bullet = line.match(/^(\s*)([-*+]|\d+[.)])\s+(.*)$/);
    doc.setFont("helvetica", "normal"); doc.setFontSize(11); doc.setTextColor(40, 40, 45);
    if (bullet) {
      const indent = M + 10 + Math.min(bullet[1].length, 8) * 6;
      const marker = /\d/.test(bullet[2]) ? bullet[2] : "-";
      const isBold = /^\*\*/.test(bullet[3]);
      if (isBold) doc.setFont("helvetica", "bold");
      const wl = doc.splitTextToSize(clean(bullet[3]), maxW - (indent - M) - 14);
      wl.forEach((l: string, i: number) => { ensure(15); if (i === 0) doc.text(marker, indent, y); doc.text(l, indent + 14, y); y += 15; });
      y += 2; continue;
    }
    const isQuote = line.startsWith(">");
    const text = clean(isQuote ? line.replace(/^>\s?/, "") : line);
    if (/^\*\*.+\*\*:?$/.test(line.trim())) doc.setFont("helvetica", "bold");
    if (isQuote) { doc.setFont("helvetica", "italic"); doc.setTextColor(99, 99, 102); }
    for (const l of doc.splitTextToSize(text, maxW - (isQuote ? 14 : 0))) {
      ensure(15);
      if (isQuote) { doc.setDrawColor(0, 122, 255); doc.setLineWidth(2); doc.line(M, y - 10, M, y + 4); doc.setLineWidth(1); }
      doc.text(l, M + (isQuote ? 12 : 0), y); y += 15;
    }
    y += 3;
  }

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i); doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(160, 160, 165);
    doc.text(`${clean(title).slice(0, 60)}`, M, H - 28);
    doc.text(`Page ${i} of ${pages}`, W - M, H - 28, { align: "right" });
  }

  const filename = (clean(title).replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "document") + ".pdf";
  const blob = doc.output("blob");
  return { blob, url: URL.createObjectURL(blob), filename };
}

export function downloadUrl(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
}

export function pdfFromMarkdown(title: string, md: string) {
  const r = makePdf(title, md);
  downloadUrl(r.url, r.filename);
  return r;
}
