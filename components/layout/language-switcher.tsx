"use client";

// Переключатель KZ / RU / EN. Остаётся на той же странице и сохраняет параметры
// поиска (?type=PHOTO&from=1960): /ru/catalog?type=PHOTO → /kz/catalog?type=PHOTO.
// Выбор запоминается в cookie NEXT_LOCALE (это делает next-intl).
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { htmlLang, routing, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className }: { className?: string }) {
  const current = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("Language");

  function switchTo(event: React.MouseEvent, locale: Locale) {
    event.preventDefault();
    router.replace(`${pathname}${window.location.search}`, { locale, scroll: false });
  }

  return (
    <nav aria-label={t("label")} className={cn("flex overflow-hidden rounded-full border border-border text-[13px] font-bold", className)}>
      {routing.locales.map((locale) => {
        const active = locale === current;
        return (
          <Link
            key={locale}
            href={pathname}
            locale={locale}
            hrefLang={htmlLang[locale]}
            lang={htmlLang[locale]}
            aria-current={active ? "true" : undefined}
            aria-label={t(locale)}
            onClick={(event) => switchTo(event, locale)}
            className={cn(
              "px-2 py-1.5 text-xs uppercase transition-colors sm:px-2.5 sm:text-[13px]",
              active ? "bg-ink text-bg" : "text-muted-ink hover:bg-chip hover:text-ink",
            )}
          >
            {locale}
          </Link>
        );
      })}
    </nav>
  );
}
