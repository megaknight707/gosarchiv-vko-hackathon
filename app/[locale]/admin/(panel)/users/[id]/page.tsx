// Карточка сотрудника: роль, филиал, блокировка, сброс пароля.
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { canManageRole } from "@/lib/auth/permissions";
import { requireAdminPage } from "@/lib/auth/require-role";
import { resetPasswordAction, updateUserAction } from "@/lib/admin/user-actions";
import { db } from "@/lib/db";
import type { Role } from "@/lib/generated/prisma/client";
import { pickLocale } from "@/lib/i18n/pick-locale";
import { UserForm } from "@/components/admin/user-form";
import { loose } from "@/lib/admin/loose-translator";

const ROLES: Role[] = ["SUPER_ADMIN", "SITE_ADMIN", "EDITOR", "ARCHIVIST", "BRANCH_ADMIN", "MODERATOR", "ANALYST"];

export default async function AdminUserPage({ params }: PageProps<"/[locale]/admin/users/[id]">) {
  const { locale: rawLocale, id } = await params;
  const locale = rawLocale as Locale;
  const actor = await requireAdminPage(locale, "users", "edit");
  const user = await db.user.findUnique({ where: { id } });
  if (!user) notFound();
  if (!canManageRole(actor, user.role)) redirect(`/${locale}/admin/forbidden`);
  const [t, branches] = await Promise.all([getTranslations({ locale, namespace: "Admin" }).then(loose), db.branch.findMany({ orderBy: { sortOrder: "asc" } })]);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href="/admin/users" className="text-sm text-muted-ink hover:text-ink">
        ← {t("nav.users")}
      </Link>
      <h1 className="font-serif text-2xl font-bold">{user.name}</h1>
      <section className="rounded-[12px] border border-border bg-surface p-4">
        <UserForm
          action={updateUserAction.bind(null, user.id)}
          resetAction={resetPasswordAction.bind(null, user.id)}
          initial={{ email: user.email, name: user.name, role: user.role, branchId: user.branchId ?? "", isActive: user.isActive }}
          roles={ROLES.filter((role) => canManageRole(actor, role)).map((role) => ({ value: role, label: t(`roles.${role}`) }))}
          branches={branches.map((b) => ({ value: b.id, label: pickLocale(b, "name", locale) }))}
        />
      </section>
      <Link href={`/admin/audit?entity=users&entityId=${user.id}`} className="inline-block text-sm font-bold text-accent-2 hover:underline">
        {t("audit.forRecord")}
      </Link>
    </div>
  );
}
