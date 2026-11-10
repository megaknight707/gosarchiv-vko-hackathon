"use client";

// Форма входа: e-mail и пароль. Ошибки — понятным текстом; при блокировке — до какого времени.
import { LogIn } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useActionState } from "react";
import type { Locale } from "@/i18n/routing";
import { loginAction, type LoginState } from "@/lib/auth/login-actions";
import { loose } from "@/lib/admin/loose-translator";

export function LoginForm({ locale }: { locale: Locale }) {
  const t = loose(useTranslations("Admin.login"));
  const format = useFormatter();
  const [state, action, pending] = useActionState(loginAction, {} as LoginState);

  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="locale" value={locale} />
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-bold">
          {t("email")}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          defaultValue={state.email}
          aria-invalid={Boolean(state.error)}
          aria-describedby={state.error ? "login-error" : undefined}
          className="admin-input"
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-bold">
          {t("password")}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={Boolean(state.error)}
          aria-describedby={state.error ? "login-error" : undefined}
          className="admin-input"
        />
      </div>
      {state.error && (
        <p id="login-error" role="alert" className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">
          {state.error === "locked" && state.lockedUntil
            ? t("locked", { time: format.dateTime(new Date(state.lockedUntil), { hour: "2-digit", minute: "2-digit" }) })
            : t(`errors.${state.error}`)}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-[10px] bg-primary px-4 py-2.5 font-bold text-primary-foreground hover:opacity-90 disabled:opacity-60"
      >
        <LogIn aria-hidden className="size-4" />
        {pending ? t("signingIn") : t("submit")}
      </button>
    </form>
  );
}
