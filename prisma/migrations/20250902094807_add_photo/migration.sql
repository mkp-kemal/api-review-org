-- CreateTable
CREATE TABLE "public"."TeamPhoto" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TeamPhoto_teamId_idx" ON "public"."TeamPhoto"("teamId");

-- AddForeignKey
ALTER TABLE "public"."TeamPhoto" ADD CONSTRAINT "TeamPhoto_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
