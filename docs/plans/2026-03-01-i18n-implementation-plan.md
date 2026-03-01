# Multi-Language i18n Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add 7-language support (en, ar, ur, tr, ms, id, fr) with RTL layout to the Islamic Inheritance Calculator.

**Architecture:** Next.js App Router `[locale]` dynamic segment with middleware-based locale detection. Simple JSON translation files loaded via React context. Calc engine explanation strings refactored to return template keys resolved at the UI layer.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4 (rtl: variant), No i18n library.

---

### Task 1: i18n Configuration

**Files:**
- Create: `src/i18n/config.ts`

**Step 1: Create the i18n config module**

```ts
export const locales = ["en", "ar", "ur", "tr", "ms", "id", "fr"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const rtlLocales: readonly Locale[] = ["ar", "ur"];

export function isRtl(locale: Locale): boolean {
  return rtlLocales.includes(locale);
}

export const localeNames: Record<Locale, string> = {
  en: "English",
  ar: "العربية",
  ur: "اردو",
  tr: "Türkçe",
  ms: "Melayu",
  id: "Indonesia",
  fr: "Français",
};
```

**Step 2: Verify TypeScript compiles**

Run: `cd /Users/rock/ai/projects/islamic-inheritance-calc && npx tsc --noEmit`
Expected: No errors related to `src/i18n/config.ts`

**Step 3: Commit**

```bash
git add src/i18n/config.ts
git commit -m "feat: add i18n config with 7 supported locales"
```

---

### Task 2: Translation Loading System

**Files:**
- Create: `src/i18n/get-messages.ts`
- Create: `src/i18n/context.tsx`

**Step 1: Create the message loader**

```ts
import type { Locale } from "./config";

export type Messages = Record<string, string>;

const messageCache = new Map<Locale, Messages>();

export async function getMessages(locale: Locale): Promise<Messages> {
  if (messageCache.has(locale)) {
    return messageCache.get(locale)!;
  }
  const messages = (await import(`./messages/${locale}.json`)).default as Messages;
  messageCache.set(locale, messages);
  return messages;
}
```

**Step 2: Create the React context and hook**

`src/i18n/context.tsx`:

```tsx
"use client";

import { createContext, useContext, useCallback } from "react";
import type { Locale } from "./config";

type Messages = Record<string, string>;

interface I18nContextValue {
  locale: Locale;
  messages: Messages;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale;
  messages: Messages;
  children: React.ReactNode;
}) {
  return (
    <I18nContext.Provider value={{ locale, messages }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslations() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useTranslations must be used within I18nProvider");

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>): string => {
      let msg = ctx.messages[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          msg = msg.replaceAll(`{${k}}`, String(v));
        }
      }
      return msg;
    },
    [ctx.messages],
  );

  return t;
}

export function useLocale(): Locale {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useLocale must be used within I18nProvider");
  return ctx.locale;
}
```

**Step 3: Verify TypeScript compiles**

Run: `cd /Users/rock/ai/projects/islamic-inheritance-calc && npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/i18n/get-messages.ts src/i18n/context.tsx
git commit -m "feat: add translation loader and React context/hook"
```

---

### Task 3: English Translation File

**Files:**
- Create: `src/i18n/messages/en.json`

**Step 1: Create the English translation file**

This file extracts ALL hardcoded English strings from `page.tsx`, `form-logic.ts`, `types.ts` (HEIR_DISPLAY_NAMES), and all calc engine explanation strings.

