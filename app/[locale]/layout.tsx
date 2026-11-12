// Корневой шаблон всех страниц: <html> с языком, шрифты, тема, переводы.
// Сегмент [locale] = kz | ru | en. Шапка и подвал публичного сайта — в (site)/layout.tsx,
// у админки (admin/) свой каркас.
import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, PT_Sans, PT_Serif } from "next/font/google";
import Script from "next/script";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { htmlLang, routing } from "@/i18n/routing";
import { isDemoMode, siteUrl } from "@/lib/site/config";
import { languageAlternates } from "@/lib/site/page-metadata";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { LOW_VISION_INIT_SCRIPT } from "@/components/layout/low-vision-toggle";
import "../globals.css";

// Казахские буквы Ә Ғ Қ Ң Ө Ұ Ү Һ І находятся в наборе cyrillic-ext — без него
// браузер подставил бы системный шрифт и буквы выглядели бы «чужими».
const ptSans = PT_Sans({
  variable: "--font-pt-sans",
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  weight: ["400", "700"],
  display: "swap",
});
const ptSerif = PT_Serif({
  variable: "--font-pt-serif",
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  weight: ["400", "700"],
  display: "swap",
});
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  weight: ["400"],
  display: "swap",
});

// Страницы собираются заранее для всех трёх языков и обновляются раз в час
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
export const revalidate = 3600;

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return {
    metadataBase: new URL(siteUrl),
    title: { default: t("fullSiteName"), template: t("titleTemplate") },
    description: t("description"),
    applicationName: t("siteName"),
    alternates: { languages: languageAlternates("/") },
    openGraph: {
      siteName: t("fullSiteName"),
      locale: htmlLang[locale],
      type: "website",
      images: [{ url: "/og-image.png", width: 1200, height: 630, alt: t("fullSiteName") }],
    },
    twitter: { card: "summary_large_image", images: ["/og-image.png"] },
    // В демо-режиме сайт не индексируется поисковиками
    robots: isDemoMode ? { index: false, follow: false } : undefined,
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F3F5F8" },
    { media: "(prefers-color-scheme: dark)", color: "#0E1422" },
  ],
};

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  // В браузер публичного сайта уходят переводы без раздела админки (~480 строк) —
  // страница легче. Админка подключает полный набор в своём шаблоне.
  const publicMessages = Object.fromEntries(Object.entries(await getMessages()).filter(([namespace]) => namespace !== "Admin"));

  return (
    <html
      lang={htmlLang[locale]}
      suppressHydrationWarning
      className={`${ptSans.variable} ${ptSerif.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        {/* Версия для слабовидящих включается до отрисовки — без «прыжка» шрифта */}
        <Script id="low-vision-init" strategy="beforeInteractive">
          {LOW_VISION_INIT_SCRIPT}
        </Script>
      </head>
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider messages={publicMessages}>
          <ThemeProvider>{children}</ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
