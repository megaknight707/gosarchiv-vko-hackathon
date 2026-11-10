"use client";

// Прейскурант с поиском: разделы раскрываются, при поиске видны только подходящие строки.
// Поиск — по названию и индексу («копия», «8.3»). Ничего не заказывает и не считает.
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import type { PriceSection } from "@/lib/services/price-list";

export function PriceListTable({ sections }: { sections: PriceSection[] }) {
  const t = useTranslations("Services");
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const filtered = useMemo(
    () =>
      sections
        .map((s) => {
          if (!q) return s;
          // Совпал заголовок группы («Изготовление копий…») — показываем и все цены внутри неё
          const hits = s.items.filter((i) => i.name.toLowerCase().includes(q) || i.index.startsWith(q));
          const groups = hits.filter((i) => !i.price).map((i) => `${i.index}.`);
          return { ...s, items: s.items.filter((i) => hits.includes(i) || groups.some((g) => i.index.startsWith(g))) };
        })
        .filter((s) => s.items.length > 0),
    [sections, q],
  );
  const count = filtered.reduce((n, s) => n + s.items.length, 0);

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="price-search" className="mb-1 block text-sm font-bold">
          {t("priceSearch")}
        </label>
        <div className="relative max-w-md">
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-ink" />
          <input
            id="price-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("pricePlaceholder")}
            className="w-full rounded-[10px] border border-border bg-surface py-2.5 pr-3 pl-9"
          />
        </div>
        <p aria-live="polite" className="mt-1 text-sm text-muted-ink">
          {q && (count ? t("priceFound", { count }) : t("priceNothing"))}
        </p>
      </div>

      {filtered.map((section) => (
        <details key={section.number} open={Boolean(q)} className="group rounded-[14px] border border-border bg-surface">
          <summary className="cursor-pointer list-none px-4 py-3 font-serif font-bold marker:hidden">
            <span className="mr-2 font-mono text-sm text-muted-ink">{section.number}.</span>
            {section.title}
            <span className="ml-2 text-sm font-normal text-muted-ink">({section.items.filter((i) => i.price).length})</span>
          </summary>
          <div className="overflow-x-auto border-t border-border">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-chip/60 text-left">
                <tr>
                  <th scope="col" className="w-24 px-3 py-2">{t("colIndex")}</th>
                  <th scope="col" className="px-3 py-2">{t("colName")}</th>
                  <th scope="col" className="w-40 px-3 py-2">{t("colUnit")}</th>
                  <th scope="col" className="w-28 px-3 py-2 text-right">{t("colPrice")}</th>
                </tr>
              </thead>
              <tbody>
                {section.items.map((item, i) => (
                  <tr key={`${item.index}-${i}`} className={item.price ? "border-t border-border" : "border-t border-border bg-chip/30"}>
                    <td className="px-3 py-1.5 font-mono text-xs whitespace-nowrap text-muted-ink">{item.index}</td>
                    <td className={item.price ? "px-3 py-1.5" : "px-3 py-1.5 font-bold"}>{item.name}</td>
                    <td className="px-3 py-1.5 text-muted-ink">{item.unit}</td>
                    <td className="px-3 py-1.5 text-right font-mono whitespace-pre-line">{/* «67 620,0 2704,8» — цена за выставку и за экспонат: выводим двумя строками */}
                      {item.price.replace(/^(\S+(?: \d{3})*,\d) (\S.*)$/, "$1\n$2")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      ))}
    </div>
  );
}
