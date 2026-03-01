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
        <script dangerouslySetInnerHTML={{ __html: `(function(){var h=document.documentElement,t=localStorage.getItem('theme');if(t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme:dark)').matches))h.setAttribute('data-theme','dark')})()` }} />
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
