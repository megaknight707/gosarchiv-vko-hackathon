// Хлебные крошки: Главная / Каталог / Фонд 1520 / Опись 2 / Дело 14.
// Последний пункт — текущая страница (aria-current="page", без ссылки).
// Заодно выводит разметку BreadcrumbList (JSON-LD) для поисковиков (ТЗ §7.5).
import { ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { siteUrl } from "@/lib/site/config";
import { cn } from "@/lib/utils";

export type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  const t = useTranslations("Common");
  const locale = useLocale();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: `${siteUrl}/${locale}${item.href === "/" ? "" : item.href}` } : {}),
    })),
  };
  return (
    <nav aria-label={t("breadcrumbs")} className={cn("text-sm text-muted-ink", className)}>
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="inline-flex items-center gap-1">
              {item.href && !last ? (
                <Link href={item.href} className="hover:text-ink hover:underline">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className={cn(last && "text-ink")}>
                  {item.label}
                </span>
              )}
              {!last && <ChevronRight aria-hidden className="size-3.5" />}
            </li>
          );
        })}
      </ol>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </nav>
  );
}
