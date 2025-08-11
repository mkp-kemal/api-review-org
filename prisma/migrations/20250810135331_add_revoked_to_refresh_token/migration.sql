-- AlterTable
ALTER TABLE "public"."RefreshToken" ADD COLUMN     "revoked" BOOLEAN NOT NULL DEFAULT false;
