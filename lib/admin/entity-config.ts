// Описание сущности для универсального CRUD админки.
// Одна конфигурация → список (AdminDataTable), форма (AdminEntityForm), zod-проверка,
// экспорт CSV. Новый раздел админки = новый файл в entity-configs/, без нового кода форм.
// Конфигурации — простые данные (без функций), поэтому их можно передавать в клиентские компоненты.
import type { AdminResource } from "@/lib/auth/permissions";

/** Справочники для выпадающих списков (варианты загружаются на сервере) */
export type RelationSource =
  | "branch"
  | "category"
  | "fund"
  | "inventory"
  | "storageUnit"
  | "place"
  | "exhibition"
  | "document";

type FieldCommon = {
  /** Имя поля в базе. Для многоязычных — основа: «title» → titleKz / titleRu / titleEn */
  name: string;
  /** Обязательное поле. Для многоязычных обязателен русский вариант, KZ/EN — индикатор «нет перевода» */
  required?: boolean;
  /** Ключ подсказки в Admin.help */
  help?: string;
  /** Поле занимает всю ширину формы */
  wide?: boolean;
};

export type FieldConfig = FieldCommon &
  (
    | { type: "text"; localized?: boolean; max?: number; pattern?: "slug" | "email" | "url" }
    | { type: "textarea"; localized?: boolean; max?: number; rows?: number }
    | { type: "number"; min?: number; max?: number; step?: number; integer?: boolean }
    | { type: "boolean" }
    | { type: "date" }
    | { type: "select"; options: readonly string[]; labels: string }
    | { type: "relation"; source: RelationSource }
    | { type: "tags" }
    | { type: "image"; folder: string }
    | { type: "coordinates" }
  );

export type ListColumn = {
  name: string;
  /** Как показывать: текст, статус публикации, значение из перечисления, дата, да/нет, шифр */
  format?: "text" | "status" | "enum" | "date" | "boolean" | "mono" | "relation";
  labels?: string;
  localized?: boolean;
  sortable?: boolean;
  /** Для format: "relation" — какое поле связанной записи показать */
  relation?: { include: string; field: string; localized?: boolean };
};

export type EntityConfig = {
  /** Раздел в адресе и в матрице прав: /admin/documents */
  key: AdminResource;
  /** Модель Prisma (имя делегата: db.archiveDocument) */
  model: "fund" | "inventory" | "storageUnit" | "archiveDocument" | "exhibition" | "exhibit" | "collection" | "historicalPerson" | "historicalEvent" | "news" | "page" | "faqItem" | "branch";
  /** Поле для заголовка записи в списках, журнале и модерации */
  titleField: { name: string; localized: boolean };
  /** Есть ли статусы согласования (Черновик → … → Опубликовано) */
  moderated: boolean;
  /** Есть ли поле isDemo (демонстрационная запись) */
  demoFlag?: boolean;
  fields: FieldConfig[];
  columns: ListColumn[];
  /** Поля для поиска в списке (contains, без учёта регистра) */
  searchFields: string[];
  defaultSort: { field: string; direction: "asc" | "desc" };
  /** Связи, которые нужно подгрузить для колонок списка */
  listInclude?: Record<string, unknown>;
  /** Особая логика сохранения (вычисление шифра документа и т. п.) */
  hook?: "document";
  /** Ссылка «Открыть на сайте» для опубликованной записи */
  publicPath?: (record: Record<string, unknown>) => string | null;
};

export function localizedNames(base: string): [string, string, string] {
  return [`${base}Kz`, `${base}Ru`, `${base}En`];
}

/** Все имена полей базы, которые заполняет форма (для экспорта и журнала изменений) */
export function fieldColumns(field: FieldConfig): string[] {
  if ((field.type === "text" || field.type === "textarea") && field.localized) return localizedNames(field.name);
  if (field.type === "coordinates") return ["latitude", "longitude", "coordinatesApproximate"];
  if (field.type === "tags") return [];
  return [field.name];
}
