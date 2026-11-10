"use client";

// Блок «Маршрут»: от моего местоположения (только по кнопке и с разрешения браузера)
// или от введённого адреса; способ передвижения; расстояние по прямой;
// кнопки «Открыть в 2GIS» и «Открыть в Google Maps».
import { LocateFixed, MapPin, Navigation } from "lucide-react";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { distanceKm, googleMapsRoute, twoGisRoute, type LatLng, type TravelMode } from "@/lib/geo/route-links";
import { cn } from "@/lib/utils";

export type RouteOrigin = { point: LatLng | null; label: string | null; kind: "geo" | "address" };

export function BranchRoute({
  target,
  origin,
  onOriginChange,
}: {
  target: LatLng;
  origin: RouteOrigin | null;
  onOriginChange: (origin: RouteOrigin | null) => void;
}) {
  const t = useTranslations("Branches");
  const locale = useLocale();
  const [mode, setMode] = useState<TravelMode>("driving");
  const [geoState, setGeoState] = useState<"idle" | "locating" | "denied">("idle");
  const [address, setAddress] = useState("");
  const [addressState, setAddressState] = useState<"idle" | "searching" | "notFound">("idle");

  function locate() {
    if (!("geolocation" in navigator)) {
      setGeoState("denied");
      return;
    }
    setGeoState("locating");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeoState("idle");
        onOriginChange({ point: { lat: position.coords.latitude, lng: position.coords.longitude }, label: null, kind: "geo" });
      },
      () => setGeoState("denied"),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  }

  async function findAddress(event: React.FormEvent) {
    event.preventDefault();
    const query = address.trim();
    if (query.length < 3) return;
    setAddressState("searching");
    try {
      const response = await fetch(`/api/geocode?locale=${locale}&q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = (await response.json()) as { lat: number; lng: number };
        onOriginChange({ point: { lat: data.lat, lng: data.lng }, label: query, kind: "address" });
        setAddressState("idle");
        return;
      }
    } catch {
      // Геокодер недоступен — маршрут всё равно можно построить по тексту адреса в Google Maps
    }
    onOriginChange({ point: null, label: query, kind: "address" });
    setAddressState("notFound");
  }

  const from = origin?.point ?? origin?.label ?? undefined;
  const km = origin?.point ? distanceKm(origin.point, target) : null;
  const button = "inline-flex h-10 items-center justify-center gap-2 rounded-[10px] px-4 text-sm font-bold";

  return (
    <section aria-labelledby="route-title" className="space-y-3">
      <h3 id="route-title" className="flex items-center gap-2 font-serif text-lg font-bold">
        <Navigation aria-hidden className="size-4 text-primary" />
        {t("route")}
      </h3>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={locate} disabled={geoState === "locating"} className={cn(button, "border border-border bg-surface hover:bg-chip")}>
          <LocateFixed aria-hidden className="size-4" />
          {geoState === "locating" ? t("locating") : t("myLocation")}
        </button>
        <label className="inline-flex items-center gap-2 text-sm">
          <span className="text-muted-ink">{t("mode")}:</span>
          <select value={mode} onChange={(e) => setMode(e.target.value as TravelMode)} className="h-10 rounded-md border border-border bg-surface px-2 font-bold">
            {(["driving", "walking", "transit"] as const).map((m) => (
              <option key={m} value={m}>
                {t(`modes.${m}`)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <form onSubmit={findAddress} className="space-y-1.5">
        {geoState === "denied" && <p className="text-sm text-lock">{t("geoDenied")}</p>}
        <label htmlFor="route-address" className="block text-sm text-muted-ink">
          {t("addressLabel")}
        </label>
        <div className="flex gap-2">
          <input
            id="route-address"
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              setAddressState("idle");
            }}
            maxLength={200}
            autoComplete="street-address"
            placeholder={t("addressPlaceholder")}
            className="h-10 min-w-0 flex-1 rounded-md border border-border bg-bg px-3"
          />
          <button type="submit" disabled={addressState === "searching"} className={cn(button, "border border-border bg-surface hover:bg-chip")}>
            {t("findAddress")}
          </button>
        </div>
        {addressState === "notFound" && <p className="text-sm text-muted-ink">{t("addressNotFound")}</p>}
      </form>

      {origin && (
        <p className="flex flex-wrap items-center gap-x-2 text-sm" aria-live="polite">
          <MapPin aria-hidden className="size-4 text-accent-2" />
          {origin.kind === "geo" ? t("fromMyLocation") : t("fromAddress", { address: origin.label ?? "" })}
          {km !== null && <b>{" · "}{t("distance", { km: km < 10 ? km.toFixed(1) : Math.round(km) })}</b>}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <a
          href={twoGisRoute(target, origin?.point ?? undefined)}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(button, "bg-primary text-primary-foreground hover:opacity-90")}
        >
          {t("open2gis")}
        </a>
        <a
          href={googleMapsRoute(target, from, mode)}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(button, "border border-border bg-surface hover:bg-chip")}
        >
          {t("openGoogle")}
        </a>
      </div>
    </section>
  );
}
