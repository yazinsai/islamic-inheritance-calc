"use client";

import { useState, useMemo, useCallback } from "react";
import { calculate, type CalculationResult, type ExplanationTemplate } from "@/lib/calc";
import { resolveExplanation } from "@/lib/calc/explain";
import { getFormSections, type FormSection, type FormField } from "@/lib/form-logic";
import { useTranslations, useMessages, useLocale } from "@/i18n/context";
import { locales, localeNames, isRtl, type Locale } from "@/i18n/config";
import type { HeirInput } from "@/lib/calc";
import Fraction from "fraction.js";

// ─── Fraction Display ────────────────────────────────────────────────
function FractionDisplay({ value }: { value: Fraction }) {
  const str = value.toFraction();
  if (!str.includes("/")) return <span className="font-mono text-sm">{str}</span>;
  const [num, den] = str.split("/");
  return (
    <span className="fraction">
      <span className="num">{num}</span>
      <span className="den">{den}</span>
    </span>
  );
}

function toPercent(f: Fraction): string {
  return (f.valueOf() * 100).toFixed(2).replace(/\.?0+$/, "") + "%";
}

function formatCurrency(n: number): string {
  if (n === 0) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2).replace(/\.?0+$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(2).replace(/\.?0+$/, "") + "K";
  return n.toFixed(2).replace(/\.?0+$/, "");
}

// ─── Language Switcher ───────────────────────────────────────────────
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

