// «Платные услуги»: постановление акимата № 289 и действующий прейскурант — только справочно.
// Сайт не оформляет заказы, не рассчитывает стоимость и не принимает платежи.
import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { pageMetadata } from "@/lib/site/page-metadata";
import { PAID_SERVICES, pick, VERIFIED_AT } from "@/lib/site/reference-content";
import { getPriceList } from "@/lib/services/price-list";
import { Breadcrumbs } from "@/components/archive/breadcrumbs";
import { SectionHeading } from "@/components/archive/section-heading";
import { ExternalLink } from "@/components/content/external-link";
import { InfoOnlyNotice } from "@/components/services/info-only-notice";
import { PriceListTable } from "@/components/services/price-list-table";

export async function generateMetadata({ params }: PageProps<"/[locale]/services/paid">): Promise<Metadata> {
  return pageMetadata((await params).locale as Locale, "paidServices", "/services/paid");
}

export default async function PaidServicesPage({ params }: PageProps<"/[locale]/services/paid">) {
  const locale = (await params).locale as Locale;
  const [tNav, tPages, t, format] = await Promise.all([
    getTranslations({ locale, namespace: "Nav" }),
    getTranslations({ locale, namespace: "Pages" }),
    getTranslations({ locale, namespace: "Services" }),
    getFormatter({ locale }),
  ]);
  const prices = getPriceList(locale);
  const h2 = "font-serif text-2xl font-bold";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8 sm:py-10">
      <Breadcrumbs
        className="mb-4"
        items={[{ label: tNav("home"), href: "/" }, { label: tPages("services.title"), href: "/services" }, { label: tPages("paidServices.title") }]}
      />
      <SectionHeading as="h1" title={tPages("paidServices.title")} subtitle={tPages("paidServices.description")} />
      <InfoOnlyNotice />

      <section aria-labelledby="act" className="mt-8 rounded-[18px] border border-border bg-surface p-5">
        <h2 id="act" className="text-sm font-bold text-muted-ink uppercase">{t("actTitle")}</h2>
        <p className="mt-2 font-serif text-lg font-bold">{pick(PAID_SERVICES.act, locale)}</p>
        <p className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <ExternalLink href={pick(PAID_SERVICES.adilet, locale)}>{t("openAdilet")}</ExternalLink>
          <ExternalLink href={pick(PAID_SERVICES.scan, locale)}>{t("openScan")}</ExternalLink>
        </p>
        <p className="mt-4 text-sm">
          <b>{t("basisTitle")}:</b> <ExternalLink href={PAID_SERVICES.basisHref} className="font-normal">{pick(PAID_SERVICES.basis, locale)}</ExternalLink>
        </p>
      </section>

      <section aria-labelledby="popular" className="mt-10">
        <h2 id="popular" className={h2}>{t("popularTitle")}</h2>
        <ul className="mt-4 divide-y divide-border rounded-[14px] border border-border bg-surface">
          {prices.popular.map((item) => (
            <li key={item.index} className="flex items-baseline justify-between gap-4 px-4 py-3">
              <span>
                <span className="mr-2 font-mono text-xs text-muted-ink">{item.index}</span>
                {item.name.replace(/^-\s*/, "")} <span className="text-sm text-muted-ink">· {item.unit}</span>
              </span>
              <span className="font-mono font-bold whitespace-nowrap">{item.price}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="prices" className="mt-10">
        <h2 id="prices" className={h2}>{t("priceTitle")}</h2>
        <p className="mt-2 text-sm text-muted-ink">{t("priceHint")}</p>
        {locale === "en" && <p className="mt-1 text-sm text-muted-ink">{t("sourceLanguage")}</p>}
        <div className="mt-4">
          <PriceListTable sections={prices.sections} />
        </div>
      </section>

      <section aria-labelledby="notes" className="mt-10">
        <h2 id="notes" className={h2}>{t("notesTitle")}</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed marker:text-primary">
          {prices.notes.map((note, i) => (
            <li key={i}>{note}</li>
          ))}
        </ul>
      </section>

      <p className="mt-10 text-xs text-muted-ink">{t("verified", { date: format.dateTime(new Date(VERIFIED_AT), { dateStyle: "long" }) })}</p>
    </div>
  );
}
