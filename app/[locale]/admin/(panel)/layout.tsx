// Каркас админки: боковое меню по правам роли, верхняя панель (язык, тема, выход),
// предупреждение об автовыходе. Без входа — перенаправление на страницу входа.
import { LogOut } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { logoutAction } from "@/lib/auth/login-actions";
import { requireAdminPage } from "@/lib/auth/require-role";
import { countMyTasks } from "@/lib/admin/moderation-queue";
import { isDemoMode } from "@/lib/site/config";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { SessionTimeout } from "@/components/admin/session-timeout";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { loose } from "@/lib/admin/loose-translator";

export default async function AdminPanelLayout({ children, params }: LayoutProps<"/[locale]/admin">) {
  const locale = (await params).locale as Locale;
  const user = await requireAdminPage(locale);
  const t = loose(await getTranslations({ locale, namespace: "Admin" }));
  const tasks = await countMyTasks(user);

  return (
    <div className="flex min-h-screen flex-col bg-bg lg:flex-row">
      <a href="#admin-main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded focus:bg-surface focus:px-3 focus:py-2">
        {t("skipToContent")}
      </a>
      <AdminSidebar user={user} locale={locale} tasks={tasks} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-4 py-2.5">
          <div className="min-w-0 text-sm">
            <span className="font-bold">{user.name}</span>
            <span className="ml-2 rounded-full bg-chip px-2 py-0.5 text-xs text-muted-ink">{t(`roles.${user.role}`)}</span>
            {isDemoMode && <span className="ml-2 text-xs text-muted-ink">· {t("demoNotice")}</span>}
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            <form action={logoutAction.bind(null, locale, undefined)}>
              <button type="submit" className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm font-bold hover:bg-chip">
                <LogOut aria-hidden className="size-4" />
                {t("logout")}
              </button>
            </form>
          </div>
        </header>
        <main id="admin-main" tabIndex={-1} className="flex-1 px-4 py-6 outline-none sm:px-6">
          {children}
        </main>
      </div>
      <SessionTimeout locale={locale} />
    </div>
  );
}
