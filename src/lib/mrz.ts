/**
 * Passport MRZ (TD3) parser. Deterministic, offline, no model needed:
 * if the OCR text contains the two 44-character MRZ lines we read the
 * applicant's identity straight from the document itself.
 */
export interface PassportData {
  surname: string;
  givenNames: string;
  fullName: string;
  passportNo: string;
  nationality: string;
  dateOfBirth: string; // DD/MM/YYYY
  sex: string;
  expiry: string; // DD/MM/YYYY
  issuingCountry: string;
  mrz: [string, string];
  confidence: "mrz" | "guess";
}

const clean = (line: string) => line.replace(/\s+/g, "").toUpperCase();

function fixDate(yymmdd: string, kind: "dob" | "expiry"): string {
  const m = /^(\d{2})(\d{2})(\d{2})$/.exec(yymmdd);
  if (!m) return "";
  let [, yy, mm, dd] = m;
  let year = Number(yy);
  if (kind === "dob") year += year > 40 ? 1900 : 2000;
  else year += 2000;
  return `${dd}/${mm}/${year}`;
}

function nameFromMrz(line: string): { surname: string; givenNames: string } {
  // P<BGDABBAS<<MOHAMMAD<ABBAS<<<<<<<<<<<<<<<<<<<<
  const body = line.slice(5);
  const [sur, given = ""] = body.split("<<");
  const tidy = (v: string) => v.replace(/</g, " ").replace(/\s+/g, " ").trim();
  return { surname: tidy(sur), givenNames: tidy(given) };
}

export function parseMrz(rawText: string): PassportData | null {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length >= 40 && /^[A-Z0-9<]+$/.test(clean(l)));

  const candidate = (l: string) => clean(l);
  let l1 = "";
  let l2 = "";
  for (let i = 0; i < lines.length - 1; i++) {
    const a = candidate(lines[i]);
    const b = candidate(lines[i + 1]);
    if (a.length >= 44 && b.length >= 44 && /^P[A-Z<]/.test(a) && /^\d/.test(b.slice(0, 2))) {
      l1 = a;
      l2 = b;
      break;
    }
  }
  if (!l1 || !l2) return null;

  const { surname, givenNames } = nameFromMrz(l1);
  const passportNo = l2.slice(0, 9).replace(/</g, "");
  const nationality = l2.slice(10, 13).replace(/</g, "");
  const dob = fixDate(l2.slice(13, 19), "dob");
  const sex = l2.slice(20, 21) === "M" ? "M" : l2.slice(20, 21) === "F" ? "F" : "";
  const expiry = fixDate(l2.slice(21, 27), "expiry");
  const issuingCountry = l1.slice(2, 5).replace(/</g, "");

  return {
    surname,
    givenNames,
    fullName: [givenNames, surname].filter(Boolean).join(" "),
    passportNo,
    nationality,
    dateOfBirth: dob,
    sex,
    expiry,
    issuingCountry,
    mrz: [l1, l2],
    confidence: "mrz",
  };
}

/** Loose sweep for passports whose MRZ was read badly: pull passport number + name hints. */
export function guessFromText(rawText: string): Partial<PassportData> {
  const t = rawText.replace(/\r/g, "");
  const id = /(?:passport\s*(?:no|number)|পাসপোর্ট(?:\s*নম্বর)?)\s*[:#]?\s*([A-Z]{1,2}\d{6,8})/i.exec(t);
  const date = /(\d{2})[\/.\-](\d{2})[\/.\-](\d{4})/g;
  const dates = [...t.matchAll(date)].map((m) => `${m[1]}/${m[2]}/${m[3]}`);
  return {
    passportNo: id?.[1]?.toUpperCase() ?? "",
    dateOfBirth: dates[0] ?? "",
    expiry: dates[1] ?? "",
    confidence: "guess",
  };
}
