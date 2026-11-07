export interface Country {
  fee?: string;
  employer?: string;
  payroll?: string;
  permit?: string;
  pathways?: string[];
  roles?: string[];
  code: string;
  name: string;
  bn: string;
  flag: string;
  types: string[];
  portal: string;
  days: string;
  needs: string[];
}

export const COUNTRIES: Country[] = [
  { code: "AU", name: "Australia", bn: "অস্ট্রেলিয়া", flag: "🇦🇺", types: ["Visitor 600", "Student 500", "Skilled 189/190", "Sponsor 482"], portal: "ImmiAccount", days: "20–60", needs: ["Passport bio page", "Bank statement 6 months", "Employment letter", "ITR / tax", "Travel itinerary", "Genuine visitor statement"] },
  { code: "NZ", name: "New Zealand", bn: "নিউজিল্যান্ড", flag: "🇳🇿", types: ["Visitor", "Student", "Essential Skills", "Partner"], portal: "Immigration Online", days: "20–45", needs: ["Passport bio page", "Funds proof", "Employment proof", "Medical (if >12m)", "Police certificate"] },
  { code: "RS", name: "Serbia", bn: "সার্বিয়া", flag: "🇷🇸", types: ["Visa D (work)", "Visa C (tourist)", "Family reunion"], portal: "e-Visa portal", days: "10–30", needs: ["Passport bio page", "Invitation / work permit", "Insurance", "Accommodation proof", "Return ticket"] },
  { code: "MD", name: "Moldova", bn: "মলদোভা", flag: "🇲🇩", types: ["Work permit D", "Visitor C"], portal: "e-Visa", days: "10–25", needs: ["Passport bio page", "Employer contract", "Insurance", "Funds proof"] },
  { code: "EE", name: "Estonia", bn: "এস্তোনিয়া", flag: "🇪🇪", types: ["Seasonal work", "Long-stay D", "Schengen C"], portal: "Estonian MFA", days: "15–30", needs: ["Passport bio page", "Employer registration", "Insurance", "Funds proof", "Accommodation"] },
  { code: "LT", name: "Lithuania", bn: "লিথুয়ানিয়া", flag: "🇱🇹", types: ["Work visa D", "Schengen C"], portal: "MIGRIS", days: "15–30", needs: ["Passport bio page", "Work permit confirmation", "Insurance", "Funds proof"] },
  { code: "MT", name: "Malta", bn: "মাল্টা", flag: "🇲🇹", types: ["Single permit", "Schengen C"], portal: "Visa4Malta", days: "15–40", needs: ["Passport bio page", "Employment contract", "Insurance", "Accommodation", "Funds proof"] },
  { code: "ME", name: "Montenegro", bn: "মন্টেনিগ্রো", flag: "🇲🇪", types: ["Work permit", "Tourist C"], portal: "MFA portal", days: "10–25", needs: ["Passport bio page", "Employer request", "Insurance", "Accommodation"] },
  { code: "MA", name: "Morocco", bn: "মরক্কো", flag: "🇲🇦", types: ["Work", "Visitor"], portal: "Consulat portal", days: "10–30", needs: ["Passport bio page", "Invitation", "Insurance", "Funds proof"] },
  { code: "SG", name: "Singapore", bn: "সিঙ্গাপুর", flag: "🇸🇬", types: ["Employment Pass", "S Pass", "Work Permit", "Visitor"], portal: "MOM / ICA", days: "7–21", needs: ["Passport bio page", "Employer offer", "Educational certificates", "Medical"] },
  { code: "MY", name: "Malaysia", bn: "মালয়েশিয়া", flag: "🇲🇾", types: ["Employment Pass", "Calling visa", "Visitor"], portal: "EMGS / MYEntry", days: "15–45", needs: ["Passport bio page", "Approval letter", "Medical report", "Photos white background"] },
  { code: "SA", name: "Saudi Arabia", bn: "সৌদি আরব", flag: "🇸🇦", types: ["Work visa", "Umrah / Visit"], portal: "Qiwa / Enjaz", days: "10–30", needs: ["Passport bio page", "Medical GAMCA", "Police clearance", "Employer block visa"] },
  { code: "AE", name: "UAE", bn: "সংযুক্ত আরব আমিরাত", flag: "🇦🇪", types: ["Employment", "Visit", "Golden visa"], portal: "ICP / GDRFA", days: "5–20", needs: ["Passport bio page", "Offer letter", "Photo white background", "Attested degree"] },
  { code: "KW", name: "Kuwait", bn: "কুয়েত", flag: "🇰🇼", types: ["Work visa 18", "Visit"], portal: "MOI portal", days: "15–40", needs: ["Passport bio page", "Medical GAMCA", "Police clearance", "Attested certificates"] },
  { code: "BH", name: "Bahrain", bn: "বাহরাইন", flag: "🇧🇭", types: ["Work visa", "Visit"], portal: "LMRA", days: "10–25", needs: ["Passport bio page", "Employer approval", "Medical", "Police clearance"] },
  { code: "GB", name: "United Kingdom", bn: "যুক্তরাজ্য", flag: "🇬🇧", types: ["Standard Visitor", "Skilled Worker", "Student"], portal: "UKVI", days: "15–40", needs: ["Passport bio page", "Bank statement 6 months", "Employment / business proof", "Accommodation", "Sponsor letter", "TB certificate (if applicable)"] },
  { code: "CA", name: "Canada", bn: "কানাডা", flag: "🇨🇦", types: ["Visitor TRV", "Study permit", "Work permit", "Express Entry"], portal: "IRCC portal", days: "30–90", needs: ["Passport bio page", "Funds proof", "Employment letter", "IELTS (study/work)", "Family information form"] },
  { code: "DE", name: "Germany", bn: "জার্মানি", flag: "🇩🇪", types: ["National D", "Schengen C", "Job seeker"], portal: "Consular services", days: "20–60", needs: ["Passport bio page", "Motivation letter", "Employment contract", "Insurance", "Accommodation"] },
  { code: "US", name: "United States", bn: "যুক্তরাষ্ট্র", flag: "🇺🇸", types: ["B1/B2", "F1", "H1B"], portal: "CEAC DS-160", days: "30–120", needs: ["Passport bio page", "DS-160 confirmation", "Funds proof", "Ties to home country", "Invitation (if B2)"] },
];