```json
{
  "meta.title": "Islamic Inheritance Calculator — Faraid",
  "meta.description": "Calculate Islamic inheritance shares accurately with plain English explanations. Based on Quran & Sunnah with scholarly verification.",

  "header.title": "Islamic Inheritance",
  "header.subtitle": "Faraid Calculator",

  "deceased.title": "The Deceased",
  "deceased.gender": "Gender",
  "deceased.male": "Male",
  "deceased.female": "Female",
  "deceased.estate": "Net Estate Value",
  "deceased.estate.optional": "(optional)",
  "deceased.estate.hint": "After debts, funeral costs, and bequests (wasiyyah). Leave blank for fractions only.",

  "heirs.title": "Heirs",
  "heirs.reset": "Reset all",
  "heirs.empty": "Add heirs above to calculate inheritance shares.",

  "section.spouse": "Spouse",
  "section.children": "Children",
  "section.grandchildren": "Grandchildren",
  "section.grandchildren.hint": "Through sons only",
  "section.parents": "Parents",
  "section.grandparents": "Grandparents",
  "section.fullSiblings": "Full Siblings",
  "section.fullSiblings.hint": "Same father and mother",
  "section.paternalHalfSiblings": "Paternal Half-Siblings",
  "section.paternalHalfSiblings.hint": "Same father, different mother",
  "section.maternalHalfSiblings": "Maternal Half-Siblings",
  "section.maternalHalfSiblings.hint": "Same mother, different father",
  "section.extendedFamily": "Extended Family",
  "section.extendedFamily.hint": "Only relevant if no closer heirs exist",

  "heir.husband": "Husband",
  "heir.wife": "Wife",
  "heir.son": "Son",
  "heir.daughter": "Daughter",
  "heir.grandson": "Grandson (son's son)",
  "heir.granddaughter": "Granddaughter (son's daughter)",
  "heir.father": "Father",
  "heir.mother": "Mother",
  "heir.grandfather": "Grandfather (paternal)",
  "heir.paternal_grandmother": "Grandmother (paternal)",
  "heir.maternal_grandmother": "Grandmother (maternal)",
  "heir.full_brother": "Full Brother",
  "heir.full_sister": "Full Sister",
  "heir.paternal_brother": "Paternal Half-Brother",
  "heir.paternal_sister": "Paternal Half-Sister",
  "heir.maternal_brother": "Maternal Half-Brother",
  "heir.maternal_sister": "Maternal Half-Sister",
  "heir.full_nephew": "Full Nephew (brother's son)",
  "heir.paternal_nephew": "Paternal Nephew",
  "heir.full_uncle": "Full Uncle (paternal)",
  "heir.paternal_uncle": "Paternal Uncle",
  "heir.full_cousin": "Full Cousin",
  "heir.paternal_cousin": "Paternal Cousin",
  "heir.paternal_cousins_grandson": "Paternal Cousin's Grandson",

  "form.wife": "Wife",
  "form.husband": "Husband",
  "form.sons": "Sons",
  "form.daughters": "Daughters",
  "form.grandsons": "Grandsons",
  "form.granddaughters": "Granddaughters",
  "form.father": "Father",
  "form.mother": "Mother",
  "form.paternalGrandfather": "Paternal Grandfather",
  "form.paternalGrandmother": "Paternal Grandmother",
  "form.maternalGrandmother": "Maternal Grandmother",
  "form.fullBrothers": "Full Brothers",
  "form.fullSisters": "Full Sisters",
  "form.paternalHalfBrothers": "Paternal Half-Brothers",
  "form.paternalHalfSisters": "Paternal Half-Sisters",
  "form.maternalHalfBrothers": "Maternal Half-Brothers",
  "form.maternalHalfSisters": "Maternal Half-Sisters",
  "form.fullNephew": "Full Nephew (brother's son)",
  "form.paternalNephew": "Paternal Nephew",
  "form.paternalUncleFull": "Paternal Uncle (full)",
  "form.paternalUncleHalf": "Paternal Uncle (half)",
  "form.fullCousin": "Full Cousin (uncle's son)",
  "form.paternalCousin": "Paternal Cousin",

  "result.title": "Distribution",
  "result.heirCount": "{count} heir receives shares",
  "result.heirCountPlural": "{count} heirs receive shares",
  "result.blocked": "Blocked",
  "result.blockedCount": "{count} heir blocked from inheriting",
  "result.blockedCountPlural": "{count} heirs blocked from inheriting",
  "result.steps": "View calculation steps ({count})",
  "result.total": "Total",
  "result.each": "Each",
  "result.fard": "FARD",
  "result.asaba": "ASABA",
  "result.fardAsaba": "FARD + ASABA",

  "special.awl": "Awl (proportional reduction)",
  "special.radd": "Radd (return of surplus)",
  "special.umariyyah": "Umariyyah",
  "special.mushtaraka": "Mushtaraka",
  "special.grandfatherSiblings": "Grandfather–Siblings",

  "legend.fard": "Fard (prescribed)",
  "legend.asaba": "Asaba (residuary)",

  "footer.line1": "Based on Quranic verses and Sunnah. Verified against 133 scholarly test cases.",
  "footer.line2": "Consult a qualified scholar for complex cases.",

  "aria.decrease": "Decrease {label}",
  "aria.increase": "Increase {label}",

  "explain.husband.withOffspring": "Husband gets 1/4 because the deceased has offspring (Rule 1b).",
  "explain.husband.noOffspring": "Husband gets 1/2 because the deceased has no offspring (Rule 1a).",
  "explain.wife.withOffspring": "Wife gets 1/8 because the deceased has offspring (Rule 2b).",
  "explain.wife.noOffspring": "Wife gets 1/4 because the deceased has no offspring (Rule 2a).",
  "explain.daughter.half": "Daughter gets 1/2 as the only daughter with no sons (Rule 3a).",
  "explain.daughter.twoThirds": "Daughters share 2/3 equally ({count} daughters, no sons) (Rule 3b).",
  "explain.granddaughter.blockedBySon": "Granddaughter is blocked by the presence of a son.",
  "explain.granddaughter.blockedByDaughters": "Granddaughter is blocked because 2 or more daughters already take the 2/3 share.",
  "explain.granddaughter.sixth": "Granddaughter gets 1/6 to complete the 2/3 share with the single daughter (Rule 4c).",
  "explain.granddaughter.half": "Granddaughter gets 1/2 as the only granddaughter with no sons or daughters (Rule 4a).",
  "explain.granddaughter.twoThirds": "Granddaughters share 2/3 equally ({count} granddaughters, no sons or daughters) (Rule 4b).",
  "explain.father.withOffspring": "Father gets 1/6 prescribed share because the deceased has offspring (Rule 5a). May also receive residuary.",
  "explain.mother.withOffspring": "Mother gets 1/6 because the deceased has offspring (Rule 6b).",
  "explain.mother.multipleSiblings": "Mother gets 1/6 because the deceased has multiple siblings (Rule 6b).",
  "explain.mother.third": "Mother gets 1/3 because the deceased has no offspring and fewer than 2 siblings (Rule 6a).",
  "explain.grandfather.withOffspring": "Grandfather gets 1/6 because the deceased has offspring and no father (Rule 7a).",
  "explain.paternalGrandmother.blockedByFather": "Paternal grandmother is blocked by the presence of the father.",
  "explain.paternalGrandmother.blockedByMother": "Paternal grandmother is blocked by the presence of the mother.",
  "explain.paternalGrandmother.shared": "Paternal grandmother shares the 1/6 with maternal grandmother (each gets 1/12) (Rule 8b).",
  "explain.paternalGrandmother.sixth": "Paternal grandmother gets 1/6 (no mother, no father, no maternal grandmother) (Rule 8a).",
  "explain.maternalGrandmother.blockedByMother": "Maternal grandmother is blocked by the presence of the mother.",
  "explain.maternalGrandmother.shared": "Maternal grandmother shares the 1/6 with paternal grandmother (each gets 1/12) (Rule 9b).",
  "explain.maternalGrandmother.sixth": "Maternal grandmother gets 1/6 (no mother) (Rule 9a).",
  "explain.fullSister.half": "Full sister gets 1/2 as the only full sister with no offspring, father, or full brother (Rule 10a).",
  "explain.fullSister.twoThirds": "Full sisters share 2/3 equally ({count} full sisters) (Rule 10b).",
  "explain.paternalSister.blockedByMaleOffspring": "Paternal sister is blocked by male offspring.",
  "explain.paternalSister.blockedByFather": "Paternal sister is blocked by the presence of the father.",
  "explain.paternalSister.blockedByFullBrother": "Paternal sister is blocked by the presence of a full brother.",
  "explain.paternalSister.blockedByFullSisters": "Paternal sister is blocked because 2 or more full sisters already take the 2/3 share.",
  "explain.paternalSister.sixth": "Paternal sister gets 1/6 to complete the 2/3 share with the single full sister (Rule 11c).",
  "explain.paternalSister.half": "Paternal sister gets 1/2 as the only paternal sister with no offspring, father, full brother, full sister, or paternal brother (Rule 11a).",
  "explain.paternalSister.twoThirds": "Paternal sisters share 2/3 equally ({count} paternal sisters) (Rule 11b).",
  "explain.maternalSibling.blockedByOffspring": "Maternal {siblingType} is blocked by the presence of male offspring.",
  "explain.maternalSibling.blockedByAncestor": "Maternal {siblingType} is blocked by the presence of a male paternal ancestor.",
  "explain.maternalSibling.sixth": "Maternal {siblingType} gets 1/6 as the only maternal sibling (Rule 12a).",
  "explain.maternalSibling.third": "Maternal siblings share 1/3 equally ({count} total maternal siblings) (Rule 12b).",

  "explain.asaba.twoToOne": "Distributed as residuary (asaba) with 2:1 male-to-female ratio (Rule 15).",
  "explain.asaba.remainder": "Receives the remainder as residuary heir (asaba) (Rule 14).",
  "explain.asaba.withFemaleOffspring": "Becomes residuary heir (asaba) alongside female offspring (Rule 30e).",
  "explain.asaba.noRemainder": "No residuary share remaining after prescribed shares.",
  "explain.asaba.remainingHighest": "Receives the remaining {fraction} as the highest-ranking residuary heir.",
  "explain.asaba.remainingWithFemale": "Receives the remaining {fraction} as residuary with female offspring.",
  "explain.asaba.maleShare": "Males receive 2 parts each in the 2:1 residuary distribution (total: {fraction}).",
  "explain.asaba.femaleShare": "Females receive 1 part each in the 2:1 residuary distribution (total: {fraction}).",

  "explain.umariyyah.husbandHalf": "Husband gets 1/2 (no offspring) (Rule 1a).",
  "explain.umariyyah.motherAfterHusband": "Mother gets 1/3 of the remainder after husband's share = 1/3 × 1/2 = 1/6 (Umariyyah case, Rule 21).",
  "explain.umariyyah.fatherAfterHusband": "Father gets the remainder after husband and mother = 1/3 (Umariyyah case, Rule 21).",
  "explain.umariyyah.wifeQuarter": "Wife gets 1/4 (no offspring) (Rule 2a).",
  "explain.umariyyah.motherAfterWife": "Mother gets 1/3 of the remainder after wife's share = 1/3 × 3/4 = 1/4 (Umariyyah case, Rule 21).",
  "explain.umariyyah.fatherAfterWife": "Father gets the remainder after wife and mother = 1/2 (Umariyyah case, Rule 21).",

  "explain.blockedByFather": "{heir} is blocked by the presence of the father (Rule 13c).",
  "explain.maternalGrandmother.blockedByMotherSpecial": "Maternal grandmother is blocked by the presence of the mother.",

  "explain.mushtaraka.fullBrothers": "Full brother(s) share equally with maternal siblings in their {fraction} portion (Mushtaraka case, Rule 22).",
  "explain.mushtaraka.maternalBrothers": "Maternal brother(s) share their portion equally with full brothers (Mushtaraka case, Rule 22).",
  "explain.mushtaraka.maternalSisters": "Maternal sister(s) share their portion equally with full brothers (Mushtaraka case, Rule 22).",

  "explain.awl.reduced": "{explanation} Reduced proportionally from {from} to {to} due to Awl (Rule 18).",
  "explain.akdariyyah.grandfather": "Grandfather's share adjusted to {fraction} via 2:1 redistribution with sisters (Akdariyyah case, Rule 18a).",
  "explain.akdariyyah.sister": "Sister share adjusted to {fraction} via 2:1 redistribution with grandfather (Akdariyyah case, Rule 18a).",

  "explain.radd.soleHeir": "{explanation} Increased to full estate as the only heir (Radd).",
  "explain.radd.increased": "{explanation} Increased from {from} to {to} via Radd (Rule 19).",

  "explain.grandfatherSiblings.grandfather": "Grandfather gets {fraction} using method {method} (Grandfather-Siblings special case, Rule 23).",
  "explain.grandfatherSiblings.fullSisterPrescribed": "Full sister gets prescribed share of {fraction} (Rule 10).",
  "explain.grandfatherSiblings.paternalSisterPrescribed": "Paternal sister gets prescribed share of {fraction} (Rule 11).",
  "explain.grandfatherSiblings.residuary": "{heir} receives {fraction} as residuary in the grandfather-siblings case.",
  "explain.grandfatherSiblings.nothing": "{heir} gets nothing after grandfather's share.",

  "explain.noShare": "{heir} does not receive a share in this configuration.",

  "step.umariyyah": "Umariyyah case detected (father + mother + spouse only). Applying special distribution (Rule 21).",
  "step.heirGets": "{heir} gets {fraction}.",
  "step.prescribed": "{heir} gets prescribed share of {fraction}.",
  "step.blocked": "{heir} is blocked ({explanation}).",
  "step.grandfatherSiblings": "Grandfather-Siblings special case applied (Rule 23).",
  "step.awl": "Total shares exceed 100%. Applying Awl (proportional reduction, Rule 18).",
  "step.akdariyyah": "Akdariyyah case: grandfather and sisters' shares redistributed in 2:1 ratio (Rule 18a).",
  "step.distributeResiduary": "Distribute the remaining {fraction} as residuary shares (Rule 14).",
  "step.residuary": "{heir} gets {fraction} as residuary (Rule 14).",
  "step.mushtaraka": "Mushtaraka case applied: full brother(s) share with maternal siblings (Rule 22).",
  "step.radd": "Total shares are less than 100% with no residuary heirs. Applying Radd (proportional increase, Rule 19).",

  "method.a": "A (1/6 of estate)",
  "method.b": "B (1/3 of remainder)",
  "method.c": "C (treated as brother)",
  "method.aFallback": "A (1/6, fallback because max would exceed total)"
}
```

