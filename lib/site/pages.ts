// Информационные страницы из базы (таблица Page) — редактируются в админке.
import "server-only";
import { cache } from "react";
import type { Locale } from "@/i18n/routing";
import { db } from "@/lib/db";
import { pickLocale } from "@/lib/i18n/pick-locale";

export type PageSection = { slug: string; title: string; body: string };

export const getPageSections = cache(async (section: string, locale: Locale): Promise<PageSection[]> => {
  try {
    const pages = await db.page.findMany({ where: { section, status: "PUBLISHED" }, orderBy: { sortOrder: "asc" } });
    return pages.map((p) => ({ slug: p.slug, title: pickLocale(p, "title", locale), body: pickLocale(p, "body", locale) }));
  } catch (error) {
    console.error(`Не удалось загрузить страницы раздела ${section}:`, error);
    return [];
  }
});

export const getFaq = cache(async (locale: Locale) => {
  try {
    const items = await db.faqItem.findMany({ where: { status: "PUBLISHED" }, orderBy: { order: "asc" } });
    return items.map((item) => ({ id: item.id, question: pickLocale(item, "question", locale), answer: pickLocale(item, "answer", locale) }));
  } catch (error) {
    console.error("Не удалось загрузить FAQ:", error);
    return [];
  }
});
