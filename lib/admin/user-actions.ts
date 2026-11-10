"use server";

// Управление сотрудниками (ТЗ §6.2, §6.7): создание, роль и филиал, блокировка, сброс пароля.
// Пароль генерируется сервером и показывается один раз — в базе хранится только bcrypt-хэш.
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { locales, type Locale } from "@/i18n/routing";
import { canManageRole } from "@/lib/auth/permissions";
import { requireAdminAction } from "@/lib/auth/require-role";
import { db } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import { writeAuditLog } from "./audit-log";

const ROLES = ["SUPER_ADMIN", "SITE_ADMIN", "EDITOR", "ARCHIVIST", "BRANCH_ADMIN", "MODERATOR", "ANALYST"] as const;

export type UserFormState = {
  errors?: Partial<Record<"email" | "name" | "role" | "branchId", "required" | "email" | "unique" | "branch" | "forbidden">>;
  formError?: "forbidden" | "self";
  /** Временный пароль — показывается один раз */
  password?: string;
  saved?: boolean;
  version?: number;
};

const userSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  name: z.string().trim().min(1).max(200),
  role: z.enum(ROLES),
  branchId: z.string().trim().max(40),
});

function generatePassword() {
  // 14 символов из безопасного алфавита (без похожих 0/O, l/1)
  const alphabet = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(randomBytes(14), (byte) => alphabet[byte % alphabet.length]).join("");
}

function validate(formData: FormData) {
  const parsed = userSchema.safeParse({
    email: formData.get("email"),
    name: formData.get("name"),
    role: formData.get("role"),
    branchId: formData.get("branchId") ?? "",
  });
  if (!parsed.success) {
    const errors: UserFormState["errors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as keyof NonNullable<UserFormState["errors"]>;
      errors[field] = field === "email" ? "email" : "required";
    }
    return { errors };
  }
  // Администратору филиала обязательно указать филиал
  if (parsed.data.role === "BRANCH_ADMIN" && !parsed.data.branchId) return { errors: { branchId: "branch" as const } };
  return { data: { ...parsed.data, branchId: parsed.data.branchId || null } };
}

export async function createUserAction(locale: Locale, prev: UserFormState, formData: FormData): Promise<UserFormState> {
  const version = (prev.version ?? 0) + 1;
  const actor = await requireAdminAction("users", "create");
  const result = validate(formData);
  if (result.errors) return { errors: result.errors, version };
  const data = result.data!;
  if (!canManageRole(actor, data.role)) return { errors: { role: "forbidden" }, version };

  const password = generatePassword();
  try {
    const user = await db.user.create({ data: { ...data, passwordHash: await bcrypt.hash(password, 12) } });
    await writeAuditLog({ userId: actor.id, action: "user_create", entityType: "users", entityId: user.id, details: { email: user.email, role: user.role } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { errors: { email: "unique" }, version };
    throw error;
  }
  revalidatePath(`/${locales.includes(locale) ? locale : "ru"}/admin/users`);
  return { password, saved: true, version };
}

export async function updateUserAction(userId: string, prev: UserFormState, formData: FormData): Promise<UserFormState> {
  const version = (prev.version ?? 0) + 1;
  const actor = await requireAdminAction("users", "edit");
  const target = await db.user.findUnique({ where: { id: z.string().max(40).parse(userId) } });
  if (!target || !canManageRole(actor, target.role)) return { formError: "forbidden", version };
  const result = validate(formData);
  if (result.errors) return { errors: result.errors, version };
  const data = result.data!;
  if (!canManageRole(actor, data.role)) return { errors: { role: "forbidden" }, version };
  const isActive = formData.get("isActive") === "on";
  // Нельзя заблокировать себя или лишить себя роли главного администратора
  if (target.id === actor.id && (!isActive || data.role !== target.role)) return { formError: "self", version };

  try {
    await db.user.update({ where: { id: target.id }, data: { ...data, isActive, ...(isActive && !target.isActive ? { failedLoginCount: 0, lockedUntil: null } : {}) } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { errors: { email: "unique" }, version };
    throw error;
  }
  const changes: Record<string, [unknown, unknown]> = {};
  for (const key of ["email", "name", "role", "branchId", "isActive"] as const) {
    const next = key === "isActive" ? isActive : data[key];
    if (target[key] !== next) changes[key] = [target[key], next];
  }
  await writeAuditLog({ userId: actor.id, action: "user_update", entityType: "users", entityId: target.id, details: { email: target.email, changes } });
  revalidatePath("/[locale]/admin/users", "page");
  return { saved: true, version };
}

export async function resetPasswordAction(userId: string, prev: UserFormState): Promise<UserFormState> {
  const version = (prev.version ?? 0) + 1;
  const actor = await requireAdminAction("users", "edit");
  const target = await db.user.findUnique({ where: { id: z.string().max(40).parse(userId) } });
  if (!target || !canManageRole(actor, target.role)) return { formError: "forbidden", version };
  const password = generatePassword();
  await db.user.update({ where: { id: target.id }, data: { passwordHash: await bcrypt.hash(password, 12), failedLoginCount: 0, lockedUntil: null } });
  await writeAuditLog({ userId: actor.id, action: "password_reset", entityType: "users", entityId: target.id, details: { email: target.email } });
  return { password, version };
}
