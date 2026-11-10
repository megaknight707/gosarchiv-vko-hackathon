"use client";

// Нижнее меню на телефонах (< 640px): Главная / Каталог / Выставки / Филиалы.
// Кнопки большие — удобно нажимать большим пальцем.
import { GalleryVerticalEnd, House, MapPin, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { isActivePath } from "@/lib/site/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "home", href: "/", Icon: House },
  { key: "catalog", href: "/catalog", Icon: Search },
  { key: "exhibitions", href: "/exhibitions", Icon: GalleryVerticalEnd },
  { key: "branches", href: "/branches", Icon: MapPin },
] as const;

export function MobileTabBar() {
  const pathname = usePathname();
  const t = useTranslations("Nav");

  return (
    <nav
      aria-label={t("mobileLabel")}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] sm:hidden"
    >
      <ul className="grid grid-cols-4">
        {TABS.map(({ key, href, Icon }) => {
          const active = isActivePath(pathname, href);
          return (
            <li key={key}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 text-[11px]",
                  active ? "font-bold text-primary" : "text-muted-ink",
                )}
              >
                <Icon aria-hidden className="size-5" />
                {t(key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
