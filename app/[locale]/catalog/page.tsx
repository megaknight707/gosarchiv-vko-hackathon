import type { Metadata } from "next";
import type { Locale } from "@/i18n/routing";
import { pageMetadata } from "@/lib/site/page-metadata";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export async function generateMetadata({ params }: PageProps<"/[locale]/catalog">): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale as Locale, "catalog", "/catalog");
}

export default async function Page({ params }: PageProps<"/[locale]/catalog">) {
  const { locale } = await params;
  return <PlaceholderPage locale={locale as Locale} pageKey="catalog" />;
}
