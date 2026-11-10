// Счётчик просмотров разделов: +1 к записи (раздел, язык, день). Без IP и персональных данных.
import { z } from "zod";
import { locales } from "@/i18n/routing";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { SITE_SECTIONS } from "@/lib/admin/analytics-sections";

const bodySchema = z.object({
  section: z.enum(SITE_SECTIONS),
  locale: z.enum(locales),
});

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.headers.get("host")) {
    return new Response(null, { status: 403 });
  }
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return new Response(null, { status: 204 });
  if (!(await checkRateLimit("pageview", 120, 300))) return new Response(null, { status: 204 });

  const today = new Date();
  const day = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  await db.pageView
    .upsert({
      where: { path_locale_day: { path: parsed.data.section, locale: parsed.data.locale, day } },
      create: { path: parsed.data.section, locale: parsed.data.locale, day, count: 1 },
      update: { count: { increment: 1 } },
    })
    .catch(() => {});
  return new Response(null, { status: 204 });
}
