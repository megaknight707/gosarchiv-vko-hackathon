// Разделы сайта — один список для главного меню, мобильного меню и подвала.
import type messages from "@/messages/ru.json";

type NavKey = Exclude<keyof typeof messages.Nav, "label" | "mobileLabel">;

export type NavItem = { key: NavKey; href: string };

/** Главное меню в шапке (как в макете) */
export const mainNav: NavItem[] = [
  { key: "home", href: "/" },
  { key: "about", href: "/about" },
  { key: "catalog", href: "/catalog" },
  { key: "memory", href: "/memory" },
  { key: "exhibitions", href: "/exhibitions" },
  { key: "branches", href: "/branches" },
  { key: "help", href: "/help" },
];

/** Дополнительные разделы — в бургер-меню и подвале */
export const secondaryNav: NavItem[] = [
  { key: "news", href: "/news" },
  { key: "faq", href: "/faq" },
  { key: "feedback", href: "/feedback" },
];

/** Активен ли пункт меню для текущего пути (без префикса языка) */
export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Ссылки на государственные ресурсы (ТЗ §5.1, подвал) */
export const govLinks = [
  { key: "akorda", href: "https://www.akorda.kz" },
  { key: "egov", href: "https://egov.kz" },
  { key: "adilet", href: "https://adilet.zan.kz" },
  { key: "govkz", href: "https://www.gov.kz/memleket/entities/vko-uca" },
] as const;
