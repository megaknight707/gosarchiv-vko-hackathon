// GET /api/geocode?q=адрес&locale=ru — координаты введённого адреса (для расстояния до филиала).
// Запрос идёт через наш сервер к Nominatim (OpenStreetMap): так соблюдаются правила сервиса
// (свой User-Agent, ограничение частоты) и не раскрывается IP посетителя внешнему сервису.
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { routing } from "@/i18n/routing";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { siteUrl } from "@/lib/site/config";

const querySchema = z.object({
  q: z.string().trim().min(3).max(200),
  locale: z.enum(routing.locales).default("ru"),
});

const LANG = { kz: "kk,ru", ru: "ru", en: "en" } as const;

export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ error: "invalid_query" }, { status: 400 });

  if (!(await checkRateLimit("geocode", 10, 60))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.search = new URLSearchParams({ q: parsed.data.q, format: "jsonv2", limit: "1", countrycodes: "kz" }).toString();

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": `GosarchivVKO-Hackathon/1.0 (+${siteUrl})`,
        "Accept-Language": LANG[parsed.data.locale],
      },
      signal: AbortSignal.timeout(6000),
      next: { revalidate: 86400 },
    });
    if (!response.ok) return NextResponse.json({ error: "geocoder_unavailable" }, { status: 502 });
    const results = (await response.json()) as { lat: string; lon: string; display_name: string }[];
    if (!results[0]) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({
      lat: Number(results[0].lat),
      lng: Number(results[0].lon),
      label: results[0].display_name,
    });
  } catch {
    return NextResponse.json({ error: "geocoder_unavailable" }, { status: 502 });
  }
}
