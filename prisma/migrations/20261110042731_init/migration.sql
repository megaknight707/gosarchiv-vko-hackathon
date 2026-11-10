-- Расширения для поиска: pg_trgm — нечёткий поиск (опечатки, разное написание),
-- unaccent — поиск без учёта диакритики.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'SITE_ADMIN', 'EDITOR', 'ARCHIVIST', 'BRANCH_ADMIN', 'MODERATOR', 'ANALYST');

-- CreateEnum
CREATE TYPE "PublicationStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'NEEDS_CHANGES', 'APPROVED', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AccessStatus" AS ENUM ('OPEN', 'DESCRIPTION_ONLY', 'RESTRICTED');

-- CreateEnum
CREATE TYPE "DocType" AS ENUM ('PHOTO', 'TEXT', 'MAP_DRAWING', 'AUDIO_VIDEO', 'PERSONAL', 'ORGANIZATION', 'HISTORICAL');

-- CreateEnum
CREATE TYPE "BranchType" AS ENUM ('MAIN', 'BUILDING', 'BRANCH', 'PERSONNEL');

-- CreateEnum
CREATE TYPE "FileKind" AS ENUM ('IMAGE', 'PDF', 'AUDIO', 'VIDEO');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "NewsCategory" AS ENUM ('EXHIBITION', 'CONFERENCE', 'EVENT', 'RESEARCH', 'BRANCH');

-- CreateEnum
CREATE TYPE "FeedbackKind" AS ENUM ('REVIEW', 'SUGGESTION', 'WISH');

