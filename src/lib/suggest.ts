import type { Message } from "./store";

/**
 * Contextual follow-up suggestions.
 * Nothing is shown before the first message — chips appear only after a topic exists,
 * derived from what the user just talked about.
 */

const TOPICS: { test: RegExp; chips: { bn: string[]; en: string[] } }[] = [
  {
    test: /visa|ভিসা|schengen|শেনজেন|embassy|দূতাবাস|refus|রিজেক্ট|passport|পাসপোর্ট/i,
    chips: {
      bn: ["এই ভিসার ডকুমেন্ট চেকলিস্ট দাও", "কভার লেটার বাংলায় লিখে দাও", "রিফিউজাল হলে কী করব ধাপে ধাপে বলো"],
      en: ["Give me the document checklist", "Draft the cover letter", "What if it gets refused?"],
    },
  },
  {
    test: /pdf|document|ডকুমেন্ট|invoice|রিপোর্ট|cv|resume/i,
    chips: {
      bn: ["এটা PDF আকারে বানিয়ে দাও", "আরও সংক্ষিপ্ত করে দাও", "একই ফরম্যাটে আরেকটা বানাও"],
      en: ["Make this a PDF", "Make it shorter", "Create another in the same format"],
    },
  },
  {
    test: /browser|website|site|খুলে|link|url|search|সার্চ|খুঁজে/i,
    chips: {
      bn: ["লিংকগুলো সূত্রসহ দাও", "স্ক্রিনে ধাপে ধাপে দেখাও", "এই তথ্য সংক্ষেপে সারাংশ দাও"],
      en: ["Give me the links as sources", "Walk me through it on screen", "Summarise this briefly"],
    },
  },
  {
    test: /legal|contract|nda|চুক্তি|আইন|affidavit/i,
    chips: {
      bn: ["চুক্তিটা বাংলায় অনুবাদ করো", "ঝুঁকির জায়গাগুলো চিহ্নিত করো", "PDF হিসেবে ডাউনলোড দাও"],
      en: ["Translate it to Bangla", "Highlight the risky clauses", "Give it as a PDF"],
    },
  },
  {
    test: /code|app|build|bug|অ্যাপ|কোড/i,
    chips: {
      bn: ["পুরো কোডটা দাও", "ধাপে ধাপে বানানোর নিয়ম বলো", "লাইভ প্রিভিউ দেখাও"],
      en: ["Give me the full code", "Explain the build steps", "Show a live preview"],
    },
  },
];

const FALLBACK = {
  bn: ["আরও বিস্তারিত বলো", "ধাপে ধাপে বুঝিয়ে দাও", "একটা সারাংশ দাও"],
  en: ["Tell me more", "Walk me through the steps", "Give me a summary"],
};

export function contextualSuggestions(thread: Message[], lang: "bn" | "en" | "auto"): string[] {
  const bn = lang !== "en";
  if (!thread.length) return [];

  const recent = thread.slice(-4).map((m) => m.content ?? "").join(" ");
  const topic = TOPICS.find((t) => t.test.test(recent));
  const chips = topic ? (bn ? topic.chips.bn : topic.chips.en) : bn ? FALLBACK.bn : FALLBACK.en;

  // avoid showing a chip the user just sent
  const last = (thread[thread.length - 1]?.content ?? "").trim().toLowerCase();
  return chips.filter((c) => c.trim().toLowerCase() !== last).slice(0, 3);
}
