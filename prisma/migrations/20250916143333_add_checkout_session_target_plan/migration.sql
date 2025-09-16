/*
  Warnings:

  - Added the required column `plan` to the `CheckoutSession` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."CheckoutSession" ADD COLUMN     "plan" "public"."SubscriptionPlan" NOT NULL;
