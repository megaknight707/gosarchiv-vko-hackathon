import type { Metadata } from "next";
import type { Locale } from "@/i18n/routing";
import { pageMetadata } from "@/lib/site/page-metadata";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export async function generateMetadata({ params }: PageProps<"/[locale]/news">): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale as Locale, "news", "/news");
}

export default async function Page({ params }: PageProps<"/[locale]/news">) {
  const { locale } = await params;
  return <PlaceholderPage locale={locale as Locale} pageKey="news" />;
}
