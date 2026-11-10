// Онлайн-выставки (ТЗ §6.5) и «Большой архив памяти» (ТЗ §6.6)
import type { EntityConfig } from "../entity-config";

export const exhibitionsConfig: EntityConfig = {
  key: "exhibitions",
  model: "exhibition",
  titleField: { name: "title", localized: true },
  moderated: true,
  demoFlag: true,
  fields: [
    { name: "slug", type: "text", pattern: "slug", required: true, max: 80, help: "slug" },
    { name: "title", type: "text", localized: true, required: true, max: 300, wide: true },
    { name: "description", type: "textarea", localized: true, max: 5000, wide: true },
    { name: "periodLabel", type: "text", localized: true, max: 120 },
    { name: "theme", type: "text", max: 80 },
    { name: "coverUrl", type: "image", folder: "exhibitions" },
    { name: "sortOrder", type: "number", integer: true, min: 0, max: 10000 },
  ],
  columns: [
    { name: "title", localized: true, sortable: true },
    { name: "periodLabel", localized: true },
    { name: "sortOrder", sortable: true },
    { name: "status", format: "status", sortable: true },
    { name: "updatedAt", format: "date", sortable: true },
  ],
  searchFields: ["slug", "titleRu", "titleKz", "titleEn"],
  defaultSort: { field: "sortOrder", direction: "asc" },
  publicPath: (record) => `/exhibitions/${record.slug}`,
};

export const exhibitsConfig: EntityConfig = {
  key: "exhibits",
  model: "exhibit",
  titleField: { name: "title", localized: true },
  moderated: false,
  fields: [
    { name: "exhibitionId", type: "relation", source: "exhibition", required: true },
    { name: "order", type: "number", integer: true, min: 0, max: 10000, required: true, help: "order" },
    { name: "title", type: "text", localized: true, required: true, max: 300, wide: true },
    { name: "text", type: "textarea", localized: true, max: 5000, wide: true },
    { name: "mediaType", type: "select", options: ["IMAGE", "VIDEO", "DOCUMENT"], labels: "MediaType", required: true },
    { name: "mediaUrl", type: "image", folder: "exhibits" },
    { name: "documentId", type: "relation", source: "document", help: "exhibitDocument" },
    { name: "sourceNote", type: "text", localized: true, max: 300, wide: true },
  ],
  columns: [
    { name: "exhibitionId", format: "relation", relation: { include: "exhibition", field: "title", localized: true } },
    { name: "order", sortable: true },
    { name: "title", localized: true, sortable: true },
    { name: "mediaType", format: "enum", labels: "MediaType" },
  ],
  searchFields: ["titleRu", "titleKz", "titleEn"],
  defaultSort: { field: "order", direction: "asc" },
  listInclude: { exhibition: { select: { titleRu: true, titleKz: true, titleEn: true } } },
};

export const collectionsConfig: EntityConfig = {
  key: "collections",
  model: "collection",
  titleField: { name: "title", localized: true },
  moderated: true,
  demoFlag: true,
  fields: [
    { name: "slug", type: "text", pattern: "slug", required: true, max: 80, help: "slug" },
    { name: "title", type: "text", localized: true, required: true, max: 300, wide: true },
    { name: "description", type: "textarea", localized: true, max: 5000, wide: true },
    { name: "periodLabel", type: "text", localized: true, max: 120 },
    { name: "theme", type: "text", max: 80 },
    { name: "sourceNote", type: "text", localized: true, max: 300, wide: true },
    { name: "coverUrl", type: "image", folder: "collections" },
    { name: "sortOrder", type: "number", integer: true, min: 0, max: 10000 },
  ],
  columns: [
    { name: "title", localized: true, sortable: true },
    { name: "theme" },
    { name: "status", format: "status", sortable: true },
    { name: "updatedAt", format: "date", sortable: true },
  ],
  searchFields: ["slug", "titleRu", "titleKz", "titleEn"],
  defaultSort: { field: "sortOrder", direction: "asc" },
};

export const personsConfig: EntityConfig = {
  key: "persons",
  model: "historicalPerson",
  titleField: { name: "name", localized: true },
  moderated: true,
  demoFlag: true,
  fields: [
    { name: "slug", type: "text", pattern: "slug", required: true, max: 80, help: "slug" },
    { name: "name", type: "text", localized: true, required: true, max: 200, wide: true },
    { name: "lifeYears", type: "text", max: 40 },
    { name: "bio", type: "textarea", localized: true, max: 8000, rows: 8, wide: true },
    { name: "fundId", type: "relation", source: "fund" },
    { name: "portraitUrl", type: "image", folder: "persons" },
  ],
  columns: [
    { name: "name", localized: true, sortable: true },
    { name: "lifeYears" },
    { name: "status", format: "status", sortable: true },
    { name: "updatedAt", format: "date", sortable: true },
  ],
  searchFields: ["slug", "nameRu", "nameKz", "nameEn"],
  defaultSort: { field: "nameRu", direction: "asc" },
};

export const eventsConfig: EntityConfig = {
  key: "events",
  model: "historicalEvent",
  titleField: { name: "title", localized: true },
  moderated: true,
  demoFlag: true,
  fields: [
    { name: "year", type: "number", integer: true, min: 1000, max: 2100, required: true },
    { name: "dateExact", type: "date" },
    { name: "title", type: "text", localized: true, required: true, max: 300, wide: true },
    { name: "description", type: "textarea", localized: true, max: 5000, wide: true },
    { name: "theme", type: "text", max: 80 },
    { name: "sourceNote", type: "text", localized: true, max: 300, wide: true },
    { name: "imageUrl", type: "image", folder: "events" },
  ],
  columns: [
    { name: "year", sortable: true },
    { name: "title", localized: true, sortable: true },
    { name: "status", format: "status", sortable: true },
    { name: "updatedAt", format: "date", sortable: true },
  ],
  searchFields: ["titleRu", "titleKz", "titleEn"],
  defaultSort: { field: "year", direction: "asc" },
};
