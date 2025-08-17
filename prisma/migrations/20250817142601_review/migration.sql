/*
  Warnings:

  - You are about to drop the column `season` on the `Review` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,teamId,season_term,season_year]` on the table `Review` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."Review_userId_teamId_season_key";

-- AlterTable
ALTER TABLE "public"."Review" DROP COLUMN "season",
ADD COLUMN     "age_level_at_review" TEXT NOT NULL DEFAULT '12U',
ADD COLUMN     "season_term" "public"."Season" NOT NULL DEFAULT 'SPRING',
ADD COLUMN     "season_year" INTEGER NOT NULL DEFAULT 2024;

-- CreateIndex
CREATE UNIQUE INDEX "Review_userId_teamId_season_term_season_year_key" ON "public"."Review"("userId", "teamId", "season_term", "season_year");
