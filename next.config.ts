import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Подключает i18n/request.ts — настройки языка для каждого запроса
const withNextIntl = createNextIntlPlugin();

// Сканы в продакшене лежат в Supabase Storage — разрешаем next/image загружать их оттуда
const supabaseHost = process.env.SUPABASE_URL ? new URL(process.env.SUPABASE_URL).hostname : undefined;

const nextConfig: NextConfig = {
  // Классическая модель кэширования (ISR / revalidate) — проще и предсказуемее
  // вместе с next-intl. Cache Components можно включить позже.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Загрузка сканов в админке: файл до 20 МБ + служебные байты формы.
  // (На Vercel тело запроса функции ограничено ~4,5 МБ — см. docs/roadmap.md.)
  experimental: {
    serverActions: { bodySizeLimit: "21mb" },
    proxyClientMaxBodySize: "21mb",
  },
  // sharp и pg — серверные нативные пакеты, не бандлим их
  serverExternalPackages: ["sharp", "pg"],
  images: {
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
      : [],
  },
};

export default withNextIntl(nextConfig);
