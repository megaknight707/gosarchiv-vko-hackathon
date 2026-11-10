"use server";

// Кнопка «Рекомендации ИИ» на странице аналитики.
import { z } from "zod";
import { locales } from "@/i18n/routing";
import { requireAdminAction } from "@/lib/auth/require-role";
import { getRecommendations, type RecommendationsResult } from "./ai-recommendations";
import { loadAnalytics } from "./analytics";
import { writeAuditLog } from "./audit-log";

export type RecommendationsState = { result?: RecommendationsResult; error?: boolean };

export async function recommendationsAction(prev: RecommendationsState, formData: FormData): Promise<RecommendationsState> {
  try {
    const user = await requireAdminAction("analytics");
    const { locale, days, refresh } = z
      .object({ locale: z.enum(locales), days: z.coerce.number().pipe(z.union([z.literal(7), z.literal(30), z.literal(90)])), refresh: z.string().optional() })
      .parse({ locale: formData.get("locale"), days: formData.get("days"), refresh: formData.get("refresh") ?? undefined });
    const result = await getRecommendations(await loadAnalytics(days), locale, refresh === "1");
    await writeAuditLog({ userId: user.id, action: "ai_recommendations", details: { days, mode: result.mode } });
    return { result };
  } catch {
    return { error: true };
  }
}
