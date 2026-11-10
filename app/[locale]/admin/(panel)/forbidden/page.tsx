// «Нет доступа»: сюда сервер перенаправляет, если у роли нет прав на раздел или запись.
import { ShieldAlert } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";

export default async function AdminForbiddenPage({ params }: PageProps<"/[locale]/admin/forbidden">) {
  const t = await getTranslations({ locale: (await params).locale as Locale, namespace: "Admin.forbidden" });
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <ShieldAlert aria-hidden className="mx-auto size-12 text-primary" />
      <h1 className="mt-4 font-serif text-2xl font-bold">{t("title")}</h1>
      <p className="mt-2 text-muted-ink">{t("text")}</p>
      <Link href="/admin" className="mt-6 inline-block rounded-[10px] bg-primary px-4 py-2 font-bold text-primary-foreground">
        {t("back")}
      </Link>
    </div>
  );
}
