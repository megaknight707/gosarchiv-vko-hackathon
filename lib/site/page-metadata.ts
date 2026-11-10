// Метаданные страницы: заголовок и описание на нужном языке + hreflang-ссылки
// на две другие языковые версии той же страницы (для поисковиков).
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { htmlLang, routing, type Locale } from "@/i18n/routing";
import type messages from "@/messages/ru.json";

export type PageKey = keyof typeof messages.Pages;

/** Ссылки на все языковые версии пути: { kk: "/kz/catalog", ru: "/ru/catalog", en: "/en/catalog", "x-default": … } */
export function languageAlternates(path: string): Record<string, string> {
  const suffix = path === "/" ? "" : path;
  const entries = routing.locales.map((locale) => [htmlLang[locale], `/${locale}${suffix}`]);
  return { ...Object.fromEntries(entries), "x-default": `/${routing.defaultLocale}${suffix}` };
}

export async function pageMetadata(locale: Locale, key: PageKey, path: string): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "Pages" });
  return {
    title: t(`${key}.title`),
    description: t(`${key}.description`),
    alternates: {
      canonical: `/${locale}${path === "/" ? "" : path}`,
      languages: languageAlternates(path),
    },
  };
}
