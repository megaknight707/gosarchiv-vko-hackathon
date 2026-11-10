import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { pageMetadata } from "@/lib/site/page-metadata";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export async function generateMetadata({ params }: PageProps<"/[locale]/news/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  return pageMetadata(locale as Locale, "newsItem", `/news/${slug}`);
}

export default async function Page({ params }: PageProps<"/[locale]/news/[slug]">) {
  const { locale } = await params;
  const tNav = await getTranslations({ locale: locale as Locale, namespace: "Nav" });
  return <PlaceholderPage locale={locale as Locale} pageKey="newsItem" parents={[{ label: tNav("news"), href: "/news" }]} />;
}
