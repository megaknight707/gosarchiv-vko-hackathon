"use client";

// Раздел «Филиалы»: список с поиском и фильтром по типу + карта + карточка выбранного объекта
// с маршрутом. На телефоне — переключатель «Список / Карта».
// Выбранный филиал пишется в адрес (?b=ridder) — ссылкой можно поделиться.
import dynamic from "next/dynamic";
import { Building2, Clock, Mail, MapPin, Phone, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { BranchView } from "@/lib/site/branches";
import { cn } from "@/lib/utils";
import { BranchRoute, type RouteOrigin } from "./branch-route";

// Карта только в браузере: Leaflet не работает при серверном рендеринге
const BranchMap = dynamic(() => import("./branch-map"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-[inherit] bg-chip" />,
});

type TypeFilter = "ALL" | BranchView["type"];

export function BranchesExplorer({ branches, initialSlug }: { branches: BranchView[]; initialSlug?: string }) {
  const t = useTranslations("Branches");
  const tCommon = useTranslations("Common");
  const [query, setQuery] = useState("");
  const [type, setType] = useState<TypeFilter>("ALL");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(
    branches.find((b) => b.slug === initialSlug)?.slug ?? null,
  );
  const [mobileView, setMobileView] = useState<"list" | "map">("list");
  const [origin, setOrigin] = useState<RouteOrigin | null>(null);

  const types = useMemo(() => ["ALL", ...new Set(branches.map((b) => b.type))] as TypeFilter[], [branches]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/ё/g, "е");
    return branches.filter((b) => (type === "ALL" || b.type === type) && (!q || b.searchText.replace(/ё/g, "е").includes(q)));
  }, [branches, query, type]);
  const selected = branches.find((b) => b.slug === selectedSlug) ?? null;

  function select(slug: string) {
    setSelectedSlug(slug);
    const url = new URL(window.location.href);
    url.searchParams.set("b", slug);
    window.history.replaceState(null, "", url);
    if (window.matchMedia("(max-width: 1023px)").matches) {
      document.getElementById("branch-details")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  const unknown = <span className="text-muted-ink italic">{tCommon("toBeConfirmed")}</span>;

  return (
    <div>
      {/* Поиск и фильтр */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <span className="sr-only">{t("searchLabel")}</span>
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-ink" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="h-11 w-full rounded-[10px] border border-border bg-surface pr-3 pl-9"
          />
        </label>
        <div role="group" aria-label={t("typeFilter")} className="flex flex-wrap gap-1.5">
          {types.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={type === value}
              onClick={() => setType(value)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-bold",
                type === value ? "border-ink bg-ink text-bg" : "border-border bg-surface hover:bg-chip",
              )}
            >
              {t(`types.${value}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Переключатель на телефоне */}
      <div role="tablist" aria-label={t("mapLabel")} className="mb-3 inline-flex rounded-full border border-border bg-surface p-1 text-sm font-bold lg:hidden">
        {(["list", "map"] as const).map((view) => (
          <button
            key={view}
            role="tab"
            aria-selected={mobileView === view}
            onClick={() => setMobileView(view)}
            className={cn("rounded-full px-4 py-1.5", mobileView === view ? "bg-ink text-bg" : "text-muted-ink")}
          >
            {view === "list" ? t("viewList") : t("viewMap")}
          </button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        {/* Список */}
        <div className={cn(mobileView === "map" && "hidden lg:block")}>
          <p className="mb-2 text-sm text-muted-ink" role="status">
            {t("count", { count: filtered.length })}
          </p>
          {filtered.length === 0 ? (
            <p className="rounded-[12px] border border-dashed border-border p-4 text-muted-ink">{t("nothingFound")}</p>
          ) : (
            <ul className="space-y-2 lg:max-h-[560px] lg:overflow-y-auto lg:pr-1">
              {filtered.map((branch) => (
                <li key={branch.slug}>
                  <button
                    type="button"
                    onClick={() => select(branch.slug)}
                    aria-pressed={branch.slug === selectedSlug}
                    className={cn(
                      "w-full rounded-[12px] border p-3 text-left transition-colors",
                      branch.slug === selectedSlug ? "border-primary bg-accent-2-soft" : "border-border bg-surface hover:border-primary",
                    )}
                  >
                    <span className="flex items-start gap-2">
                      <Building2 aria-hidden className={cn("mt-0.5 size-4 shrink-0", branch.isMain ? "text-primary" : "text-accent-2")} />
                      <span>
                        <b className="block font-serif">{branch.name}</b>
                        <span className="text-sm text-muted-ink">
                          {branch.city}
                          {branch.workHours ? ` · ${branch.workHours}` : ""}
                        </span>
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Карта */}
        <div className={cn("h-[420px] overflow-hidden rounded-[16px] border border-border lg:h-[600px]", mobileView === "list" && "hidden lg:block")}>
          <BranchMap
            branches={filtered.map(({ slug, name, lat, lng, isMain }) => ({ slug, name, lat, lng, isMain }))}
            selectedSlug={selectedSlug}
            onSelect={select}
            user={origin?.point ?? null}
            label={t("mapLabel")}
            className="h-full w-full rounded-[16px]"
          />
        </div>
      </div>

      {/* Карточка выбранного объекта */}
      <section id="branch-details" aria-live="polite" className="mt-6 scroll-mt-4">
        {selected ? (
          <article className="grid gap-6 rounded-[18px] border border-border bg-surface p-5 sm:p-7 lg:grid-cols-[1.2fr_1fr]">
            <div>
              {selected.isMain && (
                <span className="mb-2 inline-block rounded-full bg-primary px-3 py-0.5 text-xs font-bold text-primary-foreground">{t("mainBadge")}</span>
              )}
              <h2 className="font-serif text-2xl font-bold">{selected.name}</h2>
              <dl className="mt-4 grid grid-cols-[minmax(0,9rem)_1fr] gap-x-4 gap-y-2.5 text-[15px]">
                <dt className="flex items-center gap-1.5 text-muted-ink"><MapPin aria-hidden className="size-4" />{t("address")}</dt>
                <dd>{selected.address ?? unknown}</dd>
                <dt className="flex items-center gap-1.5 text-muted-ink"><Phone aria-hidden className="size-4" />{t("phone")}</dt>
                <dd>{selected.phone ? <a href={`tel:${selected.phone.replace(/[^\d+]/g, "")}`} className="hover:text-primary hover:underline">{selected.phone}</a> : unknown}</dd>
                <dt className="flex items-center gap-1.5 text-muted-ink"><Mail aria-hidden className="size-4" />{t("email")}</dt>
                <dd>{selected.email ? <a href={`mailto:${selected.email}`} className="hover:text-primary hover:underline">{selected.email}</a> : unknown}</dd>
                <dt className="flex items-center gap-1.5 text-muted-ink"><Clock aria-hidden className="size-4" />{t("workHours")}</dt>
                <dd>{selected.workHours ?? unknown}</dd>
                {selected.readingRoomHours && (
                  <>
                    <dt className="text-muted-ink">{t("readingRoom")}</dt>
                    <dd>{selected.readingRoomHours}</dd>
                  </>
                )}
                {selected.servedArea && (
                  <>
                    <dt className="text-muted-ink">{t("servedArea")}</dt>
                    <dd>{selected.servedArea}</dd>
                  </>
                )}
                {selected.fundsInfo && (
                  <>
                    <dt className="text-muted-ink">{t("funds")}</dt>
                    <dd>{selected.fundsInfo}</dd>
                  </>
                )}
                <dt className="text-muted-ink">{t("coordinates")}</dt>
                <dd className="font-mono text-sm">
                  {selected.lat.toFixed(4)}, {selected.lng.toFixed(4)}
                  {selected.approximate && <span className="mt-1 block font-sans text-xs text-lock">⚠ {t("approximate")}</span>}
                </dd>
              </dl>
              {selected.description && (
                <p className="mt-4 border-t border-border pt-4 leading-relaxed text-muted-ink">{selected.description}</p>
              )}
            </div>
            <BranchRoute target={{ lat: selected.lat, lng: selected.lng }} origin={origin} onOriginChange={setOrigin} />
          </article>
        ) : (
          <p className="rounded-[14px] border border-dashed border-border p-5 text-center text-muted-ink">{t("selectHint")}</p>
        )}
      </section>
    </div>
  );
}
