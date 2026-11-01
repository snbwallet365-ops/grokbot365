// Built-in expert knowledge injected into specialist bots and seeded into the Brain.

export const VISA_KNOWLEDGE = `
# VISA EXPERT KNOWLEDGE BASE (built-in)

## Universal principles officers assess
1. Genuine purpose of travel (clear, consistent, documented itinerary).
2. Strong ties to home country (employment, property, family, studies, business).
3. Sufficient & legitimate funds (source explained; no unexplained large deposits right before applying).
4. Immigration history (past overstays, refusals, deportations MUST be disclosed truthfully).
5. Consistency between forms, documents, and interview answers.
6. Credibility — any misrepresentation can create long or permanent bans.

## Common refusal codes & meaning
### United States
- INA 214(b): Failed to overcome presumption of immigrant intent / weak ties. Not permanent. Reapply only when circumstances materially changed. No appeal. Interview is decisive — answers must be short, clear, confident.
- INA 221(g): Administrative processing / missing documents. Submit requested docs; track at ceac.state.gov.
- INA 212(a)(6)(C)(i): Misrepresentation/fraud — PERMANENT bar; needs waiver (I-601 / nonimmigrant waiver via 212(d)(3)).
- INA 212(a)(9)(B): Unlawful presence 180+ days → 3-year bar; 1+ year → 10-year bar.
### United Kingdom
- Para V4.2(a)/(c): Not satisfied you are a genuine visitor / will leave at end of visit.
- V4.2(e): Insufficient funds or unclear source of funds.
- Para 9.7.1 / 9.7.2 (Part 9): Deception / false documents → 10-year ban possible.
- Para 9.8.x: Previous breach of immigration law.
- No appeal for visit visas (only Judicial Review / human-rights claims). Fix every point in refusal letter before reapplying.
### Schengen (standard refusal form, 13 grounds)
1. False/forged travel document. 2. Purpose and conditions of stay not justified. 3. Insufficient means of subsistence. 4. Already stayed 90 days in current 180-day period. 5. SIS alert. 6. Threat to public policy. 7. No valid travel medical insurance (min €30,000 cover). 8. Unreliable info on purpose/conditions. 9. Intention to leave before visa expiry not established. 10. Insufficient proof of ability to return. (Codes vary by consulate.)
- Appeal is possible (deadlines usually 15–30 days, consulate-specific). A strong appeal addresses each ticked ground with new evidence.
### Canada
- IRPR R179(b): Officer not satisfied you will leave at end of stay (family ties, travel history, purpose, finances, employment).
- R216(1)(b): Study permit — not satisfied you'll leave; often weak study plan / program not logical.
- A40 misrepresentation: 5-year ban.
- Request GCMS notes (ATIP) to see officer's actual reasoning before reapplying.
### Australia
- Genuine Temporary Entrant / Genuine Student (GS) requirement; PIC 4020 (false info → 3-year exclusion); Schedule 3 criteria; Condition 8503 "No further stay".
- Some refusals reviewable at the ART (Administrative Review Tribunal) — strict deadlines.

## Refusal analysis method (use step by step)
1. Quote the exact refusal ground(s) from the letter.
2. Map each ground → the evidence the officer found missing.
3. Identify inconsistencies (dates, salary, sponsor details, travel history).
4. Decide: Reapply vs Appeal vs Admin Review vs Waiver.
5. Build an evidence plan per ground.
6. Draft a concise cover letter (1–2 pages) answering each ground.
7. Pre-submission checklist & interview prep (10–15 likely questions with model answers).

## Strong evidence by category
- Employment: employment letter (position, salary, start date, approved leave, return date), 3–6 payslips, tax returns.
- Business owners: business registration, tax filings, bank statements of business, client contracts.
- Students: enrollment letter, leave approval, transcripts.
- Finances: 3–6 months statements, explanation letter for large deposits, property/FD/investments.
- Family ties: marriage/birth certificates, dependents, property deeds.
- Travel history: previous visas & stamps (especially US/UK/Schengen/Canada/Australia).
- Sponsor: invitation letter, sponsor ID/status, sponsor bank statements, relationship proof.
- Itinerary: refundable flight hold, hotel bookings, day plan, insurance (Schengen ≥ €30k).

## Red flags to fix
- Sudden large deposits without explanation; funds borrowed shortly before.
- Itinerary not matching leave dates; vague purpose; first long-haul trip with no travel history and weak ties.
- Inconsistent employment/income across documents; undisclosed previous refusals.
- Over-documented generic templates; fake bookings.

## Student visa specifics
- Logical study progression; career outcome in home country; tuition paid / funds shown; English test scores; Statement of Purpose specific to course & institution; gap explanation.

## Ethics
- Never advise misrepresentation, fake documents, or hiding refusals. Always recommend verifying with official government sources and, where stakes are high, a licensed immigration lawyer/OISC/RCIC/MARA agent.
`;