-- CreateEnum
CREATE TYPE "SearchSource" AS ENUM ('CATALOG', 'AI');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "branchId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "BranchType" NOT NULL,
    "nameKz" TEXT NOT NULL,
    "nameRu" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "cityKz" TEXT NOT NULL,
    "cityRu" TEXT NOT NULL,
    "cityEn" TEXT NOT NULL,
    "addressKz" TEXT NOT NULL,
    "addressRu" TEXT NOT NULL,
    "addressEn" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "workHoursKz" TEXT,
    "workHoursRu" TEXT,
    "workHoursEn" TEXT,
    "readingRoomHoursKz" TEXT,
    "readingRoomHoursRu" TEXT,
    "readingRoomHoursEn" TEXT,
    "descriptionKz" TEXT,
    "descriptionRu" TEXT,
    "descriptionEn" TEXT,
    "servedAreaKz" TEXT,
    "servedAreaRu" TEXT,
    "servedAreaEn" TEXT,
    "fundsInfoKz" TEXT,
    "fundsInfoRu" TEXT,
    "fundsInfoEn" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "coordinatesApproximate" BOOLEAN NOT NULL DEFAULT true,
    "photoUrl" TEXT,
    "isMain" BOOLEAN NOT NULL DEFAULT false,
    "isVisibleOnMap" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameKz" TEXT NOT NULL,
    "nameRu" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fund" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "titleKz" TEXT NOT NULL,
    "titleRu" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "descriptionKz" TEXT,
    "descriptionRu" TEXT,
    "descriptionEn" TEXT,
    "dateFrom" INTEGER,
    "dateTo" INTEGER,
    "categoryId" TEXT,
    "branchId" TEXT,
    "isPersonal" BOOLEAN NOT NULL DEFAULT false,
    "status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inventory" (
    "id" TEXT NOT NULL,
    "fundId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "titleKz" TEXT NOT NULL,
    "titleRu" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StorageUnit" (
    "id" TEXT NOT NULL,
    "inventoryId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "titleKz" TEXT NOT NULL,
    "titleRu" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "dateFrom" INTEGER,
    "dateTo" INTEGER,
    "sheetsCount" INTEGER,
    "status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StorageUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArchiveDocument" (
    "id" TEXT NOT NULL,
    "storageUnitId" TEXT NOT NULL,
    "titleKz" TEXT NOT NULL,
    "titleRu" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "cipher" TEXT NOT NULL,
    "dateExact" DATE,
    "yearFrom" INTEGER,
    "yearTo" INTEGER,
    "periodLabelKz" TEXT,
    "periodLabelRu" TEXT,
    "periodLabelEn" TEXT,
    "docType" "DocType" NOT NULL,
    "language" TEXT,
    "sheetsCount" INTEGER,
    "historicalNoteKz" TEXT,
    "historicalNoteRu" TEXT,
    "historicalNoteEn" TEXT,
    "summaryKz" TEXT,
    "summaryRu" TEXT,
    "summaryEn" TEXT,
    "placeName" TEXT,
    "placeId" TEXT,
    "author" TEXT,
    "accessStatus" "AccessStatus" NOT NULL DEFAULT 'OPEN',
    "hasDigitalCopy" BOOLEAN NOT NULL DEFAULT false,
    "branchId" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "searchVector" tsvector,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArchiveDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DigitalFile" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "kind" "FileKind" NOT NULL,
    "url" TEXT NOT NULL,
    "previewUrl" TEXT,
    "originalUrl" TEXT,
    "pageNumber" INTEGER NOT NULL DEFAULT 1,
    "width" INTEGER,
    "height" INTEGER,
    "sizeBytes" INTEGER,
    "mimeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DigitalFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Place" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameKz" TEXT NOT NULL,
    "nameRu" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "aliases" TEXT[],
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,

    CONSTRAINT "Place_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameKz" TEXT NOT NULL,
    "nameRu" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titleKz" TEXT NOT NULL,
    "titleRu" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "descriptionKz" TEXT,
    "descriptionRu" TEXT,
    "descriptionEn" TEXT,
    "theme" TEXT,
    "periodLabelKz" TEXT,
    "periodLabelRu" TEXT,
    "periodLabelEn" TEXT,
    "sourceNoteKz" TEXT,
    "sourceNoteRu" TEXT,
    "sourceNoteEn" TEXT,
    "coverUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoricalPerson" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameKz" TEXT NOT NULL,
    "nameRu" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "lifeYears" TEXT,
    "bioKz" TEXT,
    "bioRu" TEXT,
    "bioEn" TEXT,
    "fundId" TEXT,
    "portraitUrl" TEXT,
    "status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HistoricalPerson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoricalEvent" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "dateExact" DATE,
    "titleKz" TEXT NOT NULL,
    "titleRu" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "descriptionKz" TEXT,
    "descriptionRu" TEXT,
    "descriptionEn" TEXT,
    "theme" TEXT,
    "imageUrl" TEXT,
    "sourceNoteKz" TEXT,
    "sourceNoteRu" TEXT,
    "sourceNoteEn" TEXT,
    "status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HistoricalEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exhibition" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titleKz" TEXT NOT NULL,
    "titleRu" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "descriptionKz" TEXT,
    "descriptionRu" TEXT,
    "descriptionEn" TEXT,
    "coverUrl" TEXT,
    "theme" TEXT,
    "periodLabelKz" TEXT,
    "periodLabelRu" TEXT,
    "periodLabelEn" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exhibition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exhibit" (
    "id" TEXT NOT NULL,
    "exhibitionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "titleKz" TEXT NOT NULL,
    "titleRu" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "textKz" TEXT,
    "textRu" TEXT,
    "textEn" TEXT,
    "mediaUrl" TEXT,
    "mediaType" "MediaType" NOT NULL DEFAULT 'IMAGE',
    "documentId" TEXT,
    "sourceNoteKz" TEXT,
    "sourceNoteRu" TEXT,
    "sourceNoteEn" TEXT,

    CONSTRAINT "Exhibit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "News" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titleKz" TEXT NOT NULL,
    "titleRu" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "excerptKz" TEXT,
    "excerptRu" TEXT,
    "excerptEn" TEXT,
    "bodyKz" TEXT,
    "bodyRu" TEXT,
    "bodyEn" TEXT,
    "coverUrl" TEXT,
    "videoUrl" TEXT,
    "sourceUrl" TEXT,
    "category" "NewsCategory" NOT NULL DEFAULT 'EVENT',
    "branchId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "News_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Page" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "titleKz" TEXT NOT NULL,
    "titleRu" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "bodyKz" TEXT,
    "bodyRu" TEXT,
    "bodyEn" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FaqItem" (
    "id" TEXT NOT NULL,
    "questionKz" TEXT NOT NULL,
    "questionRu" TEXT NOT NULL,
    "questionEn" TEXT NOT NULL,
    "answerKz" TEXT NOT NULL,
    "answerRu" TEXT NOT NULL,
    "answerEn" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" "PublicationStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FaqItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "message" TEXT NOT NULL,
    "kind" "FeedbackKind" NOT NULL,
    "locale" TEXT NOT NULL,
    "isReviewed" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "details" JSONB,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationComment" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "authorId" TEXT,
    "fromStatus" "PublicationStatus",
    "toStatus" "PublicationStatus",
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModerationComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchLog" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "parsedFilters" JSONB,
    "resultsCount" INTEGER NOT NULL,
    "source" "SearchSource" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageView" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PageView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiCache" (
    "id" TEXT NOT NULL,
    "queryHash" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "response" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimit" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ArchiveDocumentToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ArchiveDocumentToTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ArchiveDocumentToCollection" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ArchiveDocumentToCollection_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ArchiveDocumentToHistoricalPerson" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ArchiveDocumentToHistoricalPerson_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ArchiveDocumentToHistoricalEvent" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ArchiveDocumentToHistoricalEvent_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_slug_key" ON "Branch"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Fund_status_idx" ON "Fund"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Fund_number_key" ON "Fund"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_fundId_number_key" ON "Inventory"("fundId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "StorageUnit_inventoryId_number_key" ON "StorageUnit"("inventoryId", "number");

-- CreateIndex
CREATE INDEX "ArchiveDocument_status_docType_idx" ON "ArchiveDocument"("status", "docType");

-- CreateIndex
CREATE INDEX "ArchiveDocument_yearFrom_yearTo_idx" ON "ArchiveDocument"("yearFrom", "yearTo");

-- CreateIndex
CREATE INDEX "ArchiveDocument_placeId_idx" ON "ArchiveDocument"("placeId");

-- CreateIndex
CREATE INDEX "ArchiveDocument_cipher_idx" ON "ArchiveDocument"("cipher");

-- CreateIndex
CREATE INDEX "ArchiveDocument_searchVector_idx" ON "ArchiveDocument" USING GIN ("searchVector");

-- CreateIndex
CREATE INDEX "ArchiveDocument_titleRu_trgm_idx" ON "ArchiveDocument" USING GIN ("titleRu" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "ArchiveDocument_titleKz_trgm_idx" ON "ArchiveDocument" USING GIN ("titleKz" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "ArchiveDocument_titleEn_trgm_idx" ON "ArchiveDocument" USING GIN ("titleEn" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "DigitalFile_documentId_pageNumber_idx" ON "DigitalFile"("documentId", "pageNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Place_slug_key" ON "Place"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Collection_slug_key" ON "Collection"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "HistoricalPerson_slug_key" ON "HistoricalPerson"("slug");

-- CreateIndex
CREATE INDEX "HistoricalEvent_year_idx" ON "HistoricalEvent"("year");

-- CreateIndex
CREATE UNIQUE INDEX "Exhibition_slug_key" ON "Exhibition"("slug");

-- CreateIndex
CREATE INDEX "Exhibit_exhibitionId_order_idx" ON "Exhibit"("exhibitionId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "News_slug_key" ON "News"("slug");

-- CreateIndex
CREATE INDEX "News_status_publishedAt_idx" ON "News"("status", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Page_slug_key" ON "Page"("slug");

-- CreateIndex
CREATE INDEX "Feedback_createdAt_idx" ON "Feedback"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "ModerationComment_entityType_entityId_idx" ON "ModerationComment"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "SearchLog_createdAt_idx" ON "SearchLog"("createdAt");

-- CreateIndex
CREATE INDEX "SearchLog_resultsCount_idx" ON "SearchLog"("resultsCount");

-- CreateIndex
CREATE UNIQUE INDEX "PageView_path_locale_day_key" ON "PageView"("path", "locale", "day");

-- CreateIndex
CREATE UNIQUE INDEX "AiCache_queryHash_locale_key" ON "AiCache"("queryHash", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "RateLimit_key_windowStart_key" ON "RateLimit"("key", "windowStart");

-- CreateIndex
CREATE INDEX "_ArchiveDocumentToTag_B_index" ON "_ArchiveDocumentToTag"("B");

-- CreateIndex
CREATE INDEX "_ArchiveDocumentToCollection_B_index" ON "_ArchiveDocumentToCollection"("B");

-- CreateIndex
CREATE INDEX "_ArchiveDocumentToHistoricalPerson_B_index" ON "_ArchiveDocumentToHistoricalPerson"("B");

-- CreateIndex
CREATE INDEX "_ArchiveDocumentToHistoricalEvent_B_index" ON "_ArchiveDocumentToHistoricalEvent"("B");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fund" ADD CONSTRAINT "Fund_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fund" ADD CONSTRAINT "Fund_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "Fund"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageUnit" ADD CONSTRAINT "StorageUnit_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchiveDocument" ADD CONSTRAINT "ArchiveDocument_storageUnitId_fkey" FOREIGN KEY ("storageUnitId") REFERENCES "StorageUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchiveDocument" ADD CONSTRAINT "ArchiveDocument_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchiveDocument" ADD CONSTRAINT "ArchiveDocument_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigitalFile" ADD CONSTRAINT "DigitalFile_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "ArchiveDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricalPerson" ADD CONSTRAINT "HistoricalPerson_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "Fund"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exhibit" ADD CONSTRAINT "Exhibit_exhibitionId_fkey" FOREIGN KEY ("exhibitionId") REFERENCES "Exhibition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exhibit" ADD CONSTRAINT "Exhibit_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "ArchiveDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "News" ADD CONSTRAINT "News_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationComment" ADD CONSTRAINT "ModerationComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArchiveDocumentToTag" ADD CONSTRAINT "_ArchiveDocumentToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "ArchiveDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArchiveDocumentToTag" ADD CONSTRAINT "_ArchiveDocumentToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArchiveDocumentToCollection" ADD CONSTRAINT "_ArchiveDocumentToCollection_A_fkey" FOREIGN KEY ("A") REFERENCES "ArchiveDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArchiveDocumentToCollection" ADD CONSTRAINT "_ArchiveDocumentToCollection_B_fkey" FOREIGN KEY ("B") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArchiveDocumentToHistoricalPerson" ADD CONSTRAINT "_ArchiveDocumentToHistoricalPerson_A_fkey" FOREIGN KEY ("A") REFERENCES "ArchiveDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArchiveDocumentToHistoricalPerson" ADD CONSTRAINT "_ArchiveDocumentToHistoricalPerson_B_fkey" FOREIGN KEY ("B") REFERENCES "HistoricalPerson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArchiveDocumentToHistoricalEvent" ADD CONSTRAINT "_ArchiveDocumentToHistoricalEvent_A_fkey" FOREIGN KEY ("A") REFERENCES "ArchiveDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArchiveDocumentToHistoricalEvent" ADD CONSTRAINT "_ArchiveDocumentToHistoricalEvent_B_fkey" FOREIGN KEY ("B") REFERENCES "HistoricalEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────
-- Полнотекстовый поиск по документам каталога.
-- Вектор собирается триггером при каждой вставке/изменении записи:
--   русский текст — конфигурация 'russian' (стемминг: «фотографии» = «фотография»),
--   казахский и английский — 'simple' (без стемминга, по словам).
-- Веса: A — название и шифр, B — краткое описание, C — историческая справка.
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION archive_document_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW."searchVector" :=
      setweight(to_tsvector('russian', coalesce(NEW."titleRu", '')), 'A')
   || setweight(to_tsvector('simple',  coalesce(NEW."titleKz", '') || ' ' || coalesce(NEW."titleEn", '')), 'A')
   || setweight(to_tsvector('simple',  coalesce(NEW."cipher", '') || ' ' || coalesce(NEW."placeName", '') || ' ' || coalesce(NEW."author", '')), 'A')
   || setweight(to_tsvector('russian', coalesce(NEW."summaryRu", '') || ' ' || coalesce(NEW."periodLabelRu", '')), 'B')
   || setweight(to_tsvector('simple',  coalesce(NEW."summaryKz", '') || ' ' || coalesce(NEW."summaryEn", '')), 'B')
   || setweight(to_tsvector('russian', coalesce(NEW."historicalNoteRu", '')), 'C')
   || setweight(to_tsvector('simple',  coalesce(NEW."historicalNoteKz", '') || ' ' || coalesce(NEW."historicalNoteEn", '')), 'C');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER archive_document_search_vector_trigger
  BEFORE INSERT OR UPDATE ON "ArchiveDocument"
  FOR EACH ROW EXECUTE FUNCTION archive_document_search_vector_update();
