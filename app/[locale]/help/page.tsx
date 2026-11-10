// Справочная информация (ТЗ §5.4) — строго информационная: назначение сайта, навигация,
// интерактивная схема архива, как искать, как читать шифр, типы документов, статусы доступа,
// контакты архива и филиалов, ссылки на открытые ресурсы. Никаких заявлений и заказов.
import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getBranches } from "@/lib/site/branches";
import { pageMetadata } from "@/lib/site/page-metadata";
import { AccessStamp } from "@/components/archive/access-stamp";
import { Breadcrumbs } from "@/components/archive/breadcrumbs";
import { SectionHeading } from "@/components/archive/section-heading";
import { ArchiveStructureScheme } from "@/components/help/archive-structure-scheme";

export async function generateMetadata({ params }: PageProps<"/[locale]/help">): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale as Locale, "help", "/help");
}

export default async function HelpPage({ params }: PageProps<"/[locale]/help">) {
  const locale = (await params).locale as Locale;
  const [t, tNav, tPages, tContent, tBranches, tCommon, branches] = await Promise.all([
    getTranslations({ locale, namespace: "Help" }),
    getTranslations({ locale, namespace: "Nav" }),
    getTranslations({ locale, namespace: "Pages" }),
    getTranslations({ locale, namespace: "Content" }),
    getTranslations({ locale, namespace: "Branches" }),
    getTranslations({ locale, namespace: "Common" }),
    getBranches(locale),
  ]);

  const sections = [
    { id: "purpose", title: t("purposeTitle") },
    { id: "navigation", title: t("navTitle") },
    { id: "structure", title: t("schemeTitle") },
    { id: "search", title: t("searchTitle") },
    { id: "cipher", title: t("cipherTitle") },
    { id: "types", title: t("typesTitle") },
    { id: "access", title: t("accessTitle") },
    { id: "contacts", title: t("contactsTitle") },
    { id: "links", title: t("linksTitle") },
  ];
  const title = (id: string) => sections.find((s) => s.id === id)!.title;
  const h2 = "mb-4 font-serif text-2xl font-bold";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-10">
      <Breadcrumbs className="mb-4" items={[{ label: tNav("home"), href: "/" }, { label: tPages("help.title") }]} />
      <SectionHeading as="h1" title={tPages("help.title")} subtitle={tPages("help.description")} />

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <nav aria-label={tContent("sections")} className="lg:sticky lg:top-4 lg:self-start">
          <ul className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:gap-1 lg:overflow-visible">
            {sections.map((s) => (
              <li key={s.id} className="shrink-0">
                <a href={`#${s.id}`} className="block rounded-full border border-border bg-surface px-3 py-1.5 text-sm whitespace-nowrap hover:border-primary lg:rounded-md lg:border-0 lg:bg-transparent lg:px-2 lg:hover:bg-chip">
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 max-w-3xl space-y-12">
          <section id="purpose" className="scroll-mt-6">
            <h2 className={h2}>{title("purpose")}</h2>
            <p className="leading-relaxed">{t("purposeText")}</p>
          </section>

          <section id="navigation" className="scroll-mt-6">
            <h2 className={h2}>{title("navigation")}</h2>
            <ul className="list-disc space-y-1.5 pl-5 marker:text-primary">
              {t("navItems").split(" · ").map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section id="structure" className="scroll-mt-6">
            <h2 className={h2}>{title("structure")}</h2>
            <ArchiveStructureScheme />
          </section>

          <section id="search" className="scroll-mt-6">
            <h2 className={h2}>{title("search")}</h2>
            <ol className="space-y-3">
              {(["s1", "s2", "s3", "s4"] as const).map((step, i) => (
                <li key={step} className="flex gap-3">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary font-mono text-sm font-bold text-primary-foreground">{i + 1}</span>
                  <span className="leading-relaxed">{t(`searchSteps.${step}`)}</span>
                </li>
              ))}
            </ol>
            <Link href="/catalog" className="mt-5 inline-block rounded-[10px] bg-primary px-4 py-2.5 font-bold text-primary-foreground hover:opacity-90">
              {t("openCatalog")}
            </Link>
          </section>

          <section id="cipher" className="scroll-mt-6">
            <h2 className={h2}>{title("cipher")}</h2>
            <div className="flex flex-wrap items-end gap-3 rounded-[14px] bg-chip p-5 font-mono text-xl sm:text-2xl">
              {([
                ["Ф. 1520", "fund"],
                ["Оп. 2", "inventory"],
                ["Д. 14", "unit"],
              ] as const).map(([part, key], i) => (
                <span key={key} className="flex items-end gap-3">
                  <span className="flex flex-col items-center">
                    <span className="rounded-md border-2 border-primary px-2 py-1 text-ink">{part}</span>
                    <span className="mt-1 font-sans text-xs text-muted-ink">{t(`cipherParts.${key}`)}</span>
                  </span>
                  {i < 2 && <span className="pb-6 text-muted-ink">·</span>}
                </span>
              ))}
            </div>
            <p className="mt-3 leading-relaxed text-muted-ink">{t("cipherText")}</p>
          </section>

          <section id="types" className="scroll-mt-6">
            <h2 className={h2}>{title("types")}</h2>
            <p className="leading-relaxed">{t("typesText")}</p>
          </section>

          <section id="access" className="scroll-mt-6">
            <h2 className={h2}>{title("access")}</h2>
            <ul className="space-y-4">
              {(["OPEN", "DESCRIPTION_ONLY", "RESTRICTED"] as const).map((status) => (
                <li key={status} className="flex flex-col gap-2 rounded-[12px] border border-border bg-surface p-4 sm:flex-row sm:items-center sm:gap-5">
                  <AccessStamp status={status} className="self-start sm:w-48 sm:shrink-0 sm:self-center" />
                  <span>{t(`access.${status}`)}</span>
                </li>
              ))}
            </ul>
          </section>

          <section id="contacts" className="scroll-mt-6">
            <h2 className={h2}>{title("contacts")}</h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {branches.map((b) => (
                <li key={b.slug} className="rounded-[12px] border border-border bg-surface p-4 text-sm">
                  <Link href={`/branches?b=${b.slug}`} className="font-serif text-base font-bold hover:text-primary hover:underline">
                    {b.name}
                  </Link>
                  <p className="mt-1">{b.address ?? <span className="text-muted-ink italic">{tCommon("toBeConfirmed")}</span>}</p>
                  {b.phone && <p>{tBranches("phone")}: {b.phone}</p>}
                  {b.email && <p>{tBranches("email")}: {b.email}</p>}
                  <p>
                    {tBranches("workHours")}: {b.workHours ?? <span className="text-muted-ink italic">{tCommon("toBeConfirmed")}</span>}
                  </p>
                  {b.readingRoomHours && <p>{tBranches("readingRoom")}: {b.readingRoomHours}</p>}
                </li>
              ))}
            </ul>
          </section>

          <section id="links" className="scroll-mt-6">
            <h2 className={h2}>{title("links")}</h2>
            <ul className="space-y-2">
              {([
                ["adilet", "https://adilet.zan.kz"],
                ["egov", "https://egov.kz"],
                ["govkz", "https://www.gov.kz/memleket/entities/vko-uca"],
              ] as const).map(([key, href]) => (
                <li key={key}>
                  <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-bold text-primary underline-offset-4 hover:underline">
                    {t(`links.${key}`)}
                    <ExternalLink aria-hidden className="size-3.5" />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
