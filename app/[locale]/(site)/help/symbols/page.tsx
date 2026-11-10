// Государственные символы РК: официальные материалы — ссылками на сайт Президента и «Әділет».
// Изображения символов не копируем: официальное описание — у первоисточника.
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { pageMetadata } from "@/lib/site/page-metadata";
import { pick, STATE_SYMBOLS } from "@/lib/site/reference-content";
import { ExternalLink } from "@/components/content/external-link";
import { ReferencePage } from "@/components/content/reference-page";

export async function generateMetadata({ params }: PageProps<"/[locale]/help/symbols">): Promise<Metadata> {
  return pageMetadata((await params).locale as Locale, "symbols", "/help/symbols");
}

export default async function SymbolsPage({ params }: PageProps<"/[locale]/help/symbols">) {
  const locale = (await params).locale as Locale;
  const t = await getTranslations({ locale, namespace: "Services" });
  return (
    <ReferencePage locale={locale} pageKey="symbols">
      <p className="text-muted-ink">{t("symbolsIntro")}</p>
      <ul className="mt-6 space-y-3">
        {STATE_SYMBOLS.map((link) => (
          <li key={link.href} className="rounded-[14px] border border-border bg-surface p-4">
            <ExternalLink href={link.href}>{pick(link.title, locale)}</ExternalLink>
            {link.note && <p className="mt-1 text-sm text-muted-ink">{pick(link.note, locale)}</p>}
          </li>
        ))}
      </ul>
    </ReferencePage>
  );
}