export const LEGAL_KNOWLEDGE = `
# LEGAL DOCUMENTATION EXPERT KNOWLEDGE (built-in)

## Drafting principles
- Identify parties precisely (full legal names, addresses, entity type, registration numbers).
- Define terms in a Definitions clause; use defined terms consistently (Capitalised).
- One obligation per sentence; use "shall" for obligations, "may" for permissions.
- Include: Effective Date, Term, Termination, Governing Law, Jurisdiction/Dispute Resolution, Notices, Entire Agreement, Severability, Amendment, Waiver, Counterparts, Signatures with date blocks.
- Put bracketed placeholders like [PARTY A NAME] for missing info and list them at the end.

## Templates you can produce
- Mutual / Unilateral NDA (definition of Confidential Information, exclusions, term 2–5 yrs, return/destruction, remedies incl. injunctive relief).
- Service Agreement / Freelance Contract (scope, deliverables, milestones, fees, payment terms, IP assignment, warranties, limitation of liability, indemnity).
- Employment Offer Letter & Employment Contract (role, compensation, probation, notice, confidentiality, non-solicit).
- Residential Lease / Rental Agreement (rent, deposit, maintenance, utilities, termination, inventory).
- Power of Attorney (general / specific / durable; principal, agent, powers, limits, revocation, notarisation).
- Affidavit / Sworn Statement (deponent details, numbered facts, verification, notary/commissioner block).
- Sponsorship / Invitation Letter for visas; Affidavit of Support; Employer No-Objection Certificate (NOC); Leave approval letter.
- Privacy Policy & Terms of Service (GDPR/CCPA aware: data collected, purpose, legal basis, retention, rights, contact).
- Demand Letter / Legal Notice; Cease & Desist; Settlement Agreement; Memorandum of Understanding (MoU); Partnership / Shareholder Agreement outline; Last Will outline.

## Formatting output
- Title in caps, then parties block, recitals (WHEREAS), numbered clauses (1., 1.1, 1.2), signature block.
- Finish with: "Placeholders to complete" list and "Jurisdiction notes".

## Disclaimer (always include briefly)
- "This document is a draft for information purposes and is not legal advice. Have it reviewed by a qualified lawyer in your jurisdiction before signing."
`;

export const PDF_KNOWLEDGE = `
# PDF DOCUMENT EXPERT
- Produce well-structured Markdown: one "# Title", "## Section" headings, short paragraphs, bullet lists, numbered lists and simple tables.
- When the user wants a PDF, write the full document, then call the pdf tool with the title and the full markdown content.
- Supported document types: reports, resumes/CVs, cover letters, invoices, proposals, itineraries, checklists, meeting minutes, certificates, letters.
`;

export const GROK_HARNESS_KNOWLEDGE = `
# How Grok Bot works (harness knowledge)
- A turn = one accepted unit of work. A step = one model-and-tool cycle within a turn.
- The desktop/app sends a message → host builds model context (base policy, profile, pinned sections, rules, skills, tool catalog, user action, history) → calls the provider → runs requested tools → appends tool results → decides whether another step is needed.
- Checkpoints save conversation + run state; the transcript is what the user sees; learned memory stores facts for future conversations — these are separate stores.
- Tools: SendToUser (with end_turn), browser, shell, files, MCP, hosted search/media/voice, subagents (task), send_to_agent for peer bots.
- Peer messages and routines get their own prompt context; they are NOT presented as human instructions.
- Compaction: when context grows, a summary carrier replaces older messages while preserving system prefix and latest user query.
- Permissions: sensitive actions (sending messages, purchases) require user approval.
- Routines wake a Bot on schedule without a prompt. All Bots share one computer; Bots are an organisation tool, not a security boundary.
`;

export const BASE44_KNOWLEDGE = `
# APP BUILDER (Base44-style) EXPERT
- You build complete, working web apps from a plain-language description.
- Always output ONE self-contained HTML file inside a single \`\`\`html code block: include <style> and <script>, use Tailwind via <script src="https://cdn.tailwindcss.com"></script> if useful, no external build step.
- Use localStorage for persistence (acts as the app's database), make it mobile-first, iOS-clean, with real working logic (CRUD, filters, forms, validation).
- After the code block, give a 3-bullet summary of features and how to extend it.
`;

export const BROWSER_AGENT_KNOWLEDGE = `
# BROWSER-USE AGENT
- You control a real web browser through tools. Plan briefly, then act step by step.
- Prefer: search → open the best result → extract facts → answer with sources (URLs).
- Never invent page contents; only report what tools returned.
`;
