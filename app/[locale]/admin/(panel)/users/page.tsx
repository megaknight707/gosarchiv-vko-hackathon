// Пользователи админки: список, создание учётной записи (роль, филиал, временный пароль).
import { getFormatter, getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { can, canManageRole } from "@/lib/auth/permissions";
import { requireAdminPage } from "@/lib/auth/require-role";
import { createUserAction } from "@/lib/admin/user-actions";
import { db } from "@/lib/db";
import type { Role } from "@/lib/generated/prisma/client";
import { pickLocale } from "@/lib/i18n/pick-locale";
import { UserForm } from "@/components/admin/user-form";
import { loose } from "@/lib/admin/loose-translator";

const ROLES: Role[] = ["SUPER_ADMIN", "SITE_ADMIN", "EDITOR", "ARCHIVIST", "BRANCH_ADMIN", "MODERATOR", "ANALYST"];

export async function generateMetadata({ params }: PageProps<"/[locale]/admin/users">) {
  const t = loose(await getTranslations({ locale: (await params).locale as Locale, namespace: "Admin.nav" }));
  return { title: t("users") };
}

export default async function AdminUsersPage({ params }: PageProps<"/[locale]/admin/users">) {
  const locale = (await params).locale as Locale;
  const actor = await requireAdminPage(locale, "users");
  const [t, format, users, branches] = await Promise.all([
    getTranslations({ locale, namespace: "Admin" }).then(loose),
    getFormatter({ locale }),
    db.user.findMany({ include: { branch: true }, orderBy: [{ isActive: "desc" }, { name: "asc" }] }),
    db.branch.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  const now = new Date();

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-bold">{t("nav.users")}</h1>
      <div className="overflow-x-auto rounded-[12px] border border-border bg-surface">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-border bg-chip/60 text-left">
            <tr>
              <th scope="col" className="px-3 py-2">{t("users.name")}</th>
              <th scope="col" className="px-3 py-2">{t("users.email")}</th>
              <th scope="col" className="px-3 py-2">{t("users.role")}</th>
              <th scope="col" className="px-3 py-2">{t("users.branch")}</th>
              <th scope="col" className="px-3 py-2">{t("users.state")}</th>
              <th scope="col" className="px-3 py-2">{t("users.lastLogin")}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-border last:border-0">
                <td className="px-3 py-2 font-bold">
                  {can(actor, "users", "edit") && canManageRole(actor, user.role) ? (
                    <Link href={`/admin/users/${user.id}`} className="hover:text-primary hover:underline">
                      {user.name}
                    </Link>
                  ) : (
                    user.name
                  )}
                </td>
                <td className="px-3 py-2 font-mono text-xs">{user.email}</td>
                <td className="px-3 py-2">{t(`roles.${user.role}`)}</td>
                <td className="px-3 py-2">{user.branch ? pickLocale(user.branch, "name", locale) : "—"}</td>
                <td className="px-3 py-2">
                  {!user.isActive ? (
                    <span className="text-primary">⛔ {t("users.blocked")}</span>
                  ) : user.lockedUntil && user.lockedUntil > now ? (
                    <span className="text-lock">🔒 {t("users.locked", { time: format.dateTime(user.lockedUntil, { timeStyle: "short" }) })}</span>
                  ) : (
                    <span className="text-ok">✓ {t("users.active")}</span>
                  )}
                </td>
                <td className="px-3 py-2 text-muted-ink">{user.lastLoginAt ? format.dateTime(user.lastLoginAt, { dateStyle: "short", timeStyle: "short" }) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {can(actor, "users", "create") && (
        <section className="max-w-3xl rounded-[12px] border border-border bg-surface p-4">
          <h2 className="mb-3 font-serif text-lg font-bold">{t("users.createTitle")}</h2>
          <UserForm
            action={createUserAction.bind(null, locale)}
            initial={null}
            roles={ROLES.filter((role) => canManageRole(actor, role)).map((role) => ({ value: role, label: t(`roles.${role}`) }))}
            branches={branches.map((b) => ({ value: b.id, label: pickLocale(b, "name", locale) }))}
          />
        </section>
      )}
    </div>
  );
}
