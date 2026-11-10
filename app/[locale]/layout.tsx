// Корневой шаблон всех страниц: <html> с языком, шрифты, тема, шапка, подвал,
// мобильная навигация. Сегмент [locale] = kz | ru | en.
import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, PT_Sans, PT_Serif } from "next/font/google";
import Script from "next/script";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { htmlLang, routing } from "@/i18n/routing";
import { isDemoMode, siteUrl } from "@/lib/site/config";
import { languageAlternates } from "@/lib/site/page-metadata";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { DemoBanner } from "@/components/layout/demo-banner";
import { SkipLink } from "@/components/layout/skip-link";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { AssistantPanel } from "@/components/assistant/assistant-panel";
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
    title: { default: t("siteName"), template: t("titleTemplate") },
    description: t("description"),
    applicationName: t("siteName"),
    alternates: { languages: languageAlternates("/") },
    openGraph: { siteName: t("siteName"), locale: htmlLang[locale], type: "website" },
    // В демо-режиме сайт не индексируется поисковиками
    robots: isDemoMode ? { index: false, follow: false } : undefined,
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7F3EA" },
    { media: "(prefers-color-scheme: dark)", color: "#15130F" },
  ],
};

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

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
      <body className="flex min-h-full flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] sm:pb-0">
        <NextIntlClientProvider>
          <ThemeProvider>
            <SkipLink />
            {isDemoMode && <DemoBanner />}
            <SiteHeader locale={locale} />
            <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
              {children}
            </main>
            <SiteFooter locale={locale} />
            <AssistantPanel />
            <MobileTabBar />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
