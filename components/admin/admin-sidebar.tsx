// Боковое меню админки: показываются только разделы, доступные роли.
// На телефоне меню сворачивается в раскрывающийся список.
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { can } from "@/lib/auth/permissions";
import type { AdminUser } from "@/lib/auth/session";
import { ADMIN_NAVIGATION } from "@/lib/admin/admin-navigation";
import { canSeeModeration } from "@/lib/admin/moderation-queue";
import { ArchiveSeal } from "@/components/layout/archive-seal";
import { AdminNavLink } from "./admin-nav-link";
import { loose } from "@/lib/admin/loose-translator";

export async function AdminSidebar({ user, locale, tasks }: { user: AdminUser; locale: Locale; tasks: number }) {
  const t = loose(await getTranslations({ locale, namespace: "Admin.nav" }));
  const groups = ADMIN_NAVIGATION.map((group) => ({
    ...group,
    items: group.items.filter((item) =>
      item.resource === "dashboard" ? true : item.resource === "moderation" ? canSeeModeration(user) : can(user, item.resource, "view"),
    ),
  })).filter((group) => group.items.length > 0);

  const menu = (
    <nav aria-label={t("label")} className="space-y-5 text-sm">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="mb-1.5 px-2 text-xs font-bold tracking-wide text-muted-ink uppercase">{t(`groups.${group.label}`)}</p>
          <ul className="space-y-0.5">
            {group.items.map((item) => (
              <li key={item.href}>
                <AdminNavLink href={`/admin${item.href}`} exact={item.href === ""}>
                  <span>{t(item.label)}</span>
                  {item.resource === "moderation" && tasks > 0 && (
                    <span className="ml-auto rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground" aria-label={t("tasks", { count: tasks })}>
                      {tasks}
                    </span>
                  )}
                </AdminNavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <aside className="border-b border-border bg-surface lg:sticky lg:top-0 lg:h-screen lg:w-60 lg:shrink-0 lg:overflow-y-auto lg:border-r lg:border-b-0">
      <div className="flex items-center gap-2.5 px-4 py-3">
        <ArchiveSeal className="size-8 shrink-0" />
        <div className="leading-tight">
          <p className="font-serif font-bold">{t("brand")}</p>
          <p className="text-xs text-muted-ink">{t("brandSub")}</p>
        </div>
      </div>
      <details className="group px-3 pb-3 lg:hidden">
        <summary className="cursor-pointer rounded-lg border border-border px-3 py-2 text-sm font-bold">
          {t("menu")}
          {tasks > 0 && <span className="ml-2 rounded-full bg-primary px-1.5 text-xs text-primary-foreground">{tasks}</span>}
        </summary>
        <div className="mt-3">{menu}</div>
      </details>
      <div className="hidden px-3 pb-6 lg:block">{menu}</div>
    </aside>
  );
}
