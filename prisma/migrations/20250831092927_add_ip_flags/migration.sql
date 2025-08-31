/*
  Warnings:

  - A unique constraint covering the columns `[reviewId,ip]` on the table `Flag` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `ip` to the `Flag` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Flag" ADD COLUMN     "ip" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Flag_reviewId_ip_key" ON "public"."Flag"("reviewId", "ip");
