// Шапка сайта: верхняя строка с контактами (только на широких экранах)
// и основная строка — логотип, меню, поиск, язык, тема, кнопка «Каталог».
import { Clock, Mail, Phone } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { knownValue } from "@/lib/archive/todo";
import { pickLocale } from "@/lib/i18n/pick-locale";
import { getMainBranch, phoneHref } from "@/lib/site/main-branch";
import { ArchiveSeal } from "./archive-seal";
import { LanguageSwitcher } from "./language-switcher";
import { LowVisionToggle } from "./low-vision-toggle";
import { MainNav } from "./main-nav";
import { MobileMenu } from "./mobile-menu";
import { SearchDialog } from "./search-dialog";
import { ThemeToggle } from "./theme-toggle";
import { SocialIcon } from "./social-icon";
import { socials } from "@/lib/site/socials";

export async function SiteHeader({ locale }: { locale: Locale }) {
  const [t, tBrand, branch] = await Promise.all([
    getTranslations({ locale, namespace: "Header" }),
    getTranslations({ locale, namespace: "Brand" }),
    getMainBranch(),
  ]);

  const phone = knownValue(branch?.phone);
  const email = knownValue(branch?.email);
  const hours = branch ? knownValue(pickLocale(branch, "workHours", locale)) : null;

  return (
    <header className="border-b border-border bg-surface">
      {/* Верхняя строка: контакты и версия для слабовидящих */}
      <div className="hidden border-b border-border text-[13px] whitespace-nowrap text-muted-ink lg:block">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between gap-6 px-8">
          <ul className="flex items-center gap-5">
            {phone && (
              <li>
                <a href={phoneHref(phone)} className="inline-flex items-center gap-1.5 hover:text-ink">
                  <Phone aria-hidden className="size-3.5" />
                  <span className="sr-only">{t("phone")}: </span>
                  {phone}
                </a>
              </li>
            )}
            {email && (
              <li>
                <a href={`mailto:${email}`} className="inline-flex items-center gap-1.5 hover:text-ink">
                  <Mail aria-hidden className="size-3.5" />
                  <span className="sr-only">{t("email")}: </span>
                  {email}
                </a>
              </li>
            )}
            {hours && (
              <li className="inline-flex items-center gap-1.5">
                <Clock aria-hidden className="size-3.5" />
                <span className="sr-only">{t("workHours")}: </span>
                {hours}
              </li>
            )}
          </ul>
          <div className="flex items-center gap-4">
            <LowVisionToggle />
            <ul aria-label={t("socials")} className="flex items-center gap-2">
              {socials.map((s) => (
                <li key={s.key}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} title={`${s.label} ${s.handle}`} className="grid size-6 place-items-center rounded-md hover:text-ink">
                    <SocialIcon name={s.key} className="size-4" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Основная строка */}
      <div className="mx-auto flex h-15 max-w-7xl items-center gap-3 px-4 sm:h-[76px] sm:gap-6 sm:px-8">
        <Link href="/" aria-label={tBrand("home")} className="flex min-w-0 items-center gap-2 sm:shrink-0 sm:gap-3">
          <ArchiveSeal className="size-9 sm:size-11" />
          <span className="min-w-0 leading-tight">
            <strong className="block max-w-[120px] font-serif text-[13px] font-bold min-[400px]:max-w-[150px] sm:max-w-none sm:text-[15px]">{tBrand("name")}</strong>
            <small className="hidden text-xs text-muted-ink sm:block" lang={locale === "kz" ? "ru" : "kk"}>
              {tBrand("tagline")}
            </small>
          </span>
        </Link>

        <MainNav />

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2 xl:ml-0">
          <LanguageSwitcher />
          <SearchDialog className="hidden sm:grid" />
          <ThemeToggle />
          <Link
            href="/catalog"
            className="hidden rounded-[10px] bg-primary px-[18px] py-2.5 text-[15px] font-bold whitespace-nowrap text-primary-foreground transition-opacity hover:opacity-90 md:inline-flex"
          >
            {t("catalogButton")}
          </Link>
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
