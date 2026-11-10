// Настройка языков сайта. URL: /kz/..., /ru/..., /en/... (по умолчанию — ru).
// Выбор языка запоминается в cookie NEXT_LOCALE (это делает next-intl в proxy.ts).
import { defineRouting } from "next-intl/routing";

export const locales = ["kz", "ru", "en"] as const;
export type Locale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: "ru",
  localePrefix: "always",
  // Автоматический заголовок Link ставил бы hreflang="kz", а по ISO 639-1 казахский — «kk».
  // Правильные hreflang-ссылки выводятся в <head> через lib/site/page-metadata.ts.
  alternateLinks: false,
});

/** Код языка для атрибута lang / hreflang (ISO 639-1: казахский — «kk», а не «kz») */
export const htmlLang: Record<Locale, string> = { kz: "kk", ru: "ru", en: "en" };
