// Вход сотрудников архива. Публичной регистрации нет — учётные записи создаёт главный администратор.
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { getCurrentUser } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/site/config";
import { LoginForm } from "@/components/admin/login-form";
import { ArchiveSeal } from "@/components/layout/archive-seal";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({ params }: PageProps<"/[locale]/admin/login">) {
  const t = await getTranslations({ locale: (await params).locale as Locale, namespace: "Admin.login" });
  return { title: t("title") };
}

export default async function AdminLoginPage({ params, searchParams }: PageProps<"/[locale]/admin/login">) {
  const locale = (await params).locale as Locale;
  if (await getCurrentUser()) redirect(`/${locale}/admin`);
  const { reason } = await searchParams;
  const t = await getTranslations({ locale, namespace: "Admin.login" });

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="text-sm font-bold text-muted-ink hover:text-ink">
          ← {t("toSite")}
        </Link>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>
      <main id="main-content" className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-sm rounded-[14px] border border-border bg-surface p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <ArchiveSeal className="size-11 shrink-0" />
            <div>
              <h1 className="font-serif text-xl font-bold">{t("title")}</h1>
              <p className="text-sm text-muted-ink">{t("subtitle")}</p>
            </div>
          </div>
          {reason === "idle" && (
            <p role="status" className="mb-4 rounded-lg bg-lock-soft px-3 py-2 text-sm text-lock">
              {t("idle")}
            </p>
          )}
          <LoginForm locale={locale} />
          <p className="mt-6 text-xs text-muted-ink">{t("noRegistration")}</p>
          {isDemoMode && <p className="mt-2 text-xs text-muted-ink">{t("demoHint")}</p>}
        </div>
      </main>
    </div>
  );
}
