import type { NextConfig } from "next";

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
  // sharp и pg — серверные нативные пакеты, не бандлим их
  serverExternalPackages: ["sharp", "pg"],
};

export default nextConfig;