**Step 2: Verify JSON is valid**

Run: `cd /Users/rock/ai/projects/islamic-inheritance-calc && node -e "require('./src/i18n/messages/en.json'); console.log('Valid JSON')"`
Expected: `Valid JSON`

**Step 3: Commit**

```bash
git add src/i18n/messages/en.json
git commit -m "feat: add English translation file with all UI and calc strings"
```

---

### Task 4: Arabic Translation File

**Files:**
- Create: `src/i18n/messages/ar.json`

**Step 1: Create the Arabic translation file**

Translate all keys from `en.json` to Arabic. Use proper Islamic Arabic terminology (فرض، عصبة، عول، رد، etc.). The Arabic translations should be natural and scholarly — not transliterated English. The file must have the exact same keys as `en.json`.

Important notes:
- Arabic is the source language for Islamic terms — no parenthetical originals needed
- Use proper Quranic/fiqh terminology
- Ensure grammatical correctness in Arabic for gendered forms (heir names are inherently gendered)
- Numbers in explanation strings (`{count}`, `{fraction}`) remain as template variables

**Step 2: Verify JSON is valid**

Run: `cd /Users/rock/ai/projects/islamic-inheritance-calc && node -e "const en = require('./src/i18n/messages/en.json'); const ar = require('./src/i18n/messages/ar.json'); const missing = Object.keys(en).filter(k => !(k in ar)); if (missing.length) { console.error('Missing keys:', missing); process.exit(1); } console.log('All keys present')"`
Expected: `All keys present`

