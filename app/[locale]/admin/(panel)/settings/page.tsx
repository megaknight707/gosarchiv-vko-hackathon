// Настройки системы (только просмотр): режимы работы и языковые версии.
// Значения задаются переменными окружения на сервере (Vercel) — так секреты и режимы
// не меняются из браузера; сама страница показывает, что сейчас включено.
import { getTranslations } from "next-intl/server";
import { locales, type Locale } from "@/i18n/routing";
import { requireAdminPage } from "@/lib/auth/require-role";
import { isOnlineAvailable } from "@/lib/ai/run-assistant";
import { PERMISSIONS, type AdminAction } from "@/lib/auth/permissions";
import { getStorageDriverName } from "@/lib/storage";
import { isDemoMode } from "@/lib/site/config";
import { loose } from "@/lib/admin/loose-translator";

const ACTIONS: AdminAction[] = ["view", "create", "edit", "delete", "submit", "moderate", "publish"];

export async function generateMetadata({ params }: PageProps<"/[locale]/admin/settings">) {
  const t = loose(await getTranslations({ locale: (await params).locale as Locale, namespace: "Admin.nav" }));
  return { title: t("settings") };
}

export default async function AdminSettingsPage({ params }: PageProps<"/[locale]/admin/settings">) {
  const locale = (await params).locale as Locale;
  await requireAdminPage(locale, "settings");
  const t = loose(await getTranslations({ locale, namespace: "Admin" }));
  const rows = [
    { label: t("settings.demoMode"), value: isDemoMode ? t("settings.on") : t("settings.off") },
    { label: t("settings.aiMode"), value: isOnlineAvailable() ? t("settings.aiOnline") : t("settings.aiOffline") },
    { label: t("settings.storage"), value: getStorageDriverName() === "supabase" ? "Supabase Storage" : t("settings.localStorage") },
    { label: t("settings.languages"), value: locales.map((l) => l.toUpperCase()).join(" · ") },
    { label: t("settings.session"), value: t("settings.sessionValue") },
  ];

  return (
    <div className="max-w-5xl space-y-6">
      <h1 className="font-serif text-2xl font-bold">{t("nav.settings")}</h1>
      <p className="text-sm text-muted-ink">{t("settings.intro")}</p>
      <dl className="divide-y divide-border rounded-[12px] border border-border bg-surface">
        {rows.map((row) => (
          <div key={row.label} className="grid gap-1 px-4 py-3 sm:grid-cols-[16rem_1fr]">
            <dt className="text-sm font-bold">{row.label}</dt>
            <dd className="text-sm">{row.value}</dd>
          </div>
        ))}
      </dl>

      <section>
        <h2 className="mb-2 font-serif text-lg font-bold">{t("settings.permissions")}</h2>
        <p className="mb-3 text-sm text-muted-ink">{t("settings.permissionsIntro")}</p>
        <div className="overflow-x-auto rounded-[12px] border border-border bg-surface">
          <table className="w-full min-w-[720px] text-xs">
            <thead className="border-b border-border bg-chip/60 text-left">
              <tr>
                <th scope="col" className="px-3 py-2">{t("settings.role")}</th>
                <th scope="col" className="px-3 py-2">{t("settings.access")}</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(PERMISSIONS).map(([role, matrix]) => (
                <tr key={role} className="border-b border-border align-top last:border-0">
                  <th scope="row" className="px-3 py-2 text-left text-sm whitespace-nowrap">{t(`roles.${role}`)}</th>
                  <td className="px-3 py-2">
                    <ul className="flex flex-wrap gap-1.5">
                      {Object.entries(matrix).map(([resource, actions]) => (
                        <li key={resource} className="rounded bg-chip px-1.5 py-0.5">
                          <b>{t(`nav.${resource}`)}</b>: {ACTIONS.filter((a) => actions?.includes(a)).map((a) => t(`settings.actions.${a}`)).join(", ")}
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
