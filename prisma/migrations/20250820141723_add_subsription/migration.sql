/*
  Warnings:

  - A unique constraint covering the columns `[organizationId]` on the table `Subscription` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[teamId]` on the table `Subscription` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Review" ALTER COLUMN "isPublic" SET DEFAULT false;

-- AlterTable
ALTER TABLE "public"."Subscription" ALTER COLUMN "plan" SET DEFAULT 'BASIC',
ALTER COLUMN "stripeCustomerId" DROP NOT NULL,
ALTER COLUMN "stripeSubId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_organizationId_key" ON "public"."Subscription"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_teamId_key" ON "public"."Subscription"("teamId");
