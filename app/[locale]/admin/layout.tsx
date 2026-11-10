// Общие настройки всех страниц админки: не индексируются поисковиками и не кэшируются.
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: LayoutProps<"/[locale]/admin">): Promise<Metadata> {
  const t = await getTranslations({ locale: (await params).locale as Locale, namespace: "Admin" });
  return {
    // absolute — без приставки публичного сайта «· Госархив ВКО»
    title: { absolute: t("title"), template: `%s · ${t("title")}` },
    robots: { index: false, follow: false, nocache: true },
  };
}

export default function AdminRootLayout({ children }: LayoutProps<"/[locale]/admin">) {
  return children;
}