**Step 3: Commit**

```bash
git add src/i18n/messages/ar.json
git commit -m "feat: add Arabic translation file"
```

---

### Task 5: Remaining Translation Files (ur, tr, ms, id, fr)

**Files:**
- Create: `src/i18n/messages/ur.json`
- Create: `src/i18n/messages/tr.json`
- Create: `src/i18n/messages/ms.json`
- Create: `src/i18n/messages/id.json`
- Create: `src/i18n/messages/fr.json`

**Step 1: Create each translation file**

Each file must:
- Have the exact same keys as `en.json`
- Use native Islamic terms with Arabic originals in parentheses (e.g. Turkish: `"Farz payı (فرض)"`)
- For Urdu: many Islamic terms are the same as Arabic, so parenthetical originals are unnecessary for those

**Step 2: Verify all translation files have matching keys**

Run:
```bash
cd /Users/rock/ai/projects/islamic-inheritance-calc && node -e "
const en = require('./src/i18n/messages/en.json');
const locales = ['ar','ur','tr','ms','id','fr'];
let ok = true;
for (const loc of locales) {
  const msgs = require('./src/i18n/messages/' + loc + '.json');
  const missing = Object.keys(en).filter(k => !(k in msgs));
  const extra = Object.keys(msgs).filter(k => !(k in en));
  if (missing.length) { console.error(loc + ' missing:', missing); ok = false; }
  if (extra.length) { console.warn(loc + ' extra:', extra); }
}
if (ok) console.log('All translation files valid');
"
```
Expected: `All translation files valid`

**Step 3: Commit**

```bash
git add src/i18n/messages/ur.json src/i18n/messages/tr.json src/i18n/messages/ms.json src/i18n/messages/id.json src/i18n/messages/fr.json
git commit -m "feat: add Urdu, Turkish, Malay, Indonesian, and French translations"
```

