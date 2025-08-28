/*
  Warnings:

  - A unique constraint covering the columns `[reviewId,reporterUserId]` on the table `Flag` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Team" ADD COLUMN     "claimedById" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Flag_reviewId_reporterUserId_key" ON "public"."Flag"("reviewId", "reporterUserId");

-- AddForeignKey
ALTER TABLE "public"."Team" ADD CONSTRAINT "Team_claimedById_fkey" FOREIGN KEY ("claimedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
