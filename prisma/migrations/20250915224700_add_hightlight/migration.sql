/*
  Warnings:

  - A unique constraint covering the columns `[isHighlight]` on the table `Review` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Review" ADD COLUMN     "isHighlight" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "only_one_highlight" ON "public"."Review"("isHighlight");
