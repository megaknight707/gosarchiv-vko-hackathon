// POST /api/assistant/summary — «Кратко от ИИ» для карточки документа.
// Только опубликованные документы; лимит 20 запросов за 5 минут; ответ кэшируется в базе.
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { routing } from "@/i18n/routing";
import { getDocumentSummary } from "@/lib/ai/document-summary";
import { getPublishedDocument } from "@/lib/catalog/get-document";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { siteUrl } from "@/lib/site/config";

const bodySchema = z.object({ id: z.string().regex(/^[a-z0-9]{10,40}$/), locale: z.enum(routing.locales) });

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin || (origin !== request.nextUrl.origin && origin !== new URL(siteUrl).origin)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  if (!(await checkRateLimit("summary", 20, 300))) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const doc = await getPublishedDocument(parsed.data.id);
  if (!doc) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(await getDocumentSummary(doc, parsed.data.locale), { headers: { "Cache-Control": "no-store" } });
}
