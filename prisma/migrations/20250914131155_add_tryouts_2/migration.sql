/*
  Warnings:

  - A unique constraint covering the columns `[teamId]` on the table `TryOuts` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `teamId` to the `TryOuts` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."TryOuts" DROP CONSTRAINT "TryOuts_id_fkey";

-- AlterTable
ALTER TABLE "public"."TryOuts" ADD COLUMN     "teamId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "TryOuts_teamId_key" ON "public"."TryOuts"("teamId");

-- AddForeignKey
ALTER TABLE "public"."TryOuts" ADD CONSTRAINT "TryOuts_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
