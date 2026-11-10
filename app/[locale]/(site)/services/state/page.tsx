// «Государственная услуга»: выдача архивных справок, копий и выписок. Правила, способы обращения
// (eGov, e-vko, ЦОН, канцелярия архива), отчёт за 2025 год, качество услуги. Заявления здесь не принимаются.
import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { pageMetadata } from "@/lib/site/page-metadata";
import { pick, STATE_SERVICE, VERIFIED_AT } from "@/lib/site/reference-content";
import { Breadcrumbs } from "@/components/archive/breadcrumbs";
import { SectionHeading } from "@/components/archive/section-heading";
import { ExternalLink } from "@/components/content/external-link";
import { InfoOnlyNotice } from "@/components/services/info-only-notice";

export async function generateMetadata({ params }: PageProps<"/[locale]/services/state">): Promise<Metadata> {
  return pageMetadata((await params).locale as Locale, "stateService", "/services/state");
}

export default async function StateServicePage({ params }: PageProps<"/[locale]/services/state">) {
  const locale = (await params).locale as Locale;
  const [tNav, tPages, t, format] = await Promise.all([
    getTranslations({ locale, namespace: "Nav" }),
    getTranslations({ locale, namespace: "Pages" }),
    getTranslations({ locale, namespace: "Services" }),
    getFormatter({ locale }),
  ]);
  const s = STATE_SERVICE.stats2025;
  const h2 = "font-serif text-2xl font-bold";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8 sm:py-10">
      <Breadcrumbs
        className="mb-4"
        items={[{ label: tNav("home"), href: "/" }, { label: tPages("services.title"), href: "/services" }, { label: tPages("stateService.title") }]}
      />
      <SectionHeading as="h1" title={tPages("stateService.title")} subtitle={pick(STATE_SERVICE.name, locale)} />
      <InfoOnlyNotice />
      <p className="mt-4 rounded-[14px] bg-ok-soft px-4 py-3 font-bold text-ok">{pick(STATE_SERVICE.free, locale)}</p>

      <section aria-labelledby="channels" className="mt-8">
        <h2 id="channels" className={h2}>{t("channels")}</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {STATE_SERVICE.channels.map((channel, i) => (
            <li key={i} className="rounded-[14px] border border-border bg-surface p-4">
              <p className="font-bold">{channel.href ? <ExternalLink href={channel.href}>{pick(channel.title, locale)}</ExternalLink> : pick(channel.title, locale)}</p>
              <p className="mt-1 text-sm text-muted-ink">{pick(channel.text, locale)}</p>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-muted-ink">
          <ExternalLink href={STATE_SERVICE.apostille}>{t("apostille")}</ExternalLink>
        </p>
      </section>

      <section aria-labelledby="stats" className="mt-10">
        <h2 id="stats" className={h2}>{t("stats")}</h2>
        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            [s.total, t("statsTotal")],
            [s.electronic, t("statsElectronic")],
            [s.individuals, t("statsIndividuals")],
            [s.legalEntities, t("statsLegal")],
          ].map(([value, label]) => (
            <div key={String(label)} className="rounded-[14px] border border-border bg-surface p-4">
              <dt className="text-sm text-muted-ink">{label}</dt>
              <dd className="font-serif text-2xl font-bold">{format.number(Number(value))}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 text-xs text-muted-ink">{t("statsSource")}</p>
      </section>

      <section aria-labelledby="docs" className="mt-10">
        <h2 id="docs" className={h2}>{t("documents")}</h2>
        <ul className="mt-4 space-y-3">
          {STATE_SERVICE.documents.map((doc) => (
            <li key={doc.href} className="rounded-[14px] border border-border bg-surface p-4">
              <ExternalLink href={doc.href}>{pick(doc.title, locale)}</ExternalLink>
              <p className="mt-1 text-xs text-muted-ink">{doc.source === "adilet" ? t("fromAdilet") : t("fromArchive")}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="quality" className="mt-10">
        <h2 id="quality" className={h2}>{t("complaints")}</h2>
        <p className="mt-2">
          {pick(STATE_SERVICE.complaints, locale)} <ExternalLink href={STATE_SERVICE.otinish}>e-Otinish</ExternalLink>
        </p>
      </section>

      <p className="mt-10 text-xs text-muted-ink">{t("verified", { date: format.dateTime(new Date(VERIFIED_AT), { dateStyle: "long" }) })}</p>
    </div>
  );
}
