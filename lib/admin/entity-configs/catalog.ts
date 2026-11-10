// Электронный каталог: Фонд → Опись → Дело → Документ (ТЗ §6.3)
import type { EntityConfig } from "../entity-config";

const DOC_TYPES = ["PHOTO", "TEXT", "MAP_DRAWING", "AUDIO_VIDEO", "PERSONAL", "ORGANIZATION", "HISTORICAL"] as const;
const ACCESS = ["OPEN", "DESCRIPTION_ONLY", "RESTRICTED"] as const;

export const fundsConfig: EntityConfig = {
  key: "funds",
  model: "fund",
  titleField: { name: "title", localized: true },
  moderated: true,
  demoFlag: true,
  fields: [
    { name: "number", type: "text", required: true, max: 40, help: "fundNumber" },
    { name: "title", type: "text", localized: true, required: true, max: 300, wide: true },
    { name: "description", type: "textarea", localized: true, max: 5000, wide: true },
    { name: "dateFrom", type: "number", integer: true, min: 1700, max: 2100 },
    { name: "dateTo", type: "number", integer: true, min: 1700, max: 2100 },
    { name: "categoryId", type: "relation", source: "category" },
    { name: "branchId", type: "relation", source: "branch" },
    { name: "isPersonal", type: "boolean" },
  ],
  columns: [
    { name: "number", format: "mono", sortable: true },
    { name: "title", localized: true, sortable: true },
    { name: "branchId", format: "relation", relation: { include: "branch", field: "name", localized: true } },
    { name: "status", format: "status", sortable: true },
    { name: "updatedAt", format: "date", sortable: true },
  ],
  searchFields: ["number", "titleRu", "titleKz", "titleEn"],
  defaultSort: { field: "number", direction: "asc" },
  listInclude: { branch: { select: { nameRu: true, nameKz: true, nameEn: true } } },
};

export const inventoriesConfig: EntityConfig = {
  key: "inventories",
  model: "inventory",
  titleField: { name: "title", localized: true },
  moderated: true,
  demoFlag: true,
  fields: [
    { name: "fundId", type: "relation", source: "fund", required: true },
    { name: "number", type: "text", required: true, max: 40 },
    { name: "title", type: "text", localized: true, required: true, max: 300, wide: true },
  ],
  columns: [
    { name: "fundId", format: "relation", relation: { include: "fund", field: "number" } },
    { name: "number", format: "mono", sortable: true },
    { name: "title", localized: true, sortable: true },
    { name: "status", format: "status", sortable: true },
    { name: "updatedAt", format: "date", sortable: true },
  ],
  searchFields: ["number", "titleRu", "titleKz", "titleEn"],
  defaultSort: { field: "updatedAt", direction: "desc" },
  listInclude: { fund: { select: { number: true } } },
};

export const unitsConfig: EntityConfig = {
  key: "units",
  model: "storageUnit",
  titleField: { name: "title", localized: true },
  moderated: true,
  demoFlag: true,
  fields: [
    { name: "inventoryId", type: "relation", source: "inventory", required: true },
    { name: "number", type: "text", required: true, max: 40 },
    { name: "title", type: "text", localized: true, required: true, max: 300, wide: true },
    { name: "dateFrom", type: "number", integer: true, min: 1700, max: 2100 },
    { name: "dateTo", type: "number", integer: true, min: 1700, max: 2100 },
    { name: "sheetsCount", type: "number", integer: true, min: 0, max: 100000 },
  ],
  columns: [
    { name: "number", format: "mono", sortable: true },
    { name: "title", localized: true, sortable: true },
    { name: "status", format: "status", sortable: true },
    { name: "updatedAt", format: "date", sortable: true },
  ],
  searchFields: ["number", "titleRu", "titleKz", "titleEn"],
  defaultSort: { field: "updatedAt", direction: "desc" },
};

export const documentsConfig: EntityConfig = {
  key: "documents",
  model: "archiveDocument",
  titleField: { name: "title", localized: true },
  moderated: true,
  demoFlag: true,
  hook: "document",
  fields: [
    { name: "storageUnitId", type: "relation", source: "storageUnit", required: true, help: "storageUnit", wide: true },
    { name: "title", type: "text", localized: true, required: true, max: 300, wide: true },
    { name: "docType", type: "select", options: DOC_TYPES, labels: "DocType", required: true },
    { name: "accessStatus", type: "select", options: ACCESS, labels: "Access", required: true },
    { name: "yearFrom", type: "number", integer: true, min: 1700, max: 2100, required: true },
    { name: "yearTo", type: "number", integer: true, min: 1700, max: 2100 },
    { name: "dateExact", type: "date" },
    { name: "periodLabel", type: "text", localized: true, max: 120 },
    { name: "summary", type: "textarea", localized: true, required: true, max: 5000, wide: true },
    { name: "historicalNote", type: "textarea", localized: true, max: 5000, wide: true },
    { name: "placeId", type: "relation", source: "place" },
    { name: "placeName", type: "text", max: 200, help: "placeName" },
    { name: "author", type: "text", max: 300 },
    { name: "language", type: "text", max: 40, help: "language" },
    { name: "sheetsCount", type: "number", integer: true, min: 0, max: 100000 },
    { name: "branchId", type: "relation", source: "branch", help: "documentBranch" },
    { name: "tags", type: "tags", wide: true },
    { name: "featured", type: "boolean", help: "featured" },
  ],
  columns: [
    { name: "cipher", format: "mono", sortable: true },
    { name: "title", localized: true, sortable: true },
    { name: "docType", format: "enum", labels: "DocType" },
    { name: "yearFrom", sortable: true },
    { name: "hasDigitalCopy", format: "boolean" },
    { name: "status", format: "status", sortable: true },
    { name: "updatedAt", format: "date", sortable: true },
  ],
  searchFields: ["cipher", "titleRu", "titleKz", "titleEn", "author"],
  defaultSort: { field: "updatedAt", direction: "desc" },
  publicPath: (record) => `/catalog/${record.id}`,
};
