-- DropIndex
DROP INDEX "public"."only_one_highlight";

-- AlterTable
ALTER TABLE "public"."Organization" ADD COLUMN     "logo" TEXT;

-- AlterTable
ALTER TABLE "public"."Team" ADD COLUMN     "logo" TEXT;

-- CreateIndex
CREATE INDEX "Review_teamId_idx" ON "public"."Review"("teamId");
