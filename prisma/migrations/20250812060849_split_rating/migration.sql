/*
  Warnings:

  - A unique constraint covering the columns `[userId,teamId,season]` on the table `Review` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Review_userId_teamId_season_key" ON "public"."Review"("userId", "teamId", "season");
