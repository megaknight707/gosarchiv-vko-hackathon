-- CreateTable
CREATE TABLE "FundRegistryEntry" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "numberKey" TEXT NOT NULL,
    "numberSort" INTEGER NOT NULL,
    "series" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "names" JSONB NOT NULL,
    "category" INTEGER,
    "dateFrom" INTEGER,
    "dateTo" INTEGER,
    "unitsLabel" TEXT,
    "note" TEXT,
    "sourceYear" INTEGER NOT NULL DEFAULT 2018,

    CONSTRAINT "FundRegistryEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FundRegistryEntry_number_key" ON "FundRegistryEntry"("number");

-- CreateIndex
CREATE INDEX "FundRegistryEntry_series_numberSort_idx" ON "FundRegistryEntry"("series", "numberSort");

-- CreateIndex
CREATE INDEX "FundRegistryEntry_numberKey_idx" ON "FundRegistryEntry"("numberKey");

-- CreateIndex
CREATE INDEX "FundRegistryEntry_title_idx" ON "FundRegistryEntry" USING GIN ("title" gin_trgm_ops);
