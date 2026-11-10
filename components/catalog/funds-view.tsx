// Вид каталога «Фонды»: структура архива Фонд → Опись → Дело → Документ.
// Без параметра — список фондов по тематическим группам; с ?fund=<id> — описи и дела фонда.
import { ChevronRight, FolderOpen, User } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { db } from "@/lib/db";
import { pickLocale } from "@/lib/i18n/pick-locale";
import { Breadcrumbs } from "@/components/archive/breadcrumbs";
import { AccessStamp } from "@/components/archive/access-stamp";

export async function FundsList({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "Catalog" });
  const funds = await db.fund.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ category: { sortOrder: "asc" } }, { number: "asc" }],
    include: {
      category: true,
      inventories: { where: { status: "PUBLISHED" }, select: { storageUnits: { select: { _count: { select: { documents: { where: { status: "PUBLISHED" } } } } } } } },
    },
  });

  const groups = new Map<string, { title: string; funds: typeof funds }>();
  for (const fund of funds) {
    const key = fund.category?.slug ?? "other";
    const title = fund.category ? pickLocale(fund.category, "name", locale) : "—";
    if (!groups.has(key)) groups.set(key, { title, funds: [] });
    groups.get(key)!.funds.push(fund);
  }

  return (
    <div>
      <p className="mb-6 max-w-3xl text-muted-ink">{t("fundsIntro")}</p>
      <div className="space-y-8">
        {[...groups.entries()].map(([key, group]) => (
          <section key={key} aria-labelledby={`group-${key}`}>
            <h2 id={`group-${key}`} className="mb-3 text-[13px] font-bold tracking-[.06em] text-muted-ink uppercase">
              {group.title}
            </h2>
            <ul className="grid gap-3 md:grid-cols-2">
              {group.funds.map((fund) => {
                const docs = fund.inventories.flatMap((i) => i.storageUnits).reduce((sum, u) => sum + u._count.documents, 0);
                return (
                  <li key={fund.id}>
                    <Link
                      href={`/catalog?view=funds&fund=${encodeURIComponent(fund.number)}`}
                      className="group flex h-full items-start gap-3 rounded-[14px] border border-border bg-surface p-4 hover:border-primary"
                    >
                      {fund.isPersonal ? (
                        <User aria-hidden className="mt-0.5 size-5 shrink-0 text-accent-2" />
                      ) : (
                        <FolderOpen aria-hidden className="mt-0.5 size-5 shrink-0 text-primary" />
                      )}
                      <span className="flex-1">
                        <span className="block font-mono text-xs text-muted-ink">{t("fundN", { number: fund.number })}</span>
                        <span className="block font-serif font-bold group-hover:text-primary">{pickLocale(fund, "title", locale)}</span>
                        <span className="mt-1 block text-sm text-muted-ink">
                          {fund.dateFrom && fund.dateTo ? `${t("fundYears", { from: fund.dateFrom, to: fund.dateTo })} · ` : ""}
                          {t("fundDocs", { count: docs })}
                          {fund.isPersonal ? ` · ${t("personalFund")}` : ""}
                        </span>
                      </span>
                      <ChevronRight aria-hidden className="mt-1 size-4 text-muted-ink" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

export async function FundTree({ locale, fundNumber }: { locale: Locale; fundNumber: string }) {
  const [t, tCommon] = await Promise.all([
    getTranslations({ locale, namespace: "Catalog" }),
    getTranslations({ locale, namespace: "Nav" }),
  ]);
  const fund = await db.fund.findFirst({
    where: { number: fundNumber, status: "PUBLISHED" },
    include: {
      inventories: {
        where: { status: "PUBLISHED" },
        orderBy: { number: "asc" },
        include: {
          storageUnits: {
            where: { status: "PUBLISHED" },
            include: {
              documents: {
                where: { status: "PUBLISHED" },
                select: { id: true, titleKz: true, titleRu: true, titleEn: true, cipher: true, yearFrom: true, accessStatus: true },
              },
            },
          },
        },
      },
    },
  });
  if (!fund) return <p className="text-muted-ink">—</p>;

  const fundTitle = pickLocale(fund, "title", locale);
  return (
    <div>
      <Breadcrumbs
        className="mb-4"
        items={[
          { label: tCommon("catalog"), href: "/catalog" },
          { label: t("allFunds"), href: "/catalog?view=funds" },
          { label: t("fundN", { number: fund.number }) },
        ]}
      />
      <h2 className="font-serif text-2xl font-bold">{fundTitle}</h2>
      <p className="mt-1 mb-6 max-w-3xl text-muted-ink">{pickLocale(fund, "description", locale)}</p>
      <div className="space-y-3">
        {fund.inventories.map((inventory, index) => (
          <details key={inventory.id} open={index === 0} className="rounded-[14px] border border-border bg-surface">
            <summary className="cursor-pointer list-none px-4 py-3 font-bold marker:hidden">
              <span className="font-mono text-sm text-muted-ink">{t("inventoryN", { number: inventory.number })}</span>{" "}
              · {pickLocale(inventory, "title", locale)}
            </summary>
            <ul className="divide-y divide-border border-t border-border">
              {[...inventory.storageUnits]
                .sort((a, b) => Number(a.number) - Number(b.number))
                .map((unit) => (
                  <li key={unit.id} className="px-4 py-3">
                    <p className="font-mono text-xs text-muted-ink">
                      {t("unitN", { number: unit.number })}
                      {unit.sheetsCount ? ` · ${t("sheets", { count: unit.sheetsCount })}` : ""}
                    </p>
                    <ul className="mt-1 space-y-1">
                      {unit.documents.map((doc) => (
                        <li key={doc.id} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <Link href={`/catalog/${doc.id}`} className="font-serif font-bold hover:text-primary hover:underline">
                            {pickLocale(doc, "title", locale)}
                          </Link>
                          {doc.yearFrom && <span className="text-sm text-muted-ink">{doc.yearFrom}</span>}
                          <AccessStamp status={doc.accessStatus} />
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
            </ul>
          </details>
        ))}
      </div>
    </div>
  );
}
