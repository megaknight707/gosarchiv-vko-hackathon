// Законодательные и нормативные акты: реквизиты и ссылки на официальные тексты в ИПС «Әділет».
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { pageMetadata } from "@/lib/site/page-metadata";
import { LEGAL_ACTS, LEGAL_ACTS_ARCHIVE_PAGE, pick, type LegalAct } from "@/lib/site/reference-content";
import { ExternalLink } from "@/components/content/external-link";
import { ReferencePage } from "@/components/content/reference-page";

const TOPICS: LegalAct["topic"][] = ["archive", "services", "region", "data"];

export async function generateMetadata({ params }: PageProps<"/[locale]/help/legal-acts">): Promise<Metadata> {
  return pageMetadata((await params).locale as Locale, "legalActs", "/help/legal-acts");
}

export default async function LegalActsPage({ params }: PageProps<"/[locale]/help/legal-acts">) {
  const locale = (await params).locale as Locale;
  const t = await getTranslations({ locale, namespace: "Services" });

  return (
    <ReferencePage locale={locale} pageKey="legalActs">
      <p className="text-muted-ink">{t("legalIntro")}</p>
      {TOPICS.map((topic) => (
        <section key={topic} aria-labelledby={`topic-${topic}`} className="mt-8">
          <h2 id={`topic-${topic}`} className="font-serif text-xl font-bold">
            {t(`legalTopics.${topic}`)}
          </h2>
          <ul className="mt-3 space-y-3">
            {LEGAL_ACTS.filter((act) => act.topic === topic).map((act) => (
              <li key={act.href} className="rounded-[14px] border border-border bg-surface p-4">
                <ExternalLink href={act.href}>{pick(act.title, locale)}</ExternalLink>
                <p className="mt-1 text-sm text-muted-ink">
                  {pick(act.details, locale)} · {act.href.startsWith("/") ? t("fromArchive") : t("fromAdilet")}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <p className="mt-8 text-sm">
        <ExternalLink href={LEGAL_ACTS_ARCHIVE_PAGE}>{t("legalAll")}</ExternalLink>
      </p>
    </ReferencePage>
  );
}
