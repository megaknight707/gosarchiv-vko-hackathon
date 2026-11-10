"use client";

// Карта архива и филиалов на OpenStreetMap (Leaflet).
// Этот модуль загружается только в браузере (dynamic + ssr:false): Leaflet обращается
// к window/document, которых нет при серверном рендеринге.
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import type { LatLng } from "@/lib/geo/route-links";

export type MapBranch = { slug: string; name: string; lat: number; lng: number; isMain: boolean };

/** Свой маркер-«печать» (без картинок Leaflet по умолчанию). Цвет главного здания — сургуч */
function markerIcon(kind: "main" | "branch" | "user", selected: boolean, count: number) {
  const size = selected ? 40 : 32;
  const color = kind === "main" ? "var(--accent)" : kind === "user" ? "#2563eb" : "var(--accent-2)";
  const badge = count > 1 ? `<span style="position:absolute;top:-6px;right:-6px;min-width:18px;height:18px;border-radius:9px;background:var(--surface);color:var(--text);border:1px solid var(--border);font:700 11px/16px sans-serif;text-align:center">${count}</span>` : "";
  const inner = kind === "user"
    ? `<span style="display:block;width:16px;height:16px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 0 0 2px ${color}"></span>`
    : `<span style="display:grid;place-items:center;width:${size}px;height:${size}px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${color};border:2px solid #fff;box-shadow:0 4px 10px rgba(0,0,0,.35)"><span style="transform:rotate(45deg);color:#fff;font:700 ${selected ? 13 : 11}px serif">ГА</span></span>`;
  return L.divIcon({
    className: "",
    html: `<span style="position:relative;display:block">${inner}${badge}</span>`,
    iconSize: kind === "user" ? [22, 22] : [size, size],
    iconAnchor: kind === "user" ? [11, 11] : [size / 2, size],
  });
}

/** Подстраивает вид карты: все объекты или выбранный */
function MapViewport({ branches, selected, user }: { branches: MapBranch[]; selected?: MapBranch; user?: LatLng | null }) {
  const map = useMap();
  // Карта может быть скрыта (вкладка «Список» на телефоне) — тогда её размер 0×0
  // и анимации Leaflet падают. Следим за размером и пересчитываем вид, когда карта появится.
  const [sizeVersion, setSizeVersion] = useState(0);
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
      setSizeVersion((v) => v + 1);
    });
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);

  // Зависимости — строки, а не массивы: иначе карта перецентровывалась бы при каждой отрисовке
  const boundsKey = branches.map((b) => `${b.lat},${b.lng}`).join(";");
  const selectedKey = selected ? `${selected.lat},${selected.lng}` : "";
  const userKey = user ? `${user.lat},${user.lng}` : "";
  useEffect(() => {
    const size = map.getSize();
    if (size.x === 0 || size.y === 0) return;
    if (selectedKey) {
      const [lat, lng] = selectedKey.split(",").map(Number);
      if (userKey) {
        const [ulat, ulng] = userKey.split(",").map(Number);
        map.flyToBounds(L.latLngBounds([[lat, lng], [ulat, ulng]]).pad(0.3), { duration: 0.8 });
      } else {
        map.flyTo([lat, lng], Math.max(map.getZoom(), 9), { duration: 0.8 });
      }
    } else if (boundsKey) {
      const points = boundsKey.split(";").map((p) => p.split(",").map(Number) as [number, number]);
      map.fitBounds(L.latLngBounds(points).pad(0.2));
    }
  }, [map, boundsKey, selectedKey, userKey, sizeVersion]);
  return null;
}

export default function BranchMap({
  branches,
  selectedSlug,
  onSelect,
  user,
  label,
  className,
}: {
  branches: MapBranch[];
  selectedSlug?: string | null;
  onSelect: (slug: string) => void;
  user?: LatLng | null;
  label: string;
  className?: string;
}) {
  // Несколько объектов в одной точке (здания в Усть-Каменогорске с приблизительными
  // координатами) показываем одним маркером со счётчиком; клик перебирает их по очереди
  const groups = useMemo(() => {
    const map = new Map<string, MapBranch[]>();
    for (const b of branches) {
      const key = `${b.lat.toFixed(4)},${b.lng.toFixed(4)}`;
      map.set(key, [...(map.get(key) ?? []), b]);
    }
    return [...map.values()];
  }, [branches]);

  const selected = branches.find((b) => b.slug === selectedSlug);

  return (
    <div role="region" aria-label={label} className={className}>
      <MapContainer center={[49.5, 83.5]} zoom={6} scrollWheelZoom={false} className="h-full w-full rounded-[inherit]" attributionControl>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {groups.map((group) => {
          const isSelected = group.some((b) => b.slug === selectedSlug);
          const first = group[0];
          return (
            <Marker
              key={first.slug}
              position={[first.lat, first.lng]}
              title={group.map((b) => b.name).join(" · ")}
              alt={group.map((b) => b.name).join(" · ")}
              icon={markerIcon(group.some((b) => b.isMain) ? "main" : "branch", isSelected, group.length)}
              eventHandlers={{
                click: () => {
                  const index = group.findIndex((b) => b.slug === selectedSlug);
                  onSelect(group[(index + 1) % group.length].slug);
                },
              }}
            />
          );
        })}
        {user && <Marker position={[user.lat, user.lng]} icon={markerIcon("user", false, 1)} interactive={false} />}
        <MapViewport branches={branches} selected={selected} user={user} />
      </MapContainer>
    </div>
  );
}