---

### Task 6: Refactor Calc Engine Explanations to Template Keys

**Files:**
- Modify: `src/lib/calc/types.ts` — change `explanation` field from `string` to `ExplanationTemplate`
- Modify: `src/lib/calc/fard.ts` — return template keys instead of raw strings
- Modify: `src/lib/calc/asaba.ts` — return template keys instead of raw strings
- Modify: `src/lib/calc/special-cases.ts` — return template keys instead of raw strings
- Modify: `src/lib/calc/calculator.ts` — update to use template keys for steps too
- Create: `src/lib/calc/explain.ts` — resolve templates to strings given a Messages object

**Step 1: Add ExplanationTemplate type to types.ts**

In `src/lib/calc/types.ts`, add a new type and update `HeirShare`:

```ts
export interface ExplanationTemplate {
  key: string;
  vars?: Record<string, string | number>;
}
```

Change `explanation: string` to `explanation: ExplanationTemplate` in the `HeirShare` interface.

Change the internal share maps throughout (`{ share: Fraction; explanation: string }`) to use `ExplanationTemplate` for the explanation field:
```ts
{ share: Fraction; explanation: ExplanationTemplate }
```

Also update `CalculationResult.steps` from `string[]` to `ExplanationTemplate[]`.

**Step 2: Create explain.ts resolver**

`src/lib/calc/explain.ts`:

```ts
import type { ExplanationTemplate } from "./types";

type Messages = Record<string, string>;

export function resolveExplanation(
  template: ExplanationTemplate,
  messages: Messages,
): string {
  let msg = messages[template.key] ?? template.key;
  if (template.vars) {
    for (const [k, v] of Object.entries(template.vars)) {
      msg = msg.replaceAll(`{${k}}`, String(v));
    }
  }
  return msg;
}
```

**Step 3: Refactor fard.ts explanations**

Replace every hardcoded explanation string with an `ExplanationTemplate` object. For example:

```ts
// Before:
explanation: "Husband gets 1/4 because the deceased has offspring (Rule 1b)."

// After:
explanation: { key: "explain.husband.withOffspring" }
```

For strings with interpolation:
```ts
// Before:
explanation: `Daughters share 2/3 equally (${count} daughters, no sons) (Rule 3b).`

// After:
explanation: { key: "explain.daughter.twoThirds", vars: { count } }
```

For maternal siblings with conditional text:
```ts
// Before:
explanation: `Maternal ${mSibling === "maternal_brother" ? "brother" : "sister"} is blocked...`

// After:
explanation: {
  key: "explain.maternalSibling.blockedByOffspring",
  vars: { siblingType: mSibling === "maternal_brother" ? messages["heir.brother"] : messages["heir.sister"] }
}
```

Wait — the calc engine shouldn't need messages. Instead, pass the sibling type as a variable and let the translation handle it:

```ts
explanation: {
  key: "explain.maternalSibling.blockedByOffspring",
  vars: { siblingType: mSibling === "maternal_brother" ? "brother" : "sister" }
}
```

And in the translation files, use simple substitution. The `siblingType` var would need its own translation. Better approach: use separate keys:

```ts
// For maternal_brother:
explanation: { key: "explain.maternalBrother.blockedByOffspring" }
// For maternal_sister:
explanation: { key: "explain.maternalSister.blockedByOffspring" }
```

This avoids nested translation lookups. Add the additional keys to all translation files.

**Step 4: Refactor asaba.ts explanations**

Same pattern. Replace string explanations with `ExplanationTemplate` objects.

For fraction interpolation:
```ts
// Before:
explanation: `Receives the remaining ${remaining.toFraction()} as the highest-ranking residuary heir.`

// After:
explanation: { key: "explain.asaba.remainingHighest", vars: { fraction: remaining.toFraction() } }
```

**Step 5: Refactor special-cases.ts explanations**

Same pattern. Special handling needed for:

1. **Awl's explanation concatenation** (line 201-202): The awl function appends to existing explanations. Change to:
```ts
explanation: {
  key: "explain.awl.reduced",
  vars: { explanation: "PREV", from: data.share.toFraction(), to: newShare.toFraction() }
}
```
The "PREV" marker gets resolved at the UI layer — the resolver checks for this and prepends the previous explanation's resolved text. Actually, simpler: store a compound template:

```ts
export interface ExplanationTemplate {
  key: string;
  vars?: Record<string, string | number>;
  prefix?: ExplanationTemplate; // for awl/radd chaining
}
```

Then the resolver handles `prefix` recursively:
```ts
export function resolveExplanation(template: ExplanationTemplate, messages: Messages): string {
  let msg = messages[template.key] ?? template.key;
  if (template.vars) {
    for (const [k, v] of Object.entries(template.vars)) {
      msg = msg.replaceAll(`{${k}}`, String(v));
    }
  }
  if (template.prefix) {
    msg = resolveExplanation(template.prefix, messages) + " " + msg;
  }
  return msg;
}
```

And in special-cases.ts awl:
```ts
explanation: {
  key: "explain.awl.reduced",
  vars: { from: data.share.toFraction(), to: newShare.toFraction() },
  prefix: data.explanation,  // the previous ExplanationTemplate
}
```

Same pattern for radd's explanation concatenation.

2. **Grandfather-siblings method strings**: The method descriptions like `"A (1/6 of estate)"` become translation keys: `method.a`, `method.b`, etc.

