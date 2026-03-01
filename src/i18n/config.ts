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
