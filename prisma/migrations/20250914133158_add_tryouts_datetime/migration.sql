/*
  Warnings:

  - You are about to drop the column `date` on the `TryOuts` table. All the data in the column will be lost.
  - You are about to drop the column `time` on the `TryOuts` table. All the data in the column will be lost.
  - Added the required column `datetime` to the `TryOuts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."TryOuts" DROP COLUMN "date",
DROP COLUMN "time",
ADD COLUMN     "datetime" TIMESTAMP(3) NOT NULL;
