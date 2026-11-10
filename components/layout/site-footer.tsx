// Подвал: полное наименование, адрес и контакты (из базы), разделы,
// государственные ресурсы, политика конфиденциальности, ©.
// Подвал тёмный в обеих темах (как в макете), поэтому цвета заданы явно.
import { ExternalLink } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { knownValue } from "@/lib/archive/todo";
import { pickLocale } from "@/lib/i18n/pick-locale";
import { getMainBranch, phoneHref } from "@/lib/site/main-branch";
import { govLinks, mainNav, secondaryNav } from "@/lib/site/navigation";
import { getPublicViews } from "@/lib/site/public-stats";
import { socials } from "@/lib/site/socials";
import { SocialIcon } from "./social-icon";

export async function SiteFooter({ locale }: { locale: Locale }) {
  const [t, tNav, tBrand, branch, views] = await Promise.all([
    getTranslations({ locale, namespace: "Footer" }),
    getTranslations({ locale, namespace: "Nav" }),
    getTranslations({ locale, namespace: "Brand" }),
    getMainBranch(),
    getPublicViews(),
  ]);

  const address = branch ? knownValue(pickLocale(branch, "address", locale)) : null;
  const hours = branch ? knownValue(pickLocale(branch, "workHours", locale)) : null;
  const readingRoom = branch ? knownValue(pickLocale(branch, "readingRoomHours", locale)) : null;
  const phone = knownValue(branch?.phone);
  const email = knownValue(branch?.email);

  const linkClass = "hover:text-[#FFF8EE] hover:underline underline-offset-4";
  const headingClass = "mb-3 font-serif text-[15px] font-bold text-[#FFF8EE]";

  return (
    <footer className="mt-16 bg-[#1E1A15] pt-10 pb-7 text-sm text-[#CFC6B6] sm:mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <section aria-labelledby="footer-contacts">
            <h2 id="footer-contacts" className={headingClass}>
              {tBrand("name")}
            </h2>
            <p className="mb-3 text-[13px] text-[#A99F8E]">{tBrand("fullName")}</p>
            <address className="space-y-1 not-italic">
              {address && <p>{address}</p>}
              {phone && (
                <p>
                  <a href={phoneHref(phone)} className={linkClass}>
                    {phone}
                  </a>
                </p>
              )}
              {email && (
                <p>
                  <a href={`mailto:${email}`} className={linkClass}>
                    {email}
                  </a>
                </p>
              )}
              {hours && (
                <p>
                  {t("workHours")}: {hours}
                </p>
              )}
              {readingRoom && (
                <p>
                  {t("readingRoom")}: {readingRoom}
                </p>
              )}
            </address>
            <ul aria-label={t("socials")} className="mt-4 flex gap-2">
              {socials.map((s) => (
                <li key={s.key}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="grid size-9 place-items-center rounded-full border border-[#3A342B] hover:border-[#CFC6B6] hover:text-[#FFF8EE]">
                    <SocialIcon name={s.key} className="size-4" />
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <nav aria-labelledby="footer-sections">
            <h2 id="footer-sections" className={headingClass}>
              {t("sections")}
            </h2>
            <ul className="space-y-1.5">
              {mainNav.slice(1, 5).map((item) => (
                <li key={item.key}>
                  <Link href={item.href} className={linkClass}>
                    {tNav(item.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-visitors">
            <h2 id="footer-visitors" className={headingClass}>
              {t("visitors")}
            </h2>
            <ul className="space-y-1.5">
              {[mainNav[6], mainNav[5], ...secondaryNav].map((item) => (
                <li key={item.key}>
                  <Link href={item.href} className={linkClass}>
                    {tNav(item.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-gov">
            <h2 id="footer-gov" className={headingClass}>
              {t("govResources")}
            </h2>
            <ul className="space-y-1.5">
              {govLinks.map((link) => (
                <li key={link.key}>
                  <a href={link.href} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1 ${linkClass}`}>
                    {t(link.key)}
                    <ExternalLink aria-hidden className="size-3" />
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-[#3A342B] pt-4 text-[13px] text-[#A99F8E] sm:flex-row sm:justify-between">
          <p>
            {t("copyright", { year: new Date().getFullYear() })} ·{" "}
            <Link href="/privacy" className={linkClass}>
              {tNav("privacy")}
            </Link>
          </p>
          <p>
            {t("informational")}
            {views !== null && views > 0 && <> · {t("views", { count: views })}</>}
          </p>
        </div>
      </div>
    </footer>
  );
}
