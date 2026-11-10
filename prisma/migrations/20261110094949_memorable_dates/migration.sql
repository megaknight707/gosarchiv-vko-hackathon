-- CreateTable
CREATE TABLE "MemorableDate" (
    "id" TEXT NOT NULL,
    "calendarYear" INTEGER NOT NULL,
    "month" INTEGER,
    "day" INTEGER,
    "dateLabelKz" TEXT NOT NULL,
    "dateLabelRu" TEXT NOT NULL,
    "textKz" TEXT NOT NULL,
    "textRu" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "PublicationStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemorableDate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MemorableDate_calendarYear_month_idx" ON "MemorableDate"("calendarYear", "month");
