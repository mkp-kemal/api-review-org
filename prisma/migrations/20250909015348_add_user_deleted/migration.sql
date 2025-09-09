-- CreateEnum
CREATE TYPE "public"."TypeSystemUpload" AS ENUM ('AWSS3', 'LOCALFOLDER');

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;
