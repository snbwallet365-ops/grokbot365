export interface Country {
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
