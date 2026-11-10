import type { Metadata } from "next";
import type { Locale } from "@/i18n/routing";
import { pageMetadata } from "@/lib/site/page-metadata";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export async function generateMetadata({ params }: PageProps<"/[locale]/about">): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale as Locale, "about", "/about");
}

export default async function Page({ params }: PageProps<"/[locale]/about">) {
  const { locale } = await params;
  return <PlaceholderPage locale={locale as Locale} pageKey="about" />;
}
