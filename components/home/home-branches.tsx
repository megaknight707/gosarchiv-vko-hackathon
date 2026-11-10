"use client";

// Блок «Наши филиалы» на главной: мини-карта + список + кнопки маршрута.
import dynamic from "next/dynamic";
import { Building2 } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { googleMapsRoute, twoGisRoute } from "@/lib/geo/route-links";
import type { BranchView } from "@/lib/site/branches";
import { cn } from "@/lib/utils";

const BranchMap = dynamic(() => import("@/components/branches/branch-map"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-chip" />,
});

export function HomeBranches({ branches }: { branches: BranchView[] }) {
  const t = useTranslations("Branches");
  const tHome = useTranslations("Home");
  const [selectedSlug, setSelectedSlug] = useState(branches.find((b) => b.isMain)?.slug ?? branches[0]?.slug);

  return (
    <div className="grid overflow-hidden rounded-[16px] border border-border bg-surface sm:grid-cols-[1.2fr_1fr]">
      <div className="h-64 sm:h-auto sm:min-h-[340px]">
        <BranchMap
          branches={branches.map(({ slug, name, lat, lng, isMain }) => ({ slug, name, lat, lng, isMain }))}
          selectedSlug={selectedSlug}
          onSelect={setSelectedSlug}
          label={t("mapLabel")}
          className="h-full w-full"
        />
      </div>
      <div className="flex flex-col p-3">
        <ul className="space-y-1.5">
          {branches.map((branch) => {
            const selected = branch.slug === selectedSlug;
            return (
              <li key={branch.slug}>
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setSelectedSlug(branch.slug)}
                  className={cn("w-full rounded-[10px] p-2.5 text-left", selected ? "bg-accent-2-soft" : "hover:bg-chip")}
                >
                  <span className="flex items-start gap-2">
                    <Building2 aria-hidden className={cn("mt-0.5 size-4 shrink-0", branch.isMain ? "text-primary" : "text-accent-2")} />
                    <span>
                      <b className="block text-sm">{branch.name}</b>
                      <span className="text-xs text-muted-ink">
                        {branch.city}
                        {branch.workHours ? ` · ${branch.workHours}` : ""}
                      </span>
                    </span>
                  </span>
                  {selected && (
                    <span className="mt-2 flex flex-wrap gap-1.5 pl-6">
                      <a
                        href={twoGisRoute({ lat: branch.lat, lng: branch.lng })}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="rounded-md border border-border bg-surface px-2 py-1 text-xs font-bold hover:border-primary"
                      >
                        2GIS
                      </a>
                      <a
                        href={googleMapsRoute({ lat: branch.lat, lng: branch.lng })}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="rounded-md border border-border bg-surface px-2 py-1 text-xs font-bold hover:border-primary"
                      >
                        Google Maps
                      </a>
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
        <Link href={selectedSlug ? `/branches?b=${selectedSlug}` : "/branches"} className="mt-auto pt-3 text-sm font-bold text-primary hover:underline">
          {tHome("allBranches")} →
        </Link>
      </div>
    </div>
  );
}
