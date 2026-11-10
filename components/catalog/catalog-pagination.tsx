// Постраничная навигация: ‹ 1 2 3 … 12 ›. Обычные ссылки — работают без JavaScript.
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { type CatalogFilters, serializeCatalogFilters } from "@/lib/search/catalog-filters";
import { cn } from "@/lib/utils";

/** Номера страниц для показа: первая, последняя, текущая ±1, между ними «…» */
function pageNumbers(page: number, pageCount: number): (number | "gap")[] {
  const wanted = new Set([1, pageCount, page - 1, page, page + 1].filter((n) => n >= 1 && n <= pageCount));
  const sorted = [...wanted].sort((a, b) => a - b);
  const result: (number | "gap")[] = [];
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1) result.push("gap");
    result.push(n);
  });
  return result;
}

export async function CatalogPagination({
  locale,
  filters,
  page,
  pageCount,
  buildHref,
}: {
  locale: Locale;
  filters?: CatalogFilters;
  page: number;
  pageCount: number;
  /** Своя ссылка на страницу (например, для перечня фондов); по умолчанию — каталог */
  buildHref?: (page: number) => string;
}) {
  if (pageCount <= 1) return null;
  const t = await getTranslations({ locale, namespace: "Catalog" });
  const href = buildHref ?? ((n: number) => `/catalog${serializeCatalogFilters({ ...(filters ?? {}), page: n } as CatalogFilters)}`);
  const cell = "grid h-10 min-w-10 place-items-center rounded-[10px] border border-border bg-surface px-3 font-bold";

  return (
    <nav aria-label={t("pagination")} className="mt-8 flex justify-center">
      <ul className="flex flex-wrap items-center gap-2">
        <li>
          {page > 1 ? (
            <Link href={href(page - 1)} aria-label={t("prev")} className={cn(cell, "hover:bg-chip")}>
              <ChevronLeft aria-hidden className="size-4" />
            </Link>
          ) : (
            <span aria-hidden className={cn(cell, "opacity-40")}>
              <ChevronLeft className="size-4" />
            </span>
          )}
        </li>
        {pageNumbers(page, pageCount).map((n, i) =>
          n === "gap" ? (
            <li key={`gap-${i}`} aria-hidden className="px-1 text-muted-ink">
              …
            </li>
          ) : (
            <li key={n}>
              <Link
                href={href(n)}
                aria-label={t("pageN", { page: n })}
                aria-current={n === page ? "page" : undefined}
                className={cn(cell, n === page ? "border-ink bg-ink text-bg" : "hover:bg-chip")}
              >
                {n}
              </Link>
            </li>
          ),
        )}
        <li>
          {page < pageCount ? (
            <Link href={href(page + 1)} aria-label={t("next")} className={cn(cell, "hover:bg-chip")}>
              <ChevronRight aria-hidden className="size-4" />
            </Link>
          ) : (
            <span aria-hidden className={cn(cell, "opacity-40")}>
              <ChevronRight className="size-4" />
            </span>
          )}
        </li>
      </ul>
    </nav>
  );
}
