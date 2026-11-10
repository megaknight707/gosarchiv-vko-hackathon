-- AlterTable
ALTER TABLE "DigitalFile" ADD COLUMN     "checksum" TEXT,
ADD COLUMN     "isPrivate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "originalKey" TEXT,
ADD COLUMN     "originalMime" TEXT,
ADD COLUMN     "originalName" TEXT,
ADD COLUMN     "previewKey" TEXT,
ADD COLUMN     "uploadedById" TEXT,
ADD COLUMN     "viewKey" TEXT;
