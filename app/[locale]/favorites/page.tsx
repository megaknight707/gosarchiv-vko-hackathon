// «Избранное» без личного кабинета: список хранится только в браузере посетителя.
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { isDemoMode } from "@/lib/site/config";
import { pageMetadata } from "@/lib/site/page-metadata";
import { Breadcrumbs } from "@/components/archive/breadcrumbs";
import { SectionHeading } from "@/components/archive/section-heading";
import { FavoritesList } from "@/components/document/favorites-list";

export async function generateMetadata({ params }: PageProps<"/[locale]/favorites">): Promise<Metadata> {
  const { locale } = await params;
  return { ...(await pageMetadata(locale as Locale, "favorites", "/favorites")), robots: { index: false } };
}

export default async function FavoritesPage({ params }: PageProps<"/[locale]/favorites">) {
  const locale = (await params).locale as Locale;
  const [tNav, tPages] = await Promise.all([
    getTranslations({ locale, namespace: "Nav" }),
    getTranslations({ locale, namespace: "Pages" }),
  ]);
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-12">
      <Breadcrumbs className="mb-6" items={[{ label: tNav("home"), href: "/" }, { label: tPages("favorites.title") }]} />
      <SectionHeading as="h1" title={tPages("favorites.title")} subtitle={tPages("favorites.description")} />
      <FavoritesList showDemo={isDemoMode} />
    </div>
  );
}
