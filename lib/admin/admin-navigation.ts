// Пункты бокового меню админки. Пункт виден, только если у роли есть право «view» на раздел.
// Скрытие пункта — удобство; сама страница всё равно проверяет права на сервере.
import type { AdminResource } from "@/lib/auth/permissions";

export type AdminNavItem = { href: string; resource: AdminResource | "dashboard" | "moderation"; label: string };
export type AdminNavGroup = { label: string; items: AdminNavItem[] };

export const ADMIN_NAVIGATION: AdminNavGroup[] = [
  {
    label: "overview",
    items: [
      { href: "", resource: "dashboard", label: "dashboard" },
      { href: "/moderation", resource: "moderation", label: "moderation" },
    ],
  },
  {
    label: "catalog",
    items: [
      { href: "/funds", resource: "funds", label: "funds" },
      { href: "/inventories", resource: "inventories", label: "inventories" },
      { href: "/units", resource: "units", label: "units" },
      { href: "/documents", resource: "documents", label: "documents" },
      { href: "/import", resource: "import", label: "import" },
    ],
  },
  {
    label: "museum",
    items: [
      { href: "/exhibitions", resource: "exhibitions", label: "exhibitions" },
      { href: "/exhibits", resource: "exhibits", label: "exhibits" },
      { href: "/collections", resource: "collections", label: "collections" },
      { href: "/persons", resource: "persons", label: "persons" },
      { href: "/events", resource: "events", label: "events" },
    ],
  },
  {
    label: "content",
    items: [
      { href: "/news", resource: "news", label: "news" },
      { href: "/pages", resource: "pages", label: "pages" },
      { href: "/faq", resource: "faq", label: "faq" },
      { href: "/branches", resource: "branches", label: "branches" },
      { href: "/feedback", resource: "feedback", label: "feedback" },
    ],
  },
  {
    label: "system",
    items: [
      { href: "/analytics", resource: "analytics", label: "analytics" },
      { href: "/users", resource: "users", label: "users" },
      { href: "/audit", resource: "audit", label: "audit" },
      { href: "/settings", resource: "settings", label: "settings" },
    ],
  },
];
