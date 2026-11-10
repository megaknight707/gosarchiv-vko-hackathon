"use server";

// Отзывы и предложения посетителей: отметить «просмотрено», опубликовать на сайте (по желанию).
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminAction } from "@/lib/auth/require-role";
import { db } from "@/lib/db";
import { writeAuditLog } from "./audit-log";

const schema = z.object({
  id: z.string().regex(/^[a-z0-9]{8,40}$/i),
  field: z.enum(["isReviewed", "isPublished"]),
  value: z.enum(["true", "false"]),
});

export async function toggleFeedbackAction(formData: FormData) {
  const user = await requireAdminAction("feedback", "edit");
  const parsed = schema.parse({ id: formData.get("id"), field: formData.get("field"), value: formData.get("value") });
  const value = parsed.value === "true";
  // Опубликованный отзыв считается просмотренным
  const data = parsed.field === "isPublished" && value ? { isPublished: true, isReviewed: true } : { [parsed.field]: value };
  await db.feedback.update({ where: { id: parsed.id }, data });
  await writeAuditLog({ userId: user.id, action: "feedback_update", entityType: "feedback", entityId: parsed.id, details: data });
  revalidatePath("/[locale]/admin/feedback", "page");
  if (parsed.field === "isPublished") revalidatePath("/[locale]/feedback", "page");
}
