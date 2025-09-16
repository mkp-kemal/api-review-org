/*
  Warnings:

  - You are about to drop the column `organizationId` on the `CheckoutSession` table. All the data in the column will be lost.
  - You are about to drop the column `teamId` on the `CheckoutSession` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."CheckoutSession" DROP COLUMN "organizationId",
DROP COLUMN "teamId",
ADD COLUMN     "targetId" TEXT;
