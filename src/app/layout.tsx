import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Islamic Inheritance Calculator — Faraid",
  description:
    "Calculate Islamic inheritance shares accurately with plain English explanations. Based on Quran & Sunnah with scholarly verification.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&family=IBM+Plex+Sans:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-sand-50 text-sand-900 font-body antialiased">
        {children}
      </body>
    </html>
  );
}
