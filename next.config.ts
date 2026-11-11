import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Подключает i18n/request.ts — настройки языка для каждого запроса
const withNextIntl = createNextIntlPlugin();

// Сканы в продакшене лежат в Supabase Storage — разрешаем next/image загружать их оттуда
const supabaseHost = process.env.SUPABASE_URL ? new URL(process.env.SUPABASE_URL).hostname : undefined;
const isDev = process.env.NODE_ENV !== "production";

// Content Security Policy (ТЗ §7.3): разрешены только свои ресурсы и реально используемые внешние —
// тайлы OpenStreetMap, файлы Supabase Storage, видео YouTube (youtube-nocookie) в новостях.
// 'unsafe-inline' для скриптов нужен Next.js без nonce (nonce отключил бы статическую сборку страниц).
const supabaseOrigin = supabaseHost ? `https://${supabaseHost}` : "";
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://*.tile.openstreetmap.org ${supabaseOrigin}`.trim(),
  `media-src 'self' ${supabaseOrigin}`.trim(),
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "frame-src https://www.youtube-nocookie.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Геолокация — только по кнопке «Моё местоположение» на нашем сайте; камера, микрофон, оплата — запрещены
  { key: "Permissions-Policy", value: "geolocation=(self), camera=(), microphone=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

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
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // Заголовок «X-Powered-By: Next.js» не раскрываем
  poweredByHeader: false,
  // Без плавающего значка Next.js в режиме разработки (мешает скриншотам и демонстрации)
  devIndicators: false,
  // sharp и pg — серверные нативные пакеты, не бандлим их
  serverExternalPackages: ["sharp", "pg"],
  images: {
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
      : [],
  },
};

export default withNextIntl(nextConfig);