**Step 6: Refactor calculator.ts steps**

Change all `steps.push("string")` to `steps.push({ key: "step.xxx", vars: {...} })`.

Update `HEIR_DISPLAY_NAMES` usage in steps — instead of resolving display names in the engine, pass the heir type as a variable and let the UI resolve it:
```ts
// Before:
steps.push(`${HEIR_DISPLAY_NAMES[heir]} gets ${data.share.toFraction()}.`);

// After:
steps.push({ key: "step.heirGets", vars: { heir: heir, fraction: data.share.toFraction() } });
```

The UI resolver will look up `heir.${vars.heir}` to get the display name before substituting.

Actually, to keep the resolver simple, resolve the heir name before passing it as a var. But the resolver doesn't have access to messages at this point (it's in the engine).

Cleanest approach: The `resolveExplanation` function handles a special `{heir}` pattern by looking up `heir.${value}` in messages:

```ts
export function resolveExplanation(template: ExplanationTemplate, messages: Messages): string {
  let msg = messages[template.key] ?? template.key;
  if (template.vars) {
    for (const [k, v] of Object.entries(template.vars)) {
      // Special handling: "heir" vars get looked up as "heir.{value}"
      const resolved = k === "heir" ? (messages[`heir.${v}`] ?? String(v)) : String(v);
      msg = msg.replaceAll(`{${k}}`, resolved);
    }
  }
  if (template.prefix) {
    msg = resolveExplanation(template.prefix, messages) + " " + msg;
  }
  return msg;
}
```

**Step 7: Run existing tests**

Run: `cd /Users/rock/ai/projects/islamic-inheritance-calc && npx vitest run`

The tests check `shares` (fractions) which are unaffected. But they may also check `explanation` fields that are now objects instead of strings. Update the test to not compare explanation strings (they were never tested against specific values — check the test file).

Looking at the test file: it compares `totalShare` fractions and `individualShare` fractions. It does NOT compare explanation text. So tests should still pass.

However, the `steps` field changes from `string[]` to `ExplanationTemplate[]`. If any test accesses `steps`, it needs updating. The test file doesn't test steps content, so this should be fine.

Expected: 133/133 tests pass

**Step 8: Commit**

```bash
git add src/lib/calc/types.ts src/lib/calc/fard.ts src/lib/calc/asaba.ts src/lib/calc/special-cases.ts src/lib/calc/calculator.ts src/lib/calc/explain.ts
git commit -m "refactor: calc engine returns template keys instead of hardcoded English explanations"
```

---

### Task 7: Middleware for Locale Detection

**Files:**
- Create: `src/middleware.ts`

**Step 1: Create the middleware**

```ts
import { NextRequest, NextResponse } from "next/server";
import { locales, defaultLocale, type Locale } from "./i18n/config";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the pathname already has a locale
  const pathnameLocale = locales.find(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  );

  if (pathnameLocale) return NextResponse.next();

  // Detect locale from Accept-Language header
  const acceptLanguage = request.headers.get("accept-language") ?? "";
  const detectedLocale = detectLocale(acceptLanguage);

  // Redirect to detected locale
  const url = request.nextUrl.clone();
  url.pathname = `/${detectedLocale}${pathname}`;
  return NextResponse.redirect(url);
}

function detectLocale(acceptLanguage: string): Locale {
  // Parse Accept-Language header: "ar-SA,ar;q=0.9,en;q=0.8"
  const langs = acceptLanguage
    .split(",")
    .map((part) => {
      const [lang, q] = part.trim().split(";q=");
      return { lang: lang.trim().split("-")[0], q: q ? parseFloat(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { lang } of langs) {
    const match = locales.find((l) => l === lang);
    if (match) return match;
  }

  return defaultLocale;
}

export const config = {
  matcher: ["/((?!_next|favicon|.*\\..*).*)"],
};
```

**Step 2: Verify TypeScript compiles**

Run: `cd /Users/rock/ai/projects/islamic-inheritance-calc && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: add locale detection middleware with Accept-Language support"
```

---

### Task 8: Restructure App Router for [locale] Segment

**Files:**
- Modify: `src/app/layout.tsx` — simplify to minimal root layout (no lang/dir)
- Create: `src/app/[locale]/layout.tsx` — locale-aware layout with lang, dir, fonts, I18nProvider
- Move: `src/app/page.tsx` → `src/app/[locale]/page.tsx`

**Step 1: Simplify root layout**

`src/app/layout.tsx` becomes minimal — no `<html>` tag (that moves to `[locale]/layout.tsx`):

```tsx
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
```

**Step 2: Create locale layout**

`src/app/[locale]/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { locales, isRtl, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/get-messages";
import { I18nProvider } from "@/i18n/context";

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = await getMessages(locale as Locale);
  return {
    title: messages["meta.title"],
    description: messages["meta.description"],
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;

  if (!locales.includes(localeParam as Locale)) {
    notFound();
  }

  const locale = localeParam as Locale;
  const rtl = isRtl(locale);
  const messages = await getMessages(locale);

  return (
    <html lang={locale} dir={rtl ? "rtl" : "ltr"} className={rtl ? "locale-rtl" : ""}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href={`https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&family=IBM+Plex+Sans:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500${rtl ? "&family=Noto+Naskh+Arabic:wght@400;500;600;700&family=Noto+Sans+Arabic:wght@300;400;500;600" : ""}&display=swap`}
          rel="stylesheet"
        />
      </head>
      <body className={`bg-sand-50 text-sand-900 font-body antialiased${rtl ? " font-body-ar" : ""}`}>
        <I18nProvider locale={locale} messages={messages}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
```

