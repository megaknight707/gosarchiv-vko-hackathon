// Разделы публичного сайта, которые учитывает счётчик просмотров (первая часть адреса после языка).
export const SITE_SECTIONS = [
  "home",
  "catalog",
  "exhibitions",
  "memory",
  "branches",
  "about",
  "news",
  "help",
  "faq",
  "feedback",
  "favorites",
  "privacy",
] as const;

export type SiteSection = (typeof SITE_SECTIONS)[number];
