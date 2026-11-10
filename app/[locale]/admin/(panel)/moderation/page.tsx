// Очередь согласования: что ждёт проверки, публикации или доработки — по правам роли.
import { getFormatter, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { requireAdminPage } from "@/lib/auth/require-role";
import { canSeeModeration, loadQueue, type QueueKind } from "@/lib/admin/moderation-queue";
import { loose } from "@/lib/admin/loose-translator";

const KINDS: QueueKind[] = ["review", "publish", "changes"];

export async function generateMetadata({ params }: PageProps<"/[locale]/admin/moderation">) {
  const t = loose(await getTranslations({ locale: (await params).locale as Locale, namespace: "Admin.nav" }));
  return { title: t("moderation") };
}

export default async function AdminModerationPage({ params }: PageProps<"/[locale]/admin/moderation">) {
  const locale = (await params).locale as Locale;
  const user = await requireAdminPage(locale);
  if (!canSeeModeration(user)) redirect(`/${locale}/admin/forbidden`);
  const [t, format, queue] = await Promise.all([
    getTranslations({ locale, namespace: "Admin" }).then(loose),
    getFormatter({ locale }),
    loadQueue(user, locale),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold">{t("nav.moderation")}</h1>
        <p className="mt-1 text-sm text-muted-ink">{t("moderation.queueIntro")}</p>
      </div>
      {KINDS.map((kind) => {
        const items = queue.filter((entry) => entry.kind === kind);
        return (
          <section key={kind} aria-labelledby={`queue-${kind}`} className="rounded-[12px] border border-border bg-surface p-4">
            <h2 id={`queue-${kind}`} className="font-serif text-lg font-bold">
              {t(`moderation.queue.${kind}`)} <span className="text-sm font-normal text-muted-ink">({items.length})</span>
            </h2>
            {items.length === 0 ? (
              <p className="mt-2 text-sm text-muted-ink">{t("moderation.queueEmpty")}</p>
            ) : (
              <ul className="mt-3 divide-y divide-border text-sm">
                {items.map((entry) => (
                  <li key={`${entry.entity}-${entry.id}`} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <span className="min-w-0">
                      <span className="mr-2 rounded bg-chip px-1.5 py-0.5 text-xs text-muted-ink">{t(`nav.${entry.entity}`)}</span>
                      <Link href={`/admin/${entry.entity}/${entry.id}`} className="font-bold hover:text-primary hover:underline">
                        {entry.title}
                      </Link>
                    </span>
                    <span className="text-xs text-muted-ink">{format.relativeTime(entry.updatedAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
