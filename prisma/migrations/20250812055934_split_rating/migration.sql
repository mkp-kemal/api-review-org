/*
  Warnings:

  - You are about to drop the column `coaching` on the `Review` table. All the data in the column will be lost.
  - You are about to drop the column `culture` on the `Review` table. All the data in the column will be lost.
  - You are about to drop the column `development` on the `Review` table. All the data in the column will be lost.
  - You are about to drop the column `overall` on the `Review` table. All the data in the column will be lost.
  - You are about to drop the column `safety` on the `Review` table. All the data in the column will be lost.
  - You are about to drop the column `transparency` on the `Review` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."Review_userId_teamId_season_key";

-- AlterTable
ALTER TABLE "public"."Review" DROP COLUMN "coaching",
DROP COLUMN "culture",
DROP COLUMN "development",
DROP COLUMN "overall",
DROP COLUMN "safety",
DROP COLUMN "transparency";

-- CreateTable
CREATE TABLE "public"."Rating" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "coaching" INTEGER NOT NULL,
    "development" INTEGER NOT NULL,
    "transparency" INTEGER NOT NULL,
    "culture" INTEGER NOT NULL,
    "safety" INTEGER NOT NULL,
    "overall" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Rating_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Rating_reviewId_key" ON "public"."Rating"("reviewId");

-- AddForeignKey
ALTER TABLE "public"."Rating" ADD CONSTRAINT "Rating_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "public"."Review"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