**Step 3: Move page.tsx**

```bash
mv src/app/page.tsx src/app/[locale]/page.tsx
```

The page needs locale-related updates but that's Task 9.

**Step 4: Verify the app builds**

Run: `cd /Users/rock/ai/projects/islamic-inheritance-calc && npx next build`
Expected: Build succeeds (page may have warnings but should compile)

**Step 5: Commit**

```bash
git add src/app/layout.tsx src/app/[locale]/layout.tsx src/app/[locale]/page.tsx
git commit -m "feat: restructure app router with [locale] dynamic segment"
```

---

### Task 9: Refactor page.tsx to Use Translations

**Files:**
- Modify: `src/app/[locale]/page.tsx`

**Step 1: Update all components to use `useTranslations()`**

This is the largest single change. Every hardcoded English string in `page.tsx` gets replaced with `t("key")`.

Key changes:

1. Add imports:
```tsx
import { useTranslations, useLocale } from "@/i18n/context";
import { isRtl, locales, localeNames, type Locale } from "@/i18n/config";
import { resolveExplanation } from "@/lib/calc/explain";
```

2. In the `Home` component, add:
```tsx
const t = useTranslations();
const locale = useLocale();
```

3. Replace every string. Examples:
```tsx
// Before:
<h1>Islamic Inheritance</h1>
// After:
<h1>{t("header.title")}</h1>

// Before:
{g === "male" ? "Male" : "Female"}
// After:
{g === "male" ? t("deceased.male") : t("deceased.female")}
```

4. Replace `HEIR_DISPLAY_NAMES[heir]` usage:
```tsx
// Before:
const displayName = HEIR_DISPLAY_NAMES[heir as keyof typeof HEIR_DISPLAY_NAMES] || heir;
// After:
const displayName = t(`heir.${heir}`);
```

5. Resolve explanation templates in ShareRow:
```tsx
// Import Messages type at the top of the file
import type { Messages } from "@/i18n/get-messages";

// In ShareRow, get translations from context:
const t = useTranslations();
// Use a small helper to resolve ExplanationTemplate → string
// The ShareRow already receives `explanation` — change it to ExplanationTemplate type
// and resolve it inline using the messages from context.
```

6. Add the language switcher component to the header.

7. Handle plural forms:
```tsx
{activeShares.length === 1
  ? t("result.heirCount", { count: 1 })
  : t("result.heirCountPlural", { count: activeShares.length })}
```

**Step 2: Add the LanguageSwitcher component**

```tsx
function LanguageSwitcher({ currentLocale }: { currentLocale: Locale }) {
  return (
    <nav className="flex flex-wrap justify-center gap-x-1 gap-y-1 mt-3" aria-label="Language">
      {locales.map((loc, i) => (
        <span key={loc} className="flex items-center">
          {i > 0 && (
            <span className="text-gold-400 text-[6px] mx-1.5 select-none">◆</span>
          )}
          <a
            href={`/${loc}`}
            className={`text-[11px] transition-colors relative pb-0.5 ${
              loc === currentLocale
                ? "text-sand-800 font-medium"
                : "text-sand-400 hover:text-sand-600"
            }`}
            lang={loc}
          >
            {localeNames[loc]}
            {loc === currentLocale && (
              <span className="absolute bottom-0 inset-x-0 h-0.5 bg-gold-500 rounded-full" />
            )}
          </a>
        </span>
      ))}
    </nav>
  );
}
```

Place it in the header between the subtitle and the closing geometric border.

**Step 3: Verify the app builds and renders**

Run: `cd /Users/rock/ai/projects/islamic-inheritance-calc && npx next build`
Expected: Build succeeds

**Step 4: Run tests**

Run: `cd /Users/rock/ai/projects/islamic-inheritance-calc && npx vitest run`
Expected: 133/133 tests pass

**Step 5: Commit**

```bash
git add src/app/[locale]/page.tsx
git commit -m "feat: refactor page.tsx to use translation system with language switcher"
```

---

### Task 10: Refactor form-logic.ts to Use Translation Keys

**Files:**
- Modify: `src/lib/form-logic.ts`

**Step 1: Replace hardcoded labels with translation keys**

The form section titles, subtitles, and field labels should use translation keys instead of English strings. The `FormSection` and `FormField` interfaces change:

```ts
export interface FormSection {
  id: string;
  titleKey: string;        // was: title: string
  subtitleKey?: string;     // was: subtitle?: string
  fields: FormField[];
  visible: boolean;
}

export interface FormField {
  heir: HeirType;
  labelKey: string;         // was: label: string
  max: number;
  visible: boolean;
  hintKey?: string;         // was: hint?: string
}
```

Update all the section/field definitions. Example:
```ts
// Before:
{ heir: "son", label: "Sons", max: 20, visible: true }
// After:
{ heir: "son", labelKey: "form.sons", max: 20, visible: true }
```

```ts
// Before:
title: "Spouse"
// After:
titleKey: "section.spouse"
```

**Step 2: Update page.tsx to use the new keys**

In `FormSectionCard` and `HeirCounter`, resolve keys via `t()`:
```tsx
// Before:
<h3>{section.title}</h3>
// After:
<h3>{t(section.titleKey)}</h3>
```

