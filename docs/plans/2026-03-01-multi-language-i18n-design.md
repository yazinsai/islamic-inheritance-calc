# Multi-Language i18n Design

**Date:** 2026-03-01
**Status:** Approved

## Overview

Add multi-language support to the Islamic Inheritance Calculator with 7 locales and RTL layout support. Uses Next.js App Router's native `[locale]` segment pattern with simple JSON translation files — no i18n library.

## Languages

| Code | Language | Script | Direction |
|------|----------|--------|-----------|
| `en` | English | Latin | LTR |
| `ar` | العربية | Arabic | RTL |
| `ur` | اردو | Arabic/Nastaliq | RTL |
| `tr` | Türkçe | Latin | LTR |
| `ms` | Melayu | Latin | LTR |
| `id` | Indonesia | Latin | LTR |
| `fr` | Français | Latin | LTR |

## Architecture

### Routing

- `[locale]` dynamic segment at app root: `/en`, `/ar`, `/ur`, `/tr`, `/ms`, `/id`, `/fr`
- Middleware detects browser `Accept-Language`, redirects `/` to matched locale (default: `/en`)
- Invalid locale paths redirect to `/en`
- URL is sole source of truth — no cookies/localStorage

### File Structure

```
src/
├── app/
│   ├── [locale]/
│   │   ├── page.tsx          ← moved, uses t() for all strings
│   │   └── layout.tsx        ← sets lang, dir, fonts, provides translations
│   └── layout.tsx            ← minimal root (no lang/dir)
├── i18n/
│   ├── config.ts             ← locales, defaultLocale, rtlLocales
│   ├── get-messages.ts       ← loads JSON for a locale
│   └── messages/
│       ├── en.json
│       ├── ar.json
│       ├── ur.json
│       ├── tr.json
│       ├── ms.json
│       ├── id.json
│       └── fr.json
├── middleware.ts              ← locale detection + redirect
```

### Translation System

Simple React context + `useTranslations()` hook:

```tsx
const t = useTranslations();
<h1>{t("header.title")}</h1>
```

String interpolation for variables:
```json
{ "result.heirCount": "{count} heir receives shares" }
```

### Translation Key Structure

Flat keys with dot-notation grouping (~140 keys per locale):

- `meta.*` — page title, description
- `header.*` — title, subtitle
- `deceased.*` — gender, estate labels
- `heirs.*` — section title, reset, empty state
- `section.*` — form section titles and hints
- `heir.*` — 22 heir display names
- `result.*` — distribution, fard, asaba, blocked, steps, legend
- `special.*` — awl, radd, umariyyah, mushtaraka, grandfather-siblings
- `explain.*` — ~40 calculation explanation templates
- `footer.*` — disclaimer text

### Islamic Terminology Convention

- **Arabic:** Native terms only (no parenthetical — it IS the source language)
- **All other languages:** Native term + Arabic original in parentheses
  - e.g. Turkish: `"Farz payı (فرض)"`
  - e.g. Urdu: `"فرض"` (same as Arabic, no parenthetical needed)
  - e.g. French: `"Part prescrite (فرض)"`

## Language Switcher UI

Located in header between the two geometric borders, below the subtitle.

- Each language shown in its native script, 11px, `text-sand-500`
- Gold diamond separator `◆` between items (`text-gold-400`, 6px)
- Active language: `text-sand-800` with 2px `bg-gold-500` underline bar
- Hover: `text-sand-700` transition
- `flex flex-wrap justify-center gap-x-3 gap-y-1` for natural wrapping
- Plain `<a>` tags to `/${locale}` — no client-side navigation needed

## RTL Adjustments

### What changes for `ar` and `ur`:

| Element | LTR | RTL |
|---------|-----|-----|
| `<html>` | `dir="ltr"` | `dir="rtl"` |
| Form labels | Left-aligned | Right-aligned (auto) |
| Counter controls | Right of row | Left of row (auto) |
| Share bars | `origin-left` | `origin-right` via `rtl:origin-right` |
| Directional margins | `ml-*` / `mr-*` | `ms-*` / `me-*` (logical) |
| Step numbers | `text-right` | `text-left` via `rtl:text-left` |

### What stays the same:
- `+` / `−` button order (universal)
- Centered elements (header, empty state, legend)
- Card/border styling (symmetrical)
- Geometric patterns (symmetrical)
- Fraction display (universal)

### Fonts

```css
--font-display-ar: "Noto Naskh Arabic", "Traditional Arabic", serif;
--font-body-ar: "Noto Sans Arabic", "Segoe UI", sans-serif;
```

Applied via `.locale-ar` / `.locale-ur` class on `<html>`.

## Calc Engine Changes

Explanation functions currently return raw English strings. They will be refactored to return template keys + variables:

```ts
// Before
explanation: "Daughter receives 1/2 as the sole daughter with no son"

// After
explanation: { key: "explain.daughter.fard.half", vars: { } }
```

A `resolve-explanation.ts` utility maps keys to locale-specific strings at the UI layer.

Existing tests are unaffected — they test shares/fractions, not explanation text.

## Files Touched

### New files:
- `src/middleware.ts`
- `src/i18n/config.ts`
- `src/i18n/get-messages.ts`
- `src/i18n/messages/{en,ar,ur,tr,ms,id,fr}.json` (7 files)
- `src/app/[locale]/layout.tsx`

### Modified files:
- `src/app/[locale]/page.tsx` (moved from `src/app/page.tsx`, refactored)
- `src/app/layout.tsx` (simplified to minimal root)
- `src/app/globals.css` (Arabic/Urdu font stack, RTL share bar origin)
- `src/lib/calc/fard.ts` (explanation → template keys)
- `src/lib/calc/asaba.ts` (explanation → template keys)
- `src/lib/calc/special-cases.ts` (explanation → template keys)
- `src/lib/calc/types.ts` (HEIR_DISPLAY_NAMES removed)
- `src/lib/form-logic.ts` (labels removed, uses translation keys)
