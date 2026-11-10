"use client";

// Переход каталога к новым фильтрам: меняем адрес (?type=...&from=...) без прокрутки наверх.
// Сервер перерисовывает результаты по новому адресу; пока идёт загрузка — isPending = true.
import { useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { type CatalogFilters, serializeCatalogFilters } from "@/lib/search/catalog-filters";

export function useCatalogNavigation(current: CatalogFilters) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function apply(changes: Partial<CatalogFilters>) {
    // Любое изменение фильтров возвращает на первую страницу
    const next = { ...current, ...changes, page: undefined };
    startTransition(() => {
      router.replace(`/catalog${serializeCatalogFilters(next)}`, { scroll: false });
    });
  }

  return { apply, isPending };
}
