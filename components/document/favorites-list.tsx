"use client";

// Список избранного: id берутся из localStorage, данные карточек — из /api/catalog/cards.
import { Star } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { DocumentCard, type DocumentCardData } from "@/components/archive/document-card";
import { EmptyState } from "@/components/archive/empty-state";
import { useFavorites } from "@/lib/favorites/favorites-store";

type LoadState = { key: string; items: DocumentCardData[] } | null;

export function FavoritesList({ showDemo }: { showDemo: boolean }) {
  const t = useTranslations("Favorites");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const favorites = useFavorites();
  const key = `${locale}:${favorites.ids.join(",")}`;
  const [state, setState] = useState<LoadState>(null);

  useEffect(() => {
    if (favorites.ids.length === 0) return;
    const controller = new AbortController();
    fetch(`/api/catalog/cards?locale=${locale}&ids=${favorites.ids.join(",")}`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : { items: [] }))
      .then((data: { items: DocumentCardData[] }) => setState({ key, items: data.items }))
      .catch(() => {});
    return () => controller.abort();
  }, [favorites.ids, locale, key]);

  if (favorites.ids.length === 0) {
    return <EmptyState Icon={Star} title={t("empty")} text={t("emptyText")} action={{ href: "/catalog", label: tCommon("goToCatalog") }} />;
  }
  if (!state || state.key !== key) {
    return (
      <p role="status" className="py-10 text-center text-muted-ink">
        {t("loading")}
      </p>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p role="status" className="font-bold">
          {t("count", { count: state.items.length })}
        </p>
        <button type="button" onClick={favorites.clear} className="rounded-[10px] border border-border bg-surface px-4 py-2 font-bold hover:bg-chip">
          {t("clear")}
        </button>
      </div>
      {state.items.length < favorites.ids.length && <p className="mb-4 text-sm text-muted-ink">{t("unavailable")}</p>}
      <ul className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        {state.items.map((item) => (
          <li key={item.id} className="flex">
            <DocumentCard className="w-full" doc={item} showDemo={showDemo} />
          </li>
        ))}
      </ul>
    </div>
  );
}
