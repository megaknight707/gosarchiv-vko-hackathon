// Разбор и проверка формы универсального CRUD по конфигурации сущности.
// Для каждого поля строится zod-схема (тип, обязательность, длина, диапазон, формат),
// ошибки возвращаются кодами — интерфейс показывает их на языке админки рядом с полем.
import { z } from "zod";
import { localizedNames, type EntityConfig, type FieldConfig } from "./entity-config";

export type FieldError = "required" | "tooLong" | "number" | "range" | "slug" | "email" | "url" | "date" | "option" | "unique" | "order" | "upload";

export type ParsedForm = {
  data: Record<string, unknown>;
  tagIds: string[] | null;
  /** Новые файлы для полей-изображений: имя поля → файл */
  files: Record<string, File>;
  errors: Record<string, FieldError>;
  /** Введённые значения как есть — чтобы при ошибке форма не потеряла набранный текст */
  raw: Record<string, string>;
};

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function code(issues: z.core.$ZodIssue[]): FieldError {
  const issue = issues[0];
  if (issue.code === "too_big") return issue.origin === "string" ? "tooLong" : "range";
  if (issue.code === "too_small") return issue.origin === "string" ? "required" : "range";
  if (issue.code === "invalid_format") {
    if (issue.format === "email") return "email";
    if (issue.format === "url") return "url";
    if (issue.format === "date") return "date";
    return "slug";
  }
  if (issue.code === "invalid_value") return "option";
  if (issue.code === "invalid_type") return "number";
  return "required";
}

function textSchema(field: Extract<FieldConfig, { type: "text" | "textarea" }>, required: boolean) {
  let schema = z.string().trim().max(field.max ?? 10_000);
  if (required) schema = schema.min(1);
  if (field.type === "text" && field.pattern === "slug") return schema.regex(SLUG);
  if (field.type === "text" && field.pattern === "email") return z.union([z.literal(""), z.email()]);
  if (field.type === "text" && field.pattern === "url") return z.union([z.literal(""), z.url({ protocol: /^https?$/ })]);
  return schema;
}

function numberSchema(field: Extract<FieldConfig, { type: "number" }>) {
  let schema = z.number();
  if (field.integer) schema = schema.int();
  if (field.min !== undefined) schema = schema.min(field.min);
  if (field.max !== undefined) schema = schema.max(field.max);
  return schema;
}

export function parseEntityForm(config: EntityConfig, formData: FormData): ParsedForm {
  const result: ParsedForm = { data: {}, tagIds: null, files: {}, errors: {}, raw: {} };
  const text = (name: string) => {
    const value = formData.get(name);
    const str = typeof value === "string" ? value : "";
    result.raw[name] = str;
    return str;
  };
  const check = <T>(column: string, schema: z.ZodType<T>, value: unknown): T | undefined => {
    const parsed = schema.safeParse(value);
    if (parsed.success) return parsed.data;
    result.errors[column] = code(parsed.error.issues);
    return undefined;
  };

  for (const field of config.fields) {
    switch (field.type) {
      case "text":
      case "textarea": {
        const columns = field.localized ? localizedNames(field.name) : [field.name];
        for (const column of columns) {
          // Для многоязычных полей обязателен русский вариант (KZ/EN — подсказка «нет перевода»)
          const required = Boolean(field.required) && (!field.localized || column.endsWith("Ru"));
          const value = check(column, textSchema(field, required), text(column));
          if (value !== undefined) result.data[column] = value === "" ? (field.localized && field.required ? "" : null) : value;
        }
        break;
      }
      case "number": {
        const value = text(field.name).trim().replace(",", ".");
        if (!value) {
          if (field.required) result.errors[field.name] = "required";
          else result.data[field.name] = null;
          break;
        }
        const parsed = check(field.name, numberSchema(field), Number(value));
        if (parsed !== undefined) result.data[field.name] = parsed;
        break;
      }
      case "boolean":
        result.data[field.name] = formData.get(field.name) === "on";
        break;
      case "date": {
        const value = text(field.name).trim();
        if (!value) {
          if (field.required) result.errors[field.name] = "required";
          else result.data[field.name] = null;
          break;
        }
        const parsed = check(field.name, z.iso.date(), value);
        if (parsed) result.data[field.name] = new Date(`${parsed}T00:00:00Z`);
        break;
      }
      case "select": {
        const value = text(field.name);
        if (!value && !field.required) {
          result.data[field.name] = null;
          break;
        }
        const parsed = check(field.name, z.enum(field.options as [string, ...string[]]), value);
        if (parsed) result.data[field.name] = parsed;
        break;
      }
      case "relation": {
        const value = text(field.name).trim();
        if (!value) {
          if (field.required) result.errors[field.name] = "required";
          else result.data[field.name] = null;
          break;
        }
        const parsed = check(field.name, z.string().regex(/^[a-z0-9]{8,40}$/i), value);
        if (parsed) result.data[field.name] = parsed;
        break;
      }
      case "tags":
        result.tagIds = formData
          .getAll(field.name)
          .filter((v): v is string => typeof v === "string" && /^[a-z0-9]{8,40}$/i.test(v))
          .slice(0, 30);
        break;
      case "image": {
        const current = text(field.name).trim();
        const file = formData.get(`${field.name}__file`);
        if (formData.get(`${field.name}__remove`) === "on") result.data[field.name] = null;
        else result.data[field.name] = current || null;
        if (file instanceof File && file.size > 0) result.files[field.name] = file;
        break;
      }
      case "coordinates": {
        const lat = Number(text("latitude").replace(",", "."));
        const lng = Number(text("longitude").replace(",", "."));
        const latitude = check("latitude", z.number().min(-90).max(90), text("latitude") ? lat : NaN);
        const longitude = check("longitude", z.number().min(-180).max(180), text("longitude") ? lng : NaN);
        if (latitude !== undefined) result.data.latitude = latitude;
        if (longitude !== undefined) result.data.longitude = longitude;
        result.data.coordinatesApproximate = formData.get("coordinatesApproximate") === "on";
        break;
      }
    }
  }

  if (config.demoFlag) result.data.isDemo = formData.get("isDemo") === "on";

  // Период: «по» не раньше «с»
  for (const [from, to] of [
    ["dateFrom", "dateTo"],
    ["yearFrom", "yearTo"],
  ] as const) {
    const a = result.data[from];
    const b = result.data[to];
    if (typeof a === "number" && typeof b === "number" && b < a) result.errors[to] = "order";
  }

  return result;
}
