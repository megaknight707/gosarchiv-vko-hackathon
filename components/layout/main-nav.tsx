"use client";

// Главное меню в шапке (на широких экранах). Текущий раздел подчёркнут
// и помечен aria-current="page" — это слышит экранный диктор.
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { isActivePath, mainNav } from "@/lib/site/navigation";
import { cn } from "@/lib/utils";

export function MainNav() {
  const pathname = usePathname();
  const t = useTranslations("Nav");

  return (
    <nav aria-label={t("label")} className="hidden flex-1 justify-center xl:flex">
      <ul className="flex gap-5 text-[15px] whitespace-nowrap">
        {mainNav.map((item) => {
          const active = isActivePath(pathname, item.href);
          return (
            <li key={item.key}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-block pb-1 transition-colors hover:text-primary",
                  active && "text-primary shadow-[inset_0_-2px_0_var(--accent)]",
                )}
              >
                {t(item.key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
