// «Услуги и порядок обращения» — справочный раздел по «Дополнениям к ТЗ» (§9):
// государственная услуга и платные услуги. Только информация и ссылки на официальные сервисы.
import type { Metadata } from "next";
import { BadgeCheck, FileText, ReceiptText } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { pageMetadata } from "@/lib/site/page-metadata";
import { pick, STATE_SERVICE } from "@/lib/site/reference-content";
import { Breadcrumbs } from "@/components/archive/breadcrumbs";
import { SectionHeading } from "@/components/archive/section-heading";
import { ExternalLink } from "@/components/content/external-link";
import { InfoOnlyNotice } from "@/components/services/info-only-notice";

export async function generateMetadata({ params }: PageProps<"/[locale]/services">): Promise<Metadata> {
  return pageMetadata((await params).locale as Locale, "services", "/services");
}

export default async function ServicesPage({ params }: PageProps<"/[locale]/services">) {
  const locale = (await params).locale as Locale;
  const [tNav, tPages, t] = await Promise.all([
    getTranslations({ locale, namespace: "Nav" }),
    getTranslations({ locale, namespace: "Pages" }),
    getTranslations({ locale, namespace: "Services" }),
  ]);
  const cards = [
    { href: "/services/state", title: tPages("stateService.title"), text: t("stateCard"), Icon: BadgeCheck },
    { href: "/services/paid", title: tPages("paidServices.title"), text: t("paidCard"), Icon: ReceiptText },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8 sm:py-10">
      <Breadcrumbs className="mb-4" items={[{ label: tNav("home"), href: "/" }, { label: tPages("services.title") }]} />
      <SectionHeading as="h1" title={tPages("services.title")} subtitle={tPages("services.description")} />
      <InfoOnlyNotice />

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {cards.map(({ href, title, text, Icon }) => (
          <Link key={href} href={href} className="group rounded-[18px] border border-border bg-surface p-6 transition-colors hover:border-primary">
            <Icon aria-hidden className="size-7 text-primary" />
            <h2 className="mt-3 font-serif text-xl font-bold group-hover:text-primary">{title}</h2>
            <p className="mt-2 text-muted-ink">{text}</p>
          </Link>
        ))}
      </div>

      <section aria-labelledby="how" className="mt-10">
        <h2 id="how" className="font-serif text-2xl font-bold">
          {t("howTitle")}
        </h2>
        <p className="mt-2 text-muted-ink">
          {t("howText")} <b>{pick(STATE_SERVICE.name, locale)}</b>.
        </p>
        <ol className="mt-4 grid gap-3 sm:grid-cols-2">
          {STATE_SERVICE.channels.map((channel, i) => (
            <li key={i} className="rounded-[14px] border border-border bg-surface p-4">
              <p className="font-bold">
                {i + 1}. {channel.href ? <ExternalLink href={channel.href}>{pick(channel.title, locale)}</ExternalLink> : pick(channel.title, locale)}
              </p>
              <p className="mt-1 text-sm text-muted-ink">{pick(channel.text, locale)}</p>
            </li>
          ))}
        </ol>
        <p className="mt-4 flex items-center gap-2 text-sm">
          <FileText aria-hidden className="size-4 text-accent-2" />
          <Link href="/help/legal-acts" className="font-bold text-primary hover:underline">
            {tPages("legalActs.title")}
          </Link>
        </p>
      </section>
    </div>
  );
}