export function findCountry(code: string | undefined): Country | undefined {
  return COUNTRIES.find((c) => c.code === code);
}


/* Practical desk data: fees, employer cost, payroll and demand roles. */
const EXTRA: Record<string, Pick<Country, "fee" | "employer" | "payroll" | "permit" | "pathways" | "roles">> = {
  AU: { fee: "AUD 195 visitor · AUD 2,000+ sponsor", employer: "Sponsor levy AUD 1,200–1,800 + SAF", payroll: "Super 12% · PAYG withholding", permit: "482 / 186 nomination", pathways: ["482 → 186", "189 points", "Student → 485"], roles: ["Chef", "Aged care", "Welder", "Electrician", "Truck driver"] },
  NZ: { fee: "NZD 246 visitor · NZD 750 work", employer: "Accredited employer + job check", payroll: "KiwiSaver 3% · PAYE", permit: "AEWV", pathways: ["AEWV → residence", "Green list straight to residence"], roles: ["Dairy farm", "Construction", "Hospitality", "Engineer"] },
  RS: { fee: "EUR 60 C · EUR 100 D", employer: "Work permit via NES, no levy", payroll: "11.5% social · 10% income", permit: "Visa D + work permit", pathways: ["Visa D → temporary residence", "Family reunification"], roles: ["Construction", "Factory", "Driver", "Welder"] },
  MD: { fee: "EUR 80", employer: "Employer submits invitation", payroll: "23% social · 12% income", permit: "Right to work + stay", pathways: ["Work → permanent residence"], roles: ["Textile", "Construction", "Agri"] },
  EE: { fee: "EUR 80–120", employer: "Employer registers vacancy (Töötukassa)", payroll: "33% social tax", permit: "Short-term D + residence", pathways: ["Residence → EU long-term"], roles: ["Welder", "Warehouse", "IT", "Construction"] },
  LT: { fee: "EUR 60–120", employer: "Work permit + mediation letter", payroll: "Sodra 23.3%", permit: "National visa D", pathways: ["D → temporary residence → PR"], roles: ["Truck driver", "Welder", "Construction", "Food production"] },
  MT: { fee: "EUR 80–90", employer: "Single permit application", payroll: "SSC 10% employee", permit: "Single Permit", pathways: ["Single permit → long-term residence"], roles: ["Hospitality", "Cleaning", "Care", "Construction"] },
  ME: { fee: "EUR 60", employer: "Employer obtains work permit first", payroll: "Social 15.5% · tax 9–15%", permit: "Work + stay permit", pathways: ["Temporary residence renewal"], roles: ["Construction", "Tourism", "Kitchen"] },
  MA: { fee: "MAD 400–800", employer: "ANAPEC contract approval", payroll: "CNSS 4.48% employee", permit: "Work authorisation", pathways: ["Contract renewal"], roles: ["Textile", "Agri", "Construction"] },
  SG: { fee: "SGD 30 visitor · SGD 105 work pass", employer: "Levy SGD 300–950 + security bond", payroll: "CPF for locals only", permit: "Work Permit / S Pass / EP", pathways: ["WP → SP → EP", "EP → PR"], roles: ["Construction", "Marine", "Process", "F&B"] },
  MY: { fee: "MYR 100 visitor", employer: "Levy + FWCS insurance", payroll: "EPF 12–13% employer", permit: "PLKS / Employment Pass", pathways: ["PLKS renewal", "EP → PR"], roles: ["Plantation", "Manufacturing", "Services"] },
  SA: { fee: "SAR 300+", employer: "Qiwa quota + levy SAR 800/mo", payroll: "GOSI 2% employee", permit: "Iqama work visa", pathways: ["Iqama renewal", "Premium residency"], roles: ["Driver", "Electrician", "Welder", "Nurse", "Chef"] },
  AE: { fee: "AED 350 visitor · AED 3,000+ work", employer: "Quota + salary deposit, no levy", payroll: "No income tax · WPS salary", permit: "Employment visa + Emirates ID", pathways: ["Employment → Golden Visa"], roles: ["Driver", "Security", "Hospitality", "Technician"] },
  KW: { fee: "KWD 3 visitor", employer: "Work visa quota + deposit", payroll: "PIFSS 11.5% employer", permit: "Article 18 work visa", pathways: ["Transfer between employers"], roles: ["Domestic", "Driver", "Cleaning", "Nursing"] },
  BH: { fee: "BHD 25 visitor", employer: "LMRA permit + levy", payroll: "GOSI 12% employer", permit: "Work permit + CPR", pathways: ["Permit renewal", "Golden residency"], roles: ["Construction", "Hospitality", "Retail"] },
  GB: { fee: "£127 visitor · £719–1,500 sponsor", employer: "Sponsor licence £574 + CoS £239 + ISC £1,000/yr", payroll: "PAYE 20% · NI 8%", permit: "Skilled Worker CoS", pathways: ["Skilled Worker → ILR 5 yr", "Student → Graduate"], roles: ["Care worker", "Chef", "Nurse", "Software engineer"] },
  CA: { fee: "CAD 100 visitor · CAD 155 work", employer: "LMIA CAD 1,000", payroll: "CPP 5.95% · EI 1.66%", permit: "Work permit (LMIA / IMP)", pathways: ["PGWP → PR", "LMIA → PR"], roles: ["Truck driver", "Farm", "Food service", "Technician"] },
  DE: { fee: "EUR 75–90", employer: "BA approval + priority check", payroll: "Social 20% · tax bands", permit: "National visa D + Blue Card", pathways: ["Blue Card → PR 21 mo", "Job seeker visa"], roles: ["Nurse", "Electrician", "Chef", "IT"] },
  US: { fee: "USD 185 B1/B2 · USD 205 H-1B", employer: "H-1B lottery · LCA · USD 780+", payroll: "FICA 7.65% · federal tax", permit: "H-1B / H-2B / EB", pathways: ["H-1B → EB-2/3", "EB-5"], roles: ["Nurse", "IT", "Chef", "Agriculture"] },
};
for (const c of COUNTRIES) Object.assign(c, EXTRA[c.code] ?? {});

export function countryBlock(code: string | undefined): string {
  const c = findCountry(code);
  if (!c) return "";
  return [
    `Active country: ${c.name} (${c.bn}).`,
    `Visa types handled: ${c.types.join(", ")}.`,
    `Official portal: ${c.portal}. Typical processing: ${c.days} days.`,
    `Core documents: ${c.needs.join("; ")}.`,
    "Always answer for this country first, list exact documents, fees and steps, and say clearly when a rule must be confirmed on the official portal.",
  ].join("\n");
}