**Step 3: Run tests**

Run: `cd /Users/rock/ai/projects/islamic-inheritance-calc && npx vitest run`
Expected: 133/133 tests pass

**Step 4: Commit**

```bash
git add src/lib/form-logic.ts src/app/[locale]/page.tsx
git commit -m "refactor: form-logic uses translation keys instead of hardcoded labels"
```

---

### Task 11: Remove HEIR_DISPLAY_NAMES from types.ts

**Files:**
- Modify: `src/lib/calc/types.ts` — remove `HEIR_DISPLAY_NAMES`
- Modify: `src/lib/calc/index.ts` — remove `HEIR_DISPLAY_NAMES` export
- Modify: `src/lib/calc/calculator.ts` — remove `HEIR_DISPLAY_NAMES` import (no longer needed since steps use template keys)

**Step 1: Remove HEIR_DISPLAY_NAMES constant from types.ts**

Delete the `HEIR_DISPLAY_NAMES` constant (lines 118-143).

**Step 2: Remove from index.ts exports**

Remove `HEIR_DISPLAY_NAMES` from the exports.

**Step 3: Remove import from calculator.ts**

Remove `HEIR_DISPLAY_NAMES` from the import statement.

**Step 4: Verify no remaining references**

Run: `grep -r "HEIR_DISPLAY_NAMES" src/`
Expected: No matches

**Step 5: Run tests**

Run: `cd /Users/rock/ai/projects/islamic-inheritance-calc && npx vitest run`
Expected: 133/133 tests pass

**Step 6: Commit**

```bash
git add src/lib/calc/types.ts src/lib/calc/index.ts src/lib/calc/calculator.ts
git commit -m "refactor: remove HEIR_DISPLAY_NAMES, now handled by translation system"
```

---

### Task 12: RTL CSS and Font Adjustments

**Files:**
- Modify: `src/app/globals.css`

**Step 1: Add Arabic/Urdu font families and RTL overrides**

Add to the `@theme` block:
```css
--font-body-ar: "Noto Sans Arabic", "Segoe UI", sans-serif;
--font-display-ar: "Noto Naskh Arabic", "Traditional Arabic", serif;
```

Add RTL-specific styles:
```css
/* RTL font overrides */
.font-body-ar {
  font-family: var(--font-body-ar);
}

.locale-rtl .font-display {
  font-family: var(--font-display-ar);
}

/* RTL share bar origin */
[dir="rtl"] .share-bar {
  transform-origin: right;
}
```

**Step 2: Update page.tsx for RTL-aware classes**

Replace directional Tailwind classes:
- `ml-1` → `ms-1`
- `ml-1.5` → `ms-1.5`
- `mr-*` → `me-*`
- `text-right` on step numbers → `text-end`
- `rounded-l-md` / `rounded-r-md` on counter buttons → `rounded-s-md` / `rounded-e-md`
- `origin-left` on share bars → `origin-left rtl:origin-right` (or handle via CSS above)

**Step 3: Test RTL visually**

Run dev server: `cd /Users/rock/ai/projects/islamic-inheritance-calc && npx next dev`
Visit `http://localhost:3000/ar` and verify:
- Text flows right-to-left
- Form labels on the right, controls on the left
- Share bars animate from right
- Arabic font renders properly
- No layout breaks

**Step 4: Commit**

```bash
git add src/app/globals.css src/app/[locale]/page.tsx
git commit -m "feat: add RTL layout support with Arabic fonts and directional CSS"
```

---

### Task 13: Update Exports and Verify Full Build

**Files:**
- Modify: `src/lib/calc/index.ts` — verify exports are clean
- Modify: `src/__tests__/ilmsummit-cases.test.ts` — update if needed for new types

**Step 1: Verify test compatibility**

The tests import `calculate` and compare fractions. Explanations are now `ExplanationTemplate` objects. If the test accesses `explanation` anywhere, update it. If not (likely), tests should pass as-is.

Run: `cd /Users/rock/ai/projects/islamic-inheritance-calc && npx vitest run`
Expected: 133/133 tests pass

**Step 2: Full build**

Run: `cd /Users/rock/ai/projects/islamic-inheritance-calc && npx next build`
Expected: Build succeeds for all 7 locale pages

**Step 3: Full typecheck**

Run: `cd /Users/rock/ai/projects/islamic-inheritance-calc && npx tsc --noEmit`
Expected: No type errors

**Step 4: Commit if any fixes were needed**

```bash
git add -p  # review changes
git commit -m "fix: ensure full build and test compatibility with i18n changes"
```

---

### Task 14: Deploy and Test

**Step 1: Deploy to Dokku**

Run: `cd /Users/rock/ai/projects/islamic-inheritance-calc && git push dokku main`

**Step 2: Verify deployment**

Test each locale URL:
- https://inheritance-calc.whhite.com/en
- https://inheritance-calc.whhite.com/ar
- https://inheritance-calc.whhite.com/ur
- https://inheritance-calc.whhite.com/tr
- https://inheritance-calc.whhite.com/ms
- https://inheritance-calc.whhite.com/id
- https://inheritance-calc.whhite.com/fr

**Step 3: Verify root redirect**

Visit https://inheritance-calc.whhite.com/ — should redirect to `/en` (or detected browser language).

**Step 4: Browser test RTL**

Visit `/ar` and `/ur` — verify RTL layout works correctly in production.
