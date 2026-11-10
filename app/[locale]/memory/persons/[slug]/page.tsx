// Страница исторической личности: справка только по данным архива, ссылка на личный фонд,
// документы из фонда. Вместо портрета — нейтральная заглушка.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Info } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { pickLocale } from "@/lib/i18n/pick-locale";
import { getPerson } from "@/lib/memory/memory";
import { isDemoMode } from "@/lib/site/config";
import { languageAlternates } from "@/lib/site/page-metadata";
import { Breadcrumbs } from "@/components/archive/breadcrumbs";
import { DocumentCard } from "@/components/archive/document-card";
import { PersonSilhouette } from "@/components/memory/person-silhouette";

export async function generateMetadata({ params }: PageProps<"/[locale]/memory/persons/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const person = await getPerson(slug);
  if (!person) return {};
  return {
    title: pickLocale(person, "name", locale as Locale),
    description: pickLocale(person, "bio", locale as Locale),
    alternates: { canonical: `/${locale}/memory/persons/${slug}`, languages: languageAlternates(`/memory/persons/${slug}`) },
  };
}

export default async function PersonPage({ params }: PageProps<"/[locale]/memory/persons/[slug]">) {
  const { locale: rawLocale, slug } = await params;
  const locale = rawLocale as Locale;
  const person = await getPerson(slug);
  if (!person) notFound();
  const [t, tNav, tPages] = await Promise.all([
    getTranslations({ locale, namespace: "Persons" }),
    getTranslations({ locale, namespace: "Nav" }),
    getTranslations({ locale, namespace: "Pages" }),
  ]);
  const name = pickLocale(person, "name", locale);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-10">
      <Breadcrumbs
        className="mb-6"
        items={[{ label: tNav("memory"), href: "/memory" }, { label: tPages("persons.title"), href: "/memory/persons" }, { label: name }]}
      />
      <article className="grid gap-6 sm:grid-cols-[180px_1fr]">
        <PersonSilhouette className="h-52 w-44 rounded-[14px]" />
        <div>
          <h1 className="font-serif text-3xl font-bold sm:text-4xl">{name}</h1>
          {person.lifeYears && <p className="mt-1 font-mono text-muted-ink">{person.lifeYears}</p>}
          <p className="mt-4 max-w-2xl text-lg leading-relaxed">{pickLocale(person, "bio", locale)}</p>
          <p className="mt-3 flex max-w-2xl items-start gap-2 text-sm text-muted-ink">
            <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
            {t("bioNote")}
          </p>
          {person.fund ? (
            <Link
              href={`/catalog?view=funds&fund=${encodeURIComponent(person.fund.number)}`}
              className="mt-5 inline-block rounded-[10px] bg-primary px-4 py-2.5 font-bold text-primary-foreground hover:opacity-90"
            >
              {t("openFund")} · <span className="font-mono">{t("fund", { number: person.fund.number })}</span>
            </Link>
          ) : (
            <p className="mt-5 text-muted-ink">{t("noFund")}</p>
          )}
        </div>
      </article>

      {person.documents.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 font-serif text-2xl font-bold">{t("docs")}</h2>
          <ul className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {person.documents.map((doc) => (
              <li key={doc.id} className="flex">
                <DocumentCard
                  className="w-full"
                  showDemo={isDemoMode}
                  doc={{
                    id: doc.id,
                    title: pickLocale(doc, "title", locale),
                    cipher: doc.cipher,
                    docType: doc.docType,
                    yearLabel: doc.yearFrom ? String(doc.yearFrom) : null,
                    placeName: doc.place ? pickLocale(doc.place, "name", locale) : null,
                    accessStatus: doc.accessStatus,
                    previewUrl: doc.accessStatus === "OPEN" ? (doc.files[0]?.previewUrl ?? null) : null,
                    isDemo: doc.isDemo,
                  }}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
