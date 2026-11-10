"use client";

// Панель фильтров каталога с фасетами («Фото 34»). Каждое изменение сразу меняет адрес
// страницы — результаты пересчитываются на сервере, а ссылкой можно поделиться.
import { useTranslations } from "next-intl";
import type { CatalogFacets, FacetValue } from "@/lib/search/search-catalog";
import { type CatalogFilters, DOC_TYPES, hasActiveFilters } from "@/lib/search/catalog-filters";
import { cn } from "@/lib/utils";
import { PeriodRange } from "./period-range";
import { useCatalogNavigation } from "./use-catalog-navigation";

type ListKey = "type" | "place" | "branch" | "topic" | "access";

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-b border-border py-4 first:pt-0 last:border-0">
      <legend className="mb-2 text-[13px] font-bold tracking-[.06em] text-muted-ink uppercase">{title}</legend>
      {children}
    </fieldset>
  );
}

function FilterCheckbox({
  id,
  label,
  count,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  count: number;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-2.5 rounded-md py-1 text-[15px] hover:text-primary">
      <input id={id} type="checkbox" checked={checked} onChange={onChange} className="size-4 shrink-0 accent-[var(--accent)]" />
      <span className="flex-1">{label}</span>
      <span className="text-xs text-muted-ink tabular-nums">{count}</span>
    </label>
  );
}

function FacetOptions({
  name,
  values,
  selected,
  idPrefix,
  onToggle,
}: {
  name: ListKey;
  values: FacetValue[];
  selected: string[];
  idPrefix: string;
  onToggle: (value: string) => void;
}) {
  // Выбранные значения показываем, даже если по ним сейчас 0 документов
  const missing = selected.filter((v) => !values.some((f) => f.value === v)).map((v) => ({ value: v, label: v, count: 0 }));
  const all = [...values, ...missing];
  if (all.length === 0) return <p className="text-sm text-muted-ink">—</p>;
  return (
    <ul className="space-y-1">
      {all.map((option) => (
        <li key={option.value}>
          <FilterCheckbox
            id={`${idPrefix}-${name}-${option.value}`}
            label={option.label}
            count={option.count}
            checked={selected.includes(option.value)}
            onChange={() => onToggle(option.value)}
          />
        </li>
      ))}
    </ul>
  );
}

export function CatalogFiltersPanel({
  filters,
  facets,
  className,
  idPrefix = "f",
}: {
  filters: CatalogFilters;
  facets: CatalogFacets;
  className?: string;
  /** Префикс id — панель может быть на странице дважды (десктоп и мобильная) */
  idPrefix?: string;
}) {
  const t = useTranslations("Catalog");
  const tArchive = useTranslations("Archive");
  const { apply, isPending } = useCatalogNavigation(filters);

  function toggle(name: ListKey, value: string) {
    const list = filters[name] as string[];
    apply({ [name]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] });
  }

  const typeValues: FacetValue[] = DOC_TYPES.map((type) => ({
    value: type,
    label: tArchive(`docType.${type}`),
    count: facets.type.find((f) => f.value === type)?.count ?? 0,
  })).filter((f) => f.count > 0 || (filters.type as string[]).includes(f.value));

  const accessValues: FacetValue[] = facets.access.map((f) => ({
    ...f,
    label: tArchive(`access.${f.value as "OPEN" | "DESCRIPTION_ONLY" | "RESTRICTED"}`),
  }));

  const groups: { key: ListKey; title: string; values: FacetValue[] }[] = [
    { key: "place", title: t("group.place"), values: facets.place },
    { key: "access", title: t("group.access"), values: accessValues },
    { key: "topic", title: t("group.topic"), values: facets.topic },
    { key: "branch", title: t("group.branch"), values: facets.branch },
  ];

  return (
    <div className={cn("transition-opacity", isPending && "opacity-60", className)} aria-busy={isPending}>
      <FilterGroup title={t("group.type")}>
        <FacetOptions name="type" values={typeValues} selected={filters.type} idPrefix={idPrefix} onToggle={(v) => toggle("type", v)} />
      </FilterGroup>
      <FilterGroup title={t("group.period")}>
        <PeriodRange key={`${filters.from}-${filters.to}`} from={filters.from} to={filters.to} onCommit={(from, to) => apply({ from, to })} />
      </FilterGroup>
      <FilterGroup title={t("group.digital")}>
        <FilterCheckbox
          id={`${idPrefix}-digital`}
          label={t("digitalOnly")}
          count={facets.digital}
          checked={Boolean(filters.digital)}
          onChange={() => apply({ digital: filters.digital ? undefined : "1" })}
        />
      </FilterGroup>
      {groups.map((group) => (
        <FilterGroup key={group.key} title={group.title}>
          <FacetOptions
            name={group.key}
            values={group.values}
            selected={filters[group.key] as string[]}
            idPrefix={idPrefix}
            onToggle={(v) => toggle(group.key, v)}
          />
        </FilterGroup>
      ))}
      {hasActiveFilters(filters) && (
        <button
          type="button"
          onClick={() =>
            apply({
              q: undefined, type: [], place: [], topic: [], branch: [], access: [], from: undefined, to: undefined,
              author: undefined, fund: undefined, inv: undefined, unit: undefined, digital: undefined, p: undefined,
            })
          }
          className="mt-4 w-full rounded-[10px] border border-border bg-surface py-2.5 font-bold hover:bg-chip"
        >
          {t("reset")}
        </button>
      )}
    </div>
  );
}
