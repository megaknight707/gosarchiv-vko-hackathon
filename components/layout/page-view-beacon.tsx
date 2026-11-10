"use client";

// Простой счётчик просмотров разделов для аналитики в админке.
// Отправляет только раздел сайта («catalog», «branches») и язык — без cookie, IP и личных данных.
import { useEffect } from "react";
import { useLocale } from "next-intl";
import { usePathname } from "@/i18n/navigation";

export function PageViewBeacon() {
  const pathname = usePathname();
  const locale = useLocale();

  useEffect(() => {
    const section = pathname.split("/")[1] || "home";
    const body = JSON.stringify({ section, locale });
    try {
      if (!navigator.sendBeacon?.("/api/pageview", new Blob([body], { type: "application/json" }))) {
        void fetch("/api/pageview", { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } });
      }
    } catch {
      // счётчик не важнее страницы — ошибки игнорируем
    }
  }, [pathname, locale]);

  return null;
}
