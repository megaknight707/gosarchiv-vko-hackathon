// Страница онлайн-выставки — сторителлинг: обложка во весь экран → экспонаты по прокрутке
// с индикатором разделов → лайтбокс → «Другие выставки» и «Поделиться» (ТЗ §5.7).
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowDown, Info } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getExhibition, listExhibitions } from "@/lib/memory/exhibitions";
import { isDemoMode, siteUrl } from "@/lib/site/config";
import { languageAlternates } from "@/lib/site/page-metadata";
import { Breadcrumbs } from "@/components/archive/breadcrumbs";
import { ShareLinks } from "@/components/content/share-links";
import { ExhibitionStory } from "@/components/exhibitions/exhibition-story";
import { ExhibitionCardLink } from "@/components/exhibitions/exhibition-card";

export async function generateMetadata({ params }: PageProps<"/[locale]/exhibitions/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const exhibition = await getExhibition(slug, locale as Locale);
  if (!exhibition) return {};
  return {
    title: exhibition.title,
    description: exhibition.description,
    alternates: { canonical: `/${locale}/exhibitions/${slug}`, languages: languageAlternates(`/exhibitions/${slug}`) },
    openGraph: { title: exhibition.title, description: exhibition.description, images: exhibition.coverUrl ? [{ url: exhibition.coverUrl }] : undefined },
  };
}

export default async function ExhibitionPage({ params }: PageProps<"/[locale]/exhibitions/[slug]">) {
  const { locale: rawLocale, slug } = await params;
  const locale = rawLocale as Locale;
  const exhibition = await getExhibition(slug, locale);
  if (!exhibition) notFound();

  const [t, tNav, all] = await Promise.all([
    getTranslations({ locale, namespace: "Exhibitions" }),
    getTranslations({ locale, namespace: "Nav" }),
    listExhibitions(locale),
  ]);
  const others = all.filter((e) => e.slug !== slug).slice(0, 3);

  return (
    <>
      {/* Обложка во весь экран */}
      <section className="relative flex min-h-[calc(100svh-120px)] items-end overflow-hidden bg-[#2a241e] text-[#FFF8EE]">
        {exhibition.coverUrl && (
          <Image src={exhibition.coverUrl} alt="" fill priority sizes="100vw" className="object-cover opacity-70" />
        )}
        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,16,12,.1)_0%,rgba(20,16,12,.85)_80%)]" />
        <div className="relative mx-auto w-full max-w-7xl px-4 pt-10 pb-12 sm:px-8 sm:pb-16">
          <Breadcrumbs
            className="mb-6 text-[#e8dcc4] [&_[aria-current]]:text-[#FFF8EE]"
            items={[{ label: tNav("home"), href: "/" }, { label: tNav("exhibitions"), href: "/exhibitions" }, { label: exhibition.title }]}
          />
          <p className="text-sm tracking-[.16em] uppercase opacity-85">
            {exhibition.period} · {t("exhibitsCount", { count: exhibition.exhibits.length })}
          </p>
          <h1 className="mt-3 max-w-4xl font-serif text-[34px] leading-[1.1] font-bold sm:text-5xl lg:text-6xl">{exhibition.title}</h1>
          <p className="mt-5 max-w-2xl text-lg text-[#F3E9D6]">{exhibition.description}</p>
          <a href="#exhibit-1" className="mt-8 inline-flex items-center gap-2 rounded-[12px] bg-[#FFF8EE] px-5 py-3 font-bold text-[#1E1A15] hover:opacity-90">
            {t("start")}
            <ArrowDown aria-hidden className="size-4 motion-safe:animate-bounce" />
          </a>
        </div>
      </section>

      {exhibition.isDemo && isDemoMode && (
        <p role="note" className="mx-auto mt-6 flex max-w-7xl items-start gap-2 px-4 text-sm text-muted-ink sm:px-8">
          <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-accent-2" />
          {t("demoNote")}
        </p>
      )}

      <ExhibitionStory exhibits={exhibition.exhibits} />

      <section className="mx-auto max-w-7xl border-t border-border px-4 pt-10 sm:px-8">
        <p className="mb-6 font-serif text-lg text-muted-ink">— {t("end")} —</p>
        <ShareLinks title={exhibition.title} url={`${siteUrl}/${locale}/exhibitions/${slug}`} />
        {others.length > 0 && (
          <>
            <h2 className="mt-10 mb-4 font-serif text-2xl font-bold">{t("other")}</h2>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((e) => (
                <li key={e.slug}>
                  <ExhibitionCardLink exhibition={e} />
                </li>
              ))}
            </ul>
          </>
        )}
        <Link href="/exhibitions" className="mt-6 inline-block font-bold text-primary hover:underline">
          ← {tNav("exhibitions")}
        </Link>
      </section>
    </>
  );
}
