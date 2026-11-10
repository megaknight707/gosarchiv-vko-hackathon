"use client";

// Форма сотрудника: e-mail, имя, роль, филиал, активность; сброс пароля.
// Временный пароль показывается один раз — его нужно передать сотруднику лично.
import { KeyRound, Save } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import type { UserFormState } from "@/lib/admin/user-actions";
import { loose } from "@/lib/admin/loose-translator";

type Option = { value: string; label: string };

export function UserForm({
  action,
  resetAction,
  initial,
  roles,
  branches,
}: {
  action: (state: UserFormState, formData: FormData) => Promise<UserFormState>;
  resetAction?: (state: UserFormState) => Promise<UserFormState>;
  initial: { email: string; name: string; role: string; branchId: string; isActive: boolean } | null;
  roles: Option[];
  branches: Option[];
}) {
  const t = loose(useTranslations("Admin"));
  const [state, formAction, pending] = useActionState(action, {} as UserFormState);
  const [resetState, resetFormAction, resetting] = useActionState(resetAction ?? (async (s: UserFormState) => s), {} as UserFormState);
  const error = (name: keyof NonNullable<UserFormState["errors"]>) => state.errors?.[name];
  const password = state.password ?? resetState.password;

  return (
    <div className="space-y-4">
      {password && (
        <div role="status" className="rounded-lg border border-ok/40 bg-ok-soft p-3 text-sm text-ok">
          <p className="font-bold">{t("users.passwordShown")}</p>
          <p className="mt-1 font-mono text-base text-ink select-all">{password}</p>
          <p className="mt-1 text-xs">{t("users.passwordHint")}</p>
        </div>
      )}
      {state.formError && (
        <p role="alert" className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">
          {t(`users.errors.${state.formError}`)}
        </p>
      )}
      {state.saved && !state.password && (
        <p role="status" className="rounded-lg bg-ok-soft px-3 py-2 text-sm text-ok">
          {t("notices.saved")}
        </p>
      )}
      <form action={formAction} key={state.version} className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-bold">
          {t("users.email")} <span className="text-primary">*</span>
          <input name="email" type="email" required defaultValue={initial?.email} aria-invalid={Boolean(error("email"))} className="admin-input mt-1 font-normal" />
          {error("email") && <span className="mt-1 block text-xs font-normal text-primary">{t(`users.errors.${error("email")}`)}</span>}
        </label>
        <label className="block text-sm font-bold">
          {t("users.name")} <span className="text-primary">*</span>
          <input name="name" required defaultValue={initial?.name} aria-invalid={Boolean(error("name"))} className="admin-input mt-1 font-normal" />
          {error("name") && <span className="mt-1 block text-xs font-normal text-primary">{t("errors.required")}</span>}
        </label>
        <label className="block text-sm font-bold">
          {t("users.role")} <span className="text-primary">*</span>
          <select name="role" required defaultValue={initial?.role ?? "ARCHIVIST"} aria-invalid={Boolean(error("role"))} className="admin-input mt-1 font-normal">
            {roles.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
          {error("role") && <span className="mt-1 block text-xs font-normal text-primary">{t(`users.errors.${error("role")}`)}</span>}
        </label>
        <label className="block text-sm font-bold">
          {t("users.branch")}
          <select name="branchId" defaultValue={initial?.branchId ?? ""} aria-invalid={Boolean(error("branchId"))} className="admin-input mt-1 font-normal">
            <option value="">—</option>
            {branches.map((branch) => (
              <option key={branch.value} value={branch.value}>
                {branch.label}
              </option>
            ))}
          </select>
          {error("branchId") && <span className="mt-1 block text-xs font-normal text-primary">{t("users.errors.branch")}</span>}
        </label>
        {initial && (
          <label className="flex items-center gap-2 text-sm font-bold">
            <input type="checkbox" name="isActive" defaultChecked={initial.isActive} className="size-4" />
            {t("users.isActive")}
          </label>
        )}
        <div className="sm:col-span-2">
          <button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-[10px] bg-primary px-4 py-2 font-bold text-primary-foreground disabled:opacity-60">
            <Save aria-hidden className="size-4" />
            {initial ? t("form.save") : t("users.create")}
          </button>
        </div>
      </form>
      {resetAction && (
        <form action={resetFormAction} onSubmit={(e) => { if (!window.confirm(t("users.resetConfirm"))) e.preventDefault(); }}>
          <button type="submit" disabled={resetting} className="inline-flex items-center gap-2 rounded-[10px] border border-border px-4 py-2 text-sm font-bold hover:bg-chip">
            <KeyRound aria-hidden className="size-4" />
            {t("users.resetPassword")}
          </button>
        </form>
      )}
    </div>
  );
}
