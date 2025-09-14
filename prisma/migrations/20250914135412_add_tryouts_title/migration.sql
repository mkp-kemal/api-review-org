/*
  Warnings:

  - Added the required column `title` to the `TryOuts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."TryOuts" ADD COLUMN     "title" TEXT NOT NULL;
