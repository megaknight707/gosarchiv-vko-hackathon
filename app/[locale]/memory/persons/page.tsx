// Исторические личности — фондообразователи фондов личного происхождения.
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { listPersons } from "@/lib/memory/memory";
import { pageMetadata } from "@/lib/site/page-metadata";
import { Breadcrumbs } from "@/components/archive/breadcrumbs";
import { SectionHeading } from "@/components/archive/section-heading";
import { PersonSilhouette } from "@/components/memory/person-silhouette";

export async function generateMetadata({ params }: PageProps<"/[locale]/memory/persons">): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale as Locale, "persons", "/memory/persons");
}

export default async function PersonsPage({ params }: PageProps<"/[locale]/memory/persons">) {
  const locale = (await params).locale as Locale;
  const [t, tNav, tPages, persons] = await Promise.all([
    getTranslations({ locale, namespace: "Persons" }),
    getTranslations({ locale, namespace: "Nav" }),
    getTranslations({ locale, namespace: "Pages" }),
    listPersons(locale),
  ]);
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-10">
      <Breadcrumbs className="mb-4" items={[{ label: tNav("home"), href: "/" }, { label: tNav("memory"), href: "/memory" }, { label: tPages("persons.title") }]} />
      <SectionHeading as="h1" title={tPages("persons.title")} subtitle={tPages("persons.description")} />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {persons.map((p) => (
          <li key={p.slug}>
            <Link href={`/memory/persons/${p.slug}`} className="group flex h-full gap-4 rounded-[16px] border border-border bg-surface p-4 hover:border-primary">
              <PersonSilhouette className="h-24 w-20 shrink-0 rounded-[10px]" />
              <span className="flex flex-col">
                <span className="font-serif text-lg font-bold group-hover:text-primary">{p.name}</span>
                <span className="mt-1 text-sm text-muted-ink">{p.bio}</span>
                {p.fundNumber && <span className="mt-auto pt-2 font-mono text-xs text-primary">{t("fund", { number: p.fundNumber })}</span>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
