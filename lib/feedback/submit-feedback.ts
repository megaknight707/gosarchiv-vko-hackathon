"use server";

// Server Action формы «Отзывы и предложения» — единственной публичной формы сайта.
// Защита: zod-проверка всех полей, скрытое поле-ловушка для ботов (honeypot),
// лимит 5 отправок за 10 минут с одного (обезличенного) адреса.
// CSRF: Server Actions Next.js принимают запросы только со своего сайта (проверка Origin).
import { z } from "zod";
import { routing } from "@/i18n/routing";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/security/rate-limit";

export type FeedbackState =
  | { status: "idle" }
  | { status: "success" }
  | {
      status: "error";
      error: "validation" | "rateLimited" | "server";
      fields?: ("message" | "email" | "consent")[];
      /** Введённые значения — чтобы при ошибке человек не потерял написанный текст */
      values?: { kind: string; message: string; name: string; email: string };
    };

function echo(raw: Record<string, FormDataEntryValue>) {
  const s = (v: FormDataEntryValue | undefined, max: number) => (typeof v === "string" ? v.slice(0, max) : "");
  return { kind: s(raw.kind, 20), message: s(raw.message, 2000), name: s(raw.name, 80), email: s(raw.email, 120) };
}

const feedbackSchema = z.object({
  kind: z.enum(["REVIEW", "SUGGESTION", "WISH"]),
  message: z.string().trim().min(10).max(2000),
  name: z.string().trim().max(80).optional().transform((v) => v || undefined),
  email: z.union([z.literal(""), z.email().max(120)]).optional().transform((v) => v || undefined),
  consent: z.literal("on"),
  locale: z.enum(routing.locales),
  // Поле-ловушка: человек его не видит и не заполняет, бот — заполняет
  website: z.string().max(0).optional(),
});

export async function submitFeedback(_prev: FeedbackState, formData: FormData): Promise<FeedbackState> {
  const raw = Object.fromEntries(formData);
  // Бот заполнил ловушку — делаем вид, что всё хорошо, но ничего не сохраняем
  if (typeof raw.website === "string" && raw.website.length > 0) return { status: "success" };

  const parsed = feedbackSchema.safeParse(raw);
  if (!parsed.success) {
    const fields = [...new Set(parsed.error.issues.map((issue) => issue.path[0]))].filter(
      (f): f is "message" | "email" | "consent" => f === "message" || f === "email" || f === "consent",
    );
    return { status: "error", error: "validation", fields, values: echo(raw) };
  }

  try {
    if (!(await checkRateLimit("feedback", 5, 600))) return { status: "error", error: "rateLimited", values: echo(raw) };
    const { kind, message, name, email, locale } = parsed.data;
    await db.feedback.create({ data: { kind, message, name, email, locale } });
    return { status: "success" };
  } catch (error) {
    console.error("Не удалось сохранить отзыв:", error);
    return { status: "error", error: "server", values: echo(raw) };
  }
}
