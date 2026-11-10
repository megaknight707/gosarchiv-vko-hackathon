// Общие настройки сайта, которые читаются из переменных окружения.

/** DEMO_MODE=true (по умолчанию) — плашка «не официальный сайт», noindex, пометки демо-записей */
export const isDemoMode = process.env.DEMO_MODE !== "false";

/** Адрес сайта для абсолютных ссылок (Open Graph, hreflang, sitemap) */
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
