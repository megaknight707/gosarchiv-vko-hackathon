// robots.txt (ТЗ §7.5). В демо-режиме (DEMO_MODE=true) сайт полностью закрыт от индексации —
// это хакатонный прототип, а не официальный сайт. Иначе закрыты админка и служебные API.
import type { MetadataRoute } from "next";
import { isDemoMode, siteUrl } from "@/lib/site/config";

export default function robots(): MetadataRoute.Robots {
  if (isDemoMode) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/kz/admin", "/ru/admin", "/en/admin", "/api/"] },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
