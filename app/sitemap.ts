// sitemap.xml (ТЗ §7.5): все языковые версии страниц с hreflang-ссылками.
// Только опубликованные материалы; документы с ограниченным доступом не включаются
// (их карточки помечены noindex). Обновляется раз в час.
import type { MetadataRoute } from "next";
import { htmlLang, routing } from "@/i18n/routing";
import { db } from "@/lib/db";
import { siteUrl } from "@/lib/site/config";

export const revalidate = 3600;

const STATIC_PATHS = [
  "",
  "/catalog",
  "/catalog/funds",
  "/memory",
  "/memory/timeline",
  "/memory/calendar",
  "/memory/persons",
  "/exhibitions",
  "/branches",
  "/about",
  "/news",
  "/services",
  "/services/state",
  "/services/paid",
  "/help",
  "/help/legal-acts",
  "/help/reading-room",
  "/help/symbols",
  "/help/links",
  "/faq",
  "/feedback",
  "/privacy",
];

function entry(path: string, lastModified?: Date, priority = 0.5): MetadataRoute.Sitemap[number] {
  const languages = Object.fromEntries(routing.locales.map((locale) => [htmlLang[locale], `${siteUrl}/${locale}${path}`]));
  return { url: `${siteUrl}/${routing.defaultLocale}${path}`, lastModified, priority, alternates: { languages } };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = STATIC_PATHS.map((path) => entry(path, undefined, path === "" ? 1 : 0.7));
  try {
    const [documents, exhibitions, news, collections, persons] = await Promise.all([
      db.archiveDocument.findMany({ where: { status: "PUBLISHED", accessStatus: { not: "RESTRICTED" } }, select: { id: true, updatedAt: true } }),
      db.exhibition.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
      db.news.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
      db.collection.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
      db.historicalPerson.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
    ]);
    return [
      ...pages,
      ...exhibitions.map((e) => entry(`/exhibitions/${e.slug}`, e.updatedAt, 0.8)),
      ...collections.map((c) => entry(`/memory/collections/${c.slug}`, c.updatedAt, 0.6)),
      ...persons.map((p) => entry(`/memory/persons/${p.slug}`, p.updatedAt, 0.5)),
      ...news.map((n) => entry(`/news/${n.slug}`, n.updatedAt, 0.6)),
      ...documents.map((d) => entry(`/catalog/${d.id}`, d.updatedAt, 0.6)),
    ];
  } catch (error) {
    console.error("[sitemap] база недоступна, только статические страницы:", error);
    return pages;
  }
}
