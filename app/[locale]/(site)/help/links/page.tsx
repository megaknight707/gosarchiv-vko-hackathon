// Полезные ссылки: проверенные государственные ресурсы, конвертер на латиницу, погода
// (те же, что на действующем сайте архива). Все внешние ссылки явно обозначены.
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { pageMetadata } from "@/lib/site/page-metadata";
import { pick, USEFUL_LINKS } from "@/lib/site/reference-content";
import { ExternalLink } from "@/components/content/external-link";
import { ReferencePage } from "@/components/content/reference-page";

export async function generateMetadata({ params }: PageProps<"/[locale]/help/links">): Promise<Metadata> {
  return pageMetadata((await params).locale as Locale, "usefulLinks", "/help/links");
}

export default async function UsefulLinksPage({ params }: PageProps<"/[locale]/help/links">) {
  const locale = (await params).locale as Locale;
  const t = await getTranslations({ locale, namespace: "Services" });
  return (
    <ReferencePage locale={locale} pageKey="usefulLinks">
      <p className="text-muted-ink">{t("linksIntro")}</p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {USEFUL_LINKS.map((link) => (
          <li key={link.href} className="rounded-[14px] border border-border bg-surface p-4">
            <ExternalLink href={link.href}>{pick(link.title, locale)}</ExternalLink>
            <p className="mt-1 font-mono text-xs break-all text-muted-ink">{new URL(link.href).hostname}</p>
            {link.note && <p className="mt-1 text-sm text-muted-ink">{pick(link.note, locale)}</p>}
          </li>
        ))}
      </ul>
    </ReferencePage>
  );
}
