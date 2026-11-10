// Каркас публичного сайта: плашка демо-режима, шапка, подвал, ИИ-помощник и нижнее меню на телефоне.
// Группа маршрутов (site) не попадает в URL: /ru/catalog остаётся /ru/catalog.
// У админки (/[locale]/admin) свой каркас без публичной шапки.
import type { Locale } from "@/i18n/routing";
import { SiteChrome } from "@/components/layout/site-chrome";

export default async function SiteLayout({ children, params }: LayoutProps<"/[locale]">) {
  return <SiteChrome locale={(await params).locale as Locale}>{children}</SiteChrome>;
}
