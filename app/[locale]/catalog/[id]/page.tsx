import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { pageMetadata } from "@/lib/site/page-metadata";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export async function generateMetadata({ params }: PageProps<"/[locale]/catalog/[id]">): Promise<Metadata> {
  const { locale, id } = await params;
  return pageMetadata(locale as Locale, "document", `/catalog/${id}`);
}

export default async function Page({ params }: PageProps<"/[locale]/catalog/[id]">) {
  const { locale } = await params;
  const tNav = await getTranslations({ locale: locale as Locale, namespace: "Nav" });
  return <PlaceholderPage locale={locale as Locale} pageKey="document" parents={[{ label: tNav("catalog"), href: "/catalog" }]} />;
}
