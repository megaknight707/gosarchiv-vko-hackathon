import type { Metadata } from "next";
import type { Locale } from "@/i18n/routing";
import { pageMetadata } from "@/lib/site/page-metadata";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export async function generateMetadata({ params }: PageProps<"/[locale]/branches">): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale as Locale, "branches", "/branches");
}

export default async function Page({ params }: PageProps<"/[locale]/branches">) {
  const { locale } = await params;
  return <PlaceholderPage locale={locale as Locale} pageKey="branches" />;
}
