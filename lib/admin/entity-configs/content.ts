// Новости, информационные страницы, FAQ и филиалы (ТЗ §6.4)
import type { EntityConfig } from "../entity-config";

export const newsConfig: EntityConfig = {
  key: "news",
  model: "news",
  titleField: { name: "title", localized: true },
  moderated: true,
  demoFlag: true,
  fields: [
    { name: "slug", type: "text", pattern: "slug", required: true, max: 120, help: "slug" },
    { name: "title", type: "text", localized: true, required: true, max: 300, wide: true },
    { name: "excerpt", type: "textarea", localized: true, max: 600, rows: 3, wide: true },
    { name: "body", type: "textarea", localized: true, max: 20000, rows: 10, wide: true, help: "markdown" },
    { name: "category", type: "select", options: ["EXHIBITION", "CONFERENCE", "EVENT", "RESEARCH", "BRANCH"], labels: "NewsCategory", required: true },
    { name: "branchId", type: "relation", source: "branch" },
    { name: "publishedAt", type: "date", help: "publishedAt" },
    { name: "coverUrl", type: "image", folder: "news" },
    { name: "videoUrl", type: "text", pattern: "url", max: 500 },
    { name: "sourceUrl", type: "text", pattern: "url", max: 500 },
  ],
  columns: [
    { name: "title", localized: true, sortable: true },
    { name: "category", format: "enum", labels: "NewsCategory" },
    { name: "publishedAt", format: "date", sortable: true },
    { name: "status", format: "status", sortable: true },
  ],
  searchFields: ["slug", "titleRu", "titleKz", "titleEn"],
  defaultSort: { field: "publishedAt", direction: "desc" },
  publicPath: (record) => `/news/${record.slug}`,
};

export const pagesConfig: EntityConfig = {
  key: "pages",
  model: "page",
  titleField: { name: "title", localized: true },
  moderated: true,
  fields: [
    { name: "slug", type: "text", pattern: "slug", required: true, max: 120, help: "slug" },
    { name: "section", type: "select", options: ["about", "help", "privacy"], labels: "PageSection", required: true },
    { name: "title", type: "text", localized: true, required: true, max: 300, wide: true },
    { name: "body", type: "textarea", localized: true, max: 30000, rows: 12, wide: true, help: "markdown" },
    { name: "sortOrder", type: "number", integer: true, min: 0, max: 10000 },
  ],
  columns: [
    { name: "title", localized: true, sortable: true },
    { name: "section", format: "enum", labels: "PageSection", sortable: true },
    { name: "sortOrder", sortable: true },
    { name: "status", format: "status", sortable: true },
  ],
  searchFields: ["slug", "titleRu", "titleKz", "titleEn"],
  defaultSort: { field: "sortOrder", direction: "asc" },
};

export const faqConfig: EntityConfig = {
  key: "faq",
  model: "faqItem",
  titleField: { name: "question", localized: true },
  moderated: true,
  fields: [
    { name: "question", type: "text", localized: true, required: true, max: 400, wide: true },
    { name: "answer", type: "textarea", localized: true, required: true, max: 5000, wide: true },
    { name: "order", type: "number", integer: true, min: 0, max: 10000 },
  ],
  columns: [
    { name: "order", sortable: true },
    { name: "question", localized: true, sortable: true },
    { name: "status", format: "status", sortable: true },
  ],
  searchFields: ["questionRu", "questionKz", "questionEn"],
  defaultSort: { field: "order", direction: "asc" },
};

export const branchesConfig: EntityConfig = {
  key: "branches",
  model: "branch",
  titleField: { name: "name", localized: true },
  moderated: false,
  fields: [
    { name: "slug", type: "text", pattern: "slug", required: true, max: 80, help: "slug" },
    { name: "type", type: "select", options: ["MAIN", "BUILDING", "BRANCH", "PERSONNEL"], labels: "BranchType", required: true },
    { name: "name", type: "text", localized: true, required: true, max: 300, wide: true },
    { name: "city", type: "text", localized: true, required: true, max: 120 },
    { name: "address", type: "text", localized: true, required: true, max: 300, wide: true },
    { name: "coordinates", type: "coordinates", required: true, wide: true },
    { name: "phone", type: "text", max: 120 },
    { name: "email", type: "text", pattern: "email", max: 200 },
    { name: "headName", type: "text", max: 200 },
    { name: "workHours", type: "text", localized: true, max: 300, wide: true },
    { name: "readingRoomHours", type: "text", localized: true, max: 300, wide: true },
    { name: "description", type: "textarea", localized: true, max: 5000, wide: true },
    { name: "servedArea", type: "textarea", localized: true, max: 2000, rows: 3, wide: true },
    { name: "fundsInfo", type: "textarea", localized: true, max: 2000, rows: 3, wide: true },
    { name: "photoUrl", type: "image", folder: "branches" },
    { name: "isVisibleOnMap", type: "boolean" },
    { name: "isMain", type: "boolean" },
    { name: "sortOrder", type: "number", integer: true, min: 0, max: 10000 },
  ],
  columns: [
    { name: "name", localized: true, sortable: true },
    { name: "city", localized: true },
    { name: "phone" },
    { name: "isVisibleOnMap", format: "boolean" },
    { name: "updatedAt", format: "date", sortable: true },
  ],
  searchFields: ["slug", "nameRu", "nameKz", "nameEn", "cityRu"],
  defaultSort: { field: "sortOrder", direction: "asc" },
  publicPath: () => "/branches",
};
