// Шапка, подвал, ИИ-помощник и нижнее меню публичного сайта вокруг содержимого страницы.
// Используется в (site)/layout.tsx и на странице 404 (она рисуется уровнем выше группы (site)).
import type { ReactNode } from "react";
import type { Locale } from "@/i18n/routing";
import { isDemoMode } from "@/lib/site/config";
import { DemoBanner } from "@/components/layout/demo-banner";
import { SkipLink } from "@/components/layout/skip-link";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { AssistantPanel } from "@/components/assistant/assistant-panel";
import { PageViewBeacon } from "@/components/layout/page-view-beacon";

export function SiteChrome({ locale, children }: { locale: Locale; children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] sm:pb-0">
      <SkipLink />
      {isDemoMode && <DemoBanner />}
      <SiteHeader locale={locale} />
      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <SiteFooter locale={locale} />
      <AssistantPanel />
      <MobileTabBar />
      <PageViewBeacon />
    </div>
  );
}
