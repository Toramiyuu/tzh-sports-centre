-- AlterTable
ALTER TABLE "lesson_types" ADD COLUMN "slug" TEXT;
ALTER TABLE "lesson_types" ADD COLUMN "description" TEXT;
ALTER TABLE "lesson_types" ADD COLUMN "detailed_description" TEXT;
ALTER TABLE "lesson_types" ADD COLUMN "sessions_per_month" INTEGER;

-- Populate slug from name (lowercase, spaces to hyphens)
UPDATE "lesson_types" SET "slug" = LOWER(REPLACE("name", ' ', '-'));

-- Make slug NOT NULL after populating
ALTER TABLE "lesson_types" ALTER COLUMN "slug" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "lesson_types_slug_key" ON "lesson_types"("slug");
