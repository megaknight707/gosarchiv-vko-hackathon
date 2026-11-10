// Маршруты и расстояния для карты филиалов.

export type LatLng = { lat: number; lng: number };
export type TravelMode = "walking" | "driving" | "transit";

/** Расстояние по прямой между двумя точками (формула гаверсинуса), км */
export function distanceKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Ссылка на маршрут в Google Maps.
 * Начало — координаты, адрес текстом или пусто (тогда Google спросит/возьмёт местоположение).
 */
export function googleMapsRoute(to: LatLng, from?: LatLng | string, mode: TravelMode = "driving"): string {
  const params = new URLSearchParams({ api: "1", destination: `${to.lat},${to.lng}`, travelmode: mode });
  if (from) params.set("origin", typeof from === "string" ? from : `${from.lat},${from.lng}`);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/** Ссылка на маршрут в 2GIS (координаты в 2GIS пишутся «долгота,широта») */
export function twoGisRoute(to: LatLng, from?: LatLng): string {
  const target = `${to.lng},${to.lat}`;
  const start = from ? `${from.lng},${from.lat}` : "";
  return `https://2gis.kz/directions/points/${encodeURIComponent(`${start}|${target}`)}`;
}
