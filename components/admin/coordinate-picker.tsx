"use client";

// Выбор точки филиала на карте: щелчок по карте ставит маркер и заполняет широту и долготу.
// Загружается только в браузере (dynamic + ssr:false) — Leaflet работает с window.
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";

const VKO_CENTER: [number, number] = [49.95, 82.62]; // Усть-Каменогорск

const icon = L.divIcon({
  className: "",
  html: `<span style="display:block;width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:var(--accent);border:2px solid #fff;box-shadow:0 3px 8px rgba(0,0,0,.35)"></span>`,
  iconSize: [26, 26],
  iconAnchor: [13, 26],
});

function ClickHandler({ onPick, readOnly }: { onPick: (p: { lat: number; lng: number }) => void; readOnly?: boolean }) {
  useMapEvents({
    click(event) {
      if (!readOnly) onPick(event.latlng);
    },
  });
  return null;
}

export function CoordinatePicker({
  point,
  onPick,
  readOnly,
}: {
  point: { lat: number; lng: number } | null;
  onPick: (p: { lat: number; lng: number }) => void;
  readOnly?: boolean;
}) {
  return (
    <MapContainer center={point ?? VKO_CENTER} zoom={point ? 13 : 7} className="size-full" scrollWheelZoom>
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <ClickHandler onPick={onPick} readOnly={readOnly} />
      {point && (
        <Marker
          position={point}
          icon={icon}
          draggable={!readOnly}
          eventHandlers={{ dragend: (event) => onPick((event.target as L.Marker).getLatLng()) }}
        />
      )}
    </MapContainer>
  );
}