// ─── Heir Counter Input ──────────────────────────────────────────────
function HeirCounter({
  field,
  value,
  onChange,
  t,
}: {
  field: FormField;
  value: number;
  onChange: (heir: string, val: number) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  const label = t(field.labelKey);
  return (
    <div className="flex items-center justify-between py-2.5 px-1 group">
      <label className="text-sand-700 text-[15px] select-none">{label}</label>
      <div className="flex items-center gap-0">
        <button
          type="button"
          onClick={() => onChange(field.heir, Math.max(0, value - 1))}
          disabled={value === 0}
          className="w-8 h-8 rounded-s-md bg-sand-100 hover:bg-sand-200 text-sand-600
                     disabled:opacity-30 disabled:cursor-default transition-colors
                     flex items-center justify-center text-lg font-light select-none"
          aria-label={t("aria.decrease", { label })}
        >
          −
        </button>
        <div
          className="w-10 h-8 bg-white border-y border-sand-200 flex items-center
                      justify-center text-sm font-mono text-sand-800 select-none"
        >
          {value}
        </div>
        <button
          type="button"
          onClick={() => onChange(field.heir, Math.min(field.max, value + 1))}
          disabled={value >= field.max}
          className="w-8 h-8 rounded-e-md bg-sand-100 hover:bg-sand-200 text-sand-600
                     disabled:opacity-30 disabled:cursor-default transition-colors
                     flex items-center justify-center text-lg font-light select-none"
          aria-label={t("aria.increase", { label })}
        >
          +
        </button>
      </div>
    </div>
  );
}

// ─── Form Section ────────────────────────────────────────────────────
function FormSectionCard({
  section,
  input,
  onChange,
  t,
}: {
  section: FormSection;
  input: HeirInput;
  onChange: (heir: string, val: number) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  const visibleFields = section.fields.filter((f) => f.visible);
  if (visibleFields.length === 0) return null;

  return (
    <div className="section-enter">
      <div className="flex items-baseline gap-2 mb-1">
        <h3 className="text-sm font-semibold text-sand-600 uppercase tracking-wider">
          {t(section.titleKey)}
        </h3>
        {section.subtitleKey && (
          <span className="text-xs text-sand-400">{t(section.subtitleKey)}</span>
        )}
      </div>
      <div className="bg-white rounded-xl border border-sand-200/80 px-4 divide-y divide-sand-100">
        {visibleFields.map((field) => (
          <HeirCounter
            key={field.heir}
            field={field}
            value={input[field.heir as keyof HeirInput] ?? 0}
            onChange={onChange}
            t={t}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Results Share Row ───────────────────────────────────────────────
function ShareRow({
  heir,
  count,
  totalShare,
  individualShare,
  explanation,
  shareType,
  estateAmount,
  index,
  t,
  messages,
}: {
  heir: string;
  count: number;
  totalShare: Fraction;
  individualShare: Fraction;
  explanation: ExplanationTemplate;
  shareType: string;
  estateAmount: number;
  index: number;
  t: (key: string, vars?: Record<string, string | number>) => string;
  messages: Record<string, string>;
}) {
  const pct = totalShare.valueOf() * 100;
  const amount = estateAmount * totalShare.valueOf();
  const perPerson = estateAmount * individualShare.valueOf();
  const isBlocked = totalShare.valueOf() === 0;
  const displayName = t(`heir.${heir}`);
  const explanationText = resolveExplanation(explanation, messages);

  const shareTypeLabel =
    shareType === "fard"
      ? t("result.fard")
      : shareType === "asaba"
        ? t("result.asaba")
        : t("result.fardAsaba");

  if (isBlocked) {
    return (
      <div
        className="result-card py-3 px-4 flex items-center gap-3 opacity-50"
        style={{ animationDelay: `${index * 60}ms` }}
      >
        <div className="w-2 h-2 rounded-full bg-sand-300 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="text-sm text-sand-500 line-through">
            {displayName}
            {count > 1 && <span className="text-xs ms-1">×{count}</span>}
          </div>
          <p className="text-xs text-sand-400 mt-0.5 leading-snug">{explanationText}</p>
        </div>
        <div className="text-xs text-sand-400 shrink-0">{t("result.blocked")}</div>
      </div>
    );
  }

  const barColor =
    shareType === "fard"
      ? "bg-sage-400"
      : shareType === "asaba"
        ? "bg-gold-500"
        : "bg-sage-500";

  return (
    <div
      className="result-card py-3.5 px-4"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-medium text-sand-800">
              {displayName}
            </span>
            {count > 1 && (
              <span className="text-xs bg-sand-100 text-sand-500 px-1.5 py-0.5 rounded-full">
                ×{count}
              </span>
            )}
            <span
              className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                shareType === "fard"
                  ? "bg-sage-50 text-sage-600"
                  : shareType === "asaba"
                    ? "bg-gold-50 text-gold-700"
                    : "bg-sage-50 text-sage-700"
              }`}
            >
              {shareTypeLabel}
            </span>
          </div>
          <p className="text-xs text-sand-500 mt-1 leading-snug">{explanationText}</p>
        </div>
        <div className="text-end shrink-0">
          <div className="text-lg font-display font-semibold text-sand-800">
            <FractionDisplay value={totalShare} />
          </div>
          <div className="text-xs text-sand-400 mt-0.5">{toPercent(totalShare)}</div>
        </div>
      </div>

      {/* Share bar */}
      <div className="h-1.5 bg-sand-100 rounded-full overflow-hidden mb-2">
        <div
          className={`share-bar h-full rounded-full ${barColor} origin-left rtl:origin-right`}
          style={{
            width: `${Math.max(pct, 1)}%`,
            animationDelay: `${index * 60 + 200}ms`,
          }}
        />
      </div>

      {/* Amounts */}
      {estateAmount > 0 && (
        <div className="flex items-center justify-between text-xs text-sand-500">
          <span>
            {t("result.total")}: <span className="font-mono font-medium text-sand-700">{formatCurrency(amount)}</span>
          </span>
          {count > 1 && (
            <span>
              {t("result.each")}: <span className="font-mono font-medium text-sand-700">{formatCurrency(perPerson)}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Results Panel ───────────────────────────────────────────────────
function Results({
  result,
  estateAmount,
  t,
  messages,
}: {
  result: CalculationResult;
  estateAmount: number;
  t: (key: string, vars?: Record<string, string | number>) => string;
  messages: Record<string, string>;
}) {
  const activeShares = result.shares.filter((s) => s.totalShare.valueOf() > 0);
  const blockedShares = result.shares.filter((s) => s.totalShare.valueOf() === 0);

  const specialCases: string[] = [];
  if (result.awlApplied) specialCases.push(t("special.awl"));
  if (result.raddApplied) specialCases.push(t("special.radd"));
  if (result.umariyyahApplied) specialCases.push(t("special.umariyyah"));
  if (result.mushtarakaApplied) specialCases.push(t("special.mushtaraka"));
  if (result.grandfatherSiblingsApplied) specialCases.push(t("special.grandfatherSiblings"));

  const heirCountText =
    activeShares.length === 1
      ? t("result.heirCount", { count: activeShares.length })
      : t("result.heirCountPlural", { count: activeShares.length });

  const blockedCountText =
    blockedShares.length === 1
      ? t("result.blockedCount", { count: blockedShares.length })
      : t("result.blockedCountPlural", { count: blockedShares.length });

  return (
    <div className="space-y-4">
      {/* Summary header */}
      <div className="bg-white rounded-xl border border-sand-200/80 p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-display text-xl font-semibold text-sand-800">
            {t("result.title")}
          </h2>
          <span className="text-xs text-sand-400">{heirCountText}</span>
        </div>
        {specialCases.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {specialCases.map((sc) => (
              <span
                key={sc}
                className="text-[10px] uppercase tracking-wider bg-gold-50 text-gold-700
                           border border-gold-200 px-2 py-0.5 rounded-full"
              >
                {sc}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Active shares */}
      <div className="bg-white rounded-xl border border-sand-200/80 divide-y divide-sand-100 overflow-hidden">
        {activeShares.map((s, i) => (
          <ShareRow
            key={s.heir}
            heir={s.heir}
            count={s.count}
            totalShare={s.totalShare}
            individualShare={s.individualShare}
            explanation={s.explanation}
            shareType={s.shareType}
            estateAmount={estateAmount}
            index={i}
            t={t}
            messages={messages}
          />
        ))}
      </div>

      {/* Blocked heirs */}
      {blockedShares.length > 0 && (
        <details className="group">
          <summary className="text-xs text-sand-400 cursor-pointer hover:text-sand-500 transition-colors select-none">
            {blockedCountText}
          </summary>
          <div className="mt-2 bg-white rounded-xl border border-sand-200/80 divide-y divide-sand-50 overflow-hidden">
            {blockedShares.map((s, i) => (
              <ShareRow
                key={s.heir}
                heir={s.heir}
                count={s.count}
                totalShare={s.totalShare}
                individualShare={s.individualShare}
                explanation={s.explanation}
                shareType={s.shareType}
                estateAmount={0}
                index={i}
                t={t}
                messages={messages}
              />
            ))}
          </div>
        </details>
      )}

      {/* Calculation steps */}
      {result.steps.length > 0 && (
        <details className="group">
          <summary className="text-xs text-sand-400 cursor-pointer hover:text-sand-500 transition-colors select-none">
            {t("result.steps", { count: result.steps.length })}
          </summary>
          <div className="mt-2 bg-white rounded-xl border border-sand-200/80 p-4">
            <ol className="space-y-1.5">
              {result.steps.map((step, i) => (
                <li key={i} className="text-xs text-sand-600 leading-relaxed flex gap-2">
                  <span className="text-sand-300 font-mono shrink-0 w-4 text-end">
                    {i + 1}.
                  </span>
                  <span>{resolveExplanation(step, messages)}</span>
                </li>
              ))}
            </ol>
          </div>
        </details>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-[10px] text-sand-400 py-1">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-sage-400" />
          {t("legend.fard")}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-gold-500" />
          {t("legend.asaba")}
        </span>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────
export default function Home() {
  const t = useTranslations();
  const locale = useLocale();
  const messages = useMessages();
  const rtl = isRtl(locale);

  const [deceasedGender, setDeceasedGender] = useState<"male" | "female">("male");
  const [input, setInput] = useState<HeirInput>({});
  const [estateAmount, setEstateAmount] = useState<string>("");
  const [showResults, setShowResults] = useState(false);

  const handleHeirChange = useCallback(
    (heir: string, val: number) => {
      setInput((prev) => {
        const next = { ...prev };
        if (val === 0) {
          delete next[heir as keyof HeirInput];
        } else {
          (next as Record<string, number>)[heir] = val;
        }
        return next;
      });
    },
    [],
  );

  const handleGenderChange = useCallback((g: "male" | "female") => {
    setDeceasedGender(g);
    setInput((prev) => {
      const next = { ...prev };
      delete next.husband;
      delete next.wife;
      return next;
    });
  }, []);

  const sections = useMemo(
    () => getFormSections(input, deceasedGender),
    [input, deceasedGender],
  );

  const hasAnyHeirs = Object.values(input).some((v) => v && v > 0);

  const result = useMemo<CalculationResult | null>(() => {
    if (!hasAnyHeirs) return null;
    try {
      return calculate(input);
    } catch {
      return null;
    }
  }, [input, hasAnyHeirs]);

  const estate = parseFloat(estateAmount) || 0;

  const handleReset = useCallback(() => {
    setInput({});
    setEstateAmount("");
    setShowResults(false);
  }, []);

  return (
    <div className="min-h-screen geometric-pattern">
      {/* Header */}
      <header className="relative bg-sand-50/90 backdrop-blur-sm border-b border-sand-200/60">
        <div className="max-w-lg mx-auto px-4 py-5">
          <div className="text-center">
            <div className="geometric-border mb-3" />
            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-sand-800 tracking-tight">
              {t("header.title")}
            </h1>
            <p className="text-sm text-sand-500 mt-1 font-light">
              {t("header.subtitle")}
            </p>
            <LanguageSwitcher currentLocale={locale} />
            <div className="geometric-border mt-3" />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 py-6 space-y-6 pb-24">
        {/* Deceased info */}
        <div>
          <h2 className="text-sm font-semibold text-sand-600 uppercase tracking-wider mb-2">
            {t("deceased.title")}
          </h2>
          <div className="bg-white rounded-xl border border-sand-200/80 p-4 space-y-4">
            {/* Gender */}
            <div>
              <label className="text-xs text-sand-500 mb-2 block">{t("deceased.gender")}</label>
              <div className="grid grid-cols-2 gap-2">
                {(["male", "female"] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => handleGenderChange(g)}
                    className={`py-2.5 rounded-lg text-sm font-medium transition-all ${
                      deceasedGender === g
                        ? "bg-sage-600 text-white shadow-sm"
                        : "bg-sand-100 text-sand-500 hover:bg-sand-200"
                    }`}
                  >
                    {g === "male" ? t("deceased.male") : t("deceased.female")}
                  </button>
                ))}
              </div>
            </div>

            {/* Estate amount */}
            <div>
              <label className="text-xs text-sand-500 mb-2 block">
                {t("deceased.estate")}{" "}
                <span className="text-sand-300">{t("deceased.estate.optional")}</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={estateAmount}
                  onChange={(e) => setEstateAmount(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="any"
                  dir="ltr"
                  className="w-full bg-sand-50 border border-sand-200 rounded-lg px-4 py-2.5
                             text-sm font-mono text-sand-800 placeholder:text-sand-300
                             focus:outline-none focus:ring-2 focus:ring-sage-400/30 focus:border-sage-400
                             transition-all"
                />
              </div>
              <p className="text-[11px] text-sand-400 mt-1.5 leading-relaxed">
                {t("deceased.estate.hint")}
              </p>
            </div>
          </div>
        </div>

        {/* Heir sections */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-sand-600 uppercase tracking-wider">
              {t("heirs.title")}
            </h2>
            {hasAnyHeirs && (
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-sand-400 hover:text-sand-600 transition-colors"
              >
                {t("heirs.reset")}
              </button>
            )}
          </div>

          {sections
            .filter((s) => s.visible)
            .map((section) => (
              <FormSectionCard
                key={section.id}
                section={section}
                input={input}
                onChange={handleHeirChange}
                t={t}
              />
            ))}
        </div>

        {/* Results */}
        {result && hasAnyHeirs && (
          <>
            <div className="geometric-border" />
            <Results result={result} estateAmount={estate} t={t} messages={messages} />
          </>
        )}

        {/* Empty state */}
        {!hasAnyHeirs && (
          <div className="text-center py-8">
            <p className="text-sand-400 text-sm">
              {t("heirs.empty")}
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 inset-x-0 bg-sand-50/90 backdrop-blur-sm border-t border-sand-200/60">
        <div className="max-w-lg mx-auto px-4 py-3">
          <p className="text-[10px] text-sand-400 text-center leading-relaxed">
            {t("footer.line1")}
            <br />
            {t("footer.line2")}
          </p>
        </div>
      </footer>
    </div>
  );
}
