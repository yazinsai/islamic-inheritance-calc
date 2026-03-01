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
